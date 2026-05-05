import { ChannelService } from '../channel/service';
import { ChatService } from '../chat/service';
import { ConversationService } from '../conversation/service';
import { MessageService } from '../message/service';
import { AiCostEventService } from '../admin/costEvent.service';
import { OrgUsageMonthlyService } from '../subscription/usage';
import type { IChannelWebConfig } from '../channel/model';
import {
  buildPlatformRules,
  buildBehaviorPrompt,
  buildKnowledgeBasePrompt,
} from '../chat/prompts';
import { computeConfidenceScore } from '../chat/persistence';
import type { SearchChunk } from '../chat/persistence';

interface VoiceSession {
  openAiWs: WebSocket;
  agentId: string;
  orgId: string;
  conversationId: string;
  channelId: string;
  /** Platform rules + behavior prompt, without the knowledge base section.
   *  Updated per user turn with fresh RAG results before triggering response. */
  systemPromptPrefix: string;
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>;
  chunks: SearchChunk[];
  totalUsage: { inputTokens: number; outputTokens: number; totalTokens: number };
  ended: boolean;
  /** True after speech is committed, waiting for transcription to do RAG + trigger response. */
  awaitingResponse: boolean;
}

interface WsHandle {
  id: string;
  data: { query: { channelId: string; orgId: string; conversationId: string } };
  send(data: string | Buffer | ArrayBuffer): void;
  close(): void;
}

const sessions = new Map<string, VoiceSession>();

export abstract class VoiceService {
  static async open(ws: WsHandle) {
    const { channelId, orgId, conversationId } = ws.data.query;

    const betaOrgs = (process.env.VOICE_BETA_ORG_IDS ?? '').split(',').filter(Boolean);
    if (betaOrgs.length > 0 && !betaOrgs.includes(orgId)) {
      ws.send(JSON.stringify({ type: 'error', code: 'NOT_IN_BETA', message: 'Voice not available on your plan' }));
      ws.close();
      return;
    }

    const channel = await ChannelService.single({ id: channelId, orgId });
    if (!channel || channel.type !== 'web') {
      ws.send(JSON.stringify({ type: 'error', code: 'NOT_FOUND', message: 'Channel not found' }));
      ws.close();
      return;
    }

    const config = channel.config as IChannelWebConfig;
    if (!config.voiceEnabled) {
      ws.send(JSON.stringify({ type: 'error', code: 'VOICE_DISABLED', message: 'Voice not enabled on this channel' }));
      ws.close();
      return;
    }

    await ChatService.getAgent({ agentId: channel.agentId, orgId });
    const behavior = await ChatService.getBehaviour(channel.agentId);

    // Build the non-knowledge portion of the system prompt. This prefix is
    // reused every turn — only the knowledge section changes based on the
    // user's actual question.
    const systemPromptPrefix = [
      buildPlatformRules({ hasLeadCollection: false }),
      buildBehaviorPrompt(behavior),
    ].join('\n');

    // Seed the initial knowledge using the agent's own behavior description so
    // we fetch semantically relevant content rather than a generic phrase.
    const seedQuery = behavior.systemPrompt?.slice(0, 300) || 'general information';
    const { knowledgeBase: initialKnowledgeBase, chunks: initialChunks } =
      await ChatService.getSearchChunks(seedQuery, channel.agentId, orgId, conversationId);

    const systemPrompt = systemPromptPrefix + '\n' + buildKnowledgeBasePrompt(initialKnowledgeBase);

    const ttsVoice = (config as IChannelWebConfig & { ttsVoice?: string }).ttsVoice ?? 'alloy';

    const openAiWs = new WebSocket(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'OpenAI-Beta': 'realtime=v1' } } as unknown as string[],
    );

    const session: VoiceSession = {
      openAiWs,
      agentId: channel.agentId,
      orgId,
      conversationId,
      channelId,
      systemPromptPrefix,
      transcript: [],
      chunks: initialChunks,
      totalUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      ended: false,
      awaitingResponse: false,
    };
    sessions.set(ws.id, session);

    openAiWs.onopen = () => {
      openAiWs.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['audio', 'text'],
          voice: ttsVoice,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: { model: 'whisper-1' },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
            // Disable auto-response so we can inject per-turn RAG knowledge
            // before the model starts generating.
            create_response: false,
          },
          instructions: systemPrompt,
        },
      }));
    };

    openAiWs.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data as string) as Record<string, unknown>;
        await VoiceService._handleOpenAiEvent(ws, session, data);
      } catch (err) {
        console.error('[voice] Failed to handle OpenAI event:', err);
      }
    };

    openAiWs.onerror = () => {
      try { ws.send(JSON.stringify({ type: 'error', message: 'OpenAI connection error' })); } catch {}
    };

    openAiWs.onclose = () => {
      if (!session.ended) {
        try { ws.send(JSON.stringify({ type: 'ended' })); } catch {}
      }
    };
  }

  private static async _handleOpenAiEvent(
    ws: WsHandle,
    session: VoiceSession,
    data: Record<string, unknown>,
  ) {
    switch (data.type) {
      case 'session.updated':
        ws.send(JSON.stringify({ type: 'connected' }));
        break;

      case 'input_audio_buffer.committed':
        // Audio committed — wait for transcription before triggering response.
        session.awaitingResponse = true;
        break;

      case 'response.audio.delta': {
        const audioBuffer = Buffer.from(data.delta as string, 'base64');
        ws.send(audioBuffer);
        break;
      }

      case 'response.audio_transcript.delta':
        ws.send(JSON.stringify({ type: 'transcript', role: 'assistant', text: data.delta }));
        break;

      case 'conversation.item.input_audio_transcription.completed': {
        const text = (data.transcript as string) ?? '';
        const trimmed = text.trim();

        if (trimmed) {
          session.transcript.push({ role: 'user', content: trimmed });
          ws.send(JSON.stringify({ type: 'transcript', role: 'user', text: trimmed }));
        }

        if (session.awaitingResponse) {
          session.awaitingResponse = false;

          if (trimmed) {
            // Fetch knowledge relevant to what the user actually asked.
            try {
              const { knowledgeBase, chunks } = await ChatService.getSearchChunks(
                trimmed,
                session.agentId,
                session.orgId,
                session.conversationId,
              );
              session.chunks = chunks;
              const updatedPrompt =
                session.systemPromptPrefix + '\n' + buildKnowledgeBasePrompt(knowledgeBase);
              session.openAiWs.send(JSON.stringify({
                type: 'session.update',
                session: { instructions: updatedPrompt },
              }));
            } catch (err) {
              console.error('[voice] RAG search failed, continuing with current knowledge:', err);
            }
          }

          // Trigger the model to generate a response now.
          session.openAiWs.send(JSON.stringify({ type: 'response.create' }));
        }
        break;
      }

      case 'response.done': {
        const response = data.response as Record<string, unknown>;
        const output = (response?.output ?? []) as Array<Record<string, unknown>>;
        for (const item of output) {
          if (item.type !== 'message') continue;
          const content = (item.content ?? []) as Array<Record<string, unknown>>;
          for (const c of content) {
            const text = (c.type === 'audio' ? c.transcript : c.type === 'text' ? c.text : null) as string | null;
            if (text?.trim()) {
              session.transcript.push({ role: 'assistant', content: text });
            }
          }
        }
        const usage = response?.usage as Record<string, number> | undefined;
        if (usage) {
          session.totalUsage.inputTokens += usage.input_tokens ?? 0;
          session.totalUsage.outputTokens += usage.output_tokens ?? 0;
          session.totalUsage.totalTokens += usage.total_tokens ?? 0;
        }
        break;
      }

      case 'error': {
        const error = data.error as Record<string, unknown>;
        console.error('[voice] OpenAI error event:', error);
        ws.send(JSON.stringify({ type: 'error', message: error?.message ?? 'Unknown error' }));
        break;
      }
    }
  }

  static message(ws: WsHandle, message: unknown) {
    const session = sessions.get(ws.id);
    if (!session || session.ended) return;

    if (message instanceof Buffer || message instanceof ArrayBuffer) {
      const buf = message instanceof ArrayBuffer ? Buffer.from(message) : message;
      if (session.openAiWs.readyState === WebSocket.OPEN) {
        session.openAiWs.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: buf.toString('base64'),
        }));
      }
      return;
    }

    if (typeof message === 'string') {
      try {
        const data = JSON.parse(message) as { type: string };
        if (data.type === 'end_call') {
          void VoiceService._endCall(ws, session);
        }
      } catch {}
    }
  }

  static close(ws: WsHandle) {
    const session = sessions.get(ws.id);
    if (!session) return;
    sessions.delete(ws.id);
    // Persist transcript even when the browser disconnects without sending end_call.
    if (!session.ended) {
      void VoiceService._endCall(ws, session);
    } else if (session.openAiWs.readyState === WebSocket.OPEN) {
      session.openAiWs.close();
    }
  }

  private static async _endCall(ws: WsHandle, session: VoiceSession) {
    if (session.ended) return;
    session.ended = true;

    if (session.openAiWs.readyState === WebSocket.OPEN) {
      session.openAiWs.close();
    }

    try {
      if (session.transcript.length > 0) {
        const lastUser = [...session.transcript].reverse().find((t) => t.role === 'user');
        const lastAssistant = [...session.transcript].reverse().find((t) => t.role === 'assistant');

        await ConversationService.create({
          id: session.conversationId,
          agentId: session.agentId,
          channelId: session.channelId,
          lastUserQuestion: lastUser?.content ?? '',
          lastAssistantUtterance: lastAssistant?.content ?? '',
          lastMessageAt: new Date(),
        });

        const confidenceScore = computeConfidenceScore(session.chunks);
        const sources = session.chunks.map((c) => ({
          documentId: c.documentId,
          documentVersion: c.documentVersion,
          chunkIndex: c.chunkIndex,
          similarity: c.similarity,
        }));

        await MessageService.addMessages(
          session.transcript.map((t) => ({
            conversationId: session.conversationId,
            role: t.role,
            content: t.content,
            ...(t.role === 'assistant'
              ? { metadata: { confidenceScore, sources, sentiment: null } }
              : {}),
          })),
        );
      }

      if (session.totalUsage.totalTokens > 0) {
        await AiCostEventService.recordEvent({
          orgId: session.orgId,
          agentId: session.agentId,
          conversationId: session.conversationId,
          provider: 'openai',
          model: 'gpt-4o-realtime-preview',
          usage: session.totalUsage,
          metadata: { operation: 'voice-call' },
        });
      }

      await OrgUsageMonthlyService.incrementAssistantMessages(session.orgId);
    } catch (err) {
      console.error('[voice] Error persisting call data:', err);
    }

    try { ws.send(JSON.stringify({ type: 'ended' })); } catch {}
  }
}
