import { ChannelService } from '../channel/service';
import { ChatService } from '../chat/service';
import { buildChatContext } from '../chat/context';
import { ConversationService } from '../conversation/service';
import { MessageService } from '../message/service';
import { AiCostEventService } from '../admin/costEvent.service';
import { OrgUsageMonthlyService } from '../subscription/usage';
import type { IChannelWebConfig } from '../channel/model';

interface VoiceSession {
  openAiWs: WebSocket;
  agentId: string;
  orgId: string;
  conversationId: string;
  channelId: string;
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>;
  totalUsage: { inputTokens: number; outputTokens: number; totalTokens: number };
  ended: boolean;
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

    const { knowledgeBase } = await ChatService.getSearchChunks(
      'services business hours contact information location',
      channel.agentId,
    );

    const { systemPrompt } = await buildChatContext({
      agentId: channel.agentId,
      conversationId,
      orgId,
      knowledgeBase,
      behavior,
      hasExistingConversation: false,
      leadAction: undefined,
    });

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
      transcript: [],
      totalUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      ended: false,
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

      case 'response.audio.delta': {
        const audioBuffer = Buffer.from(data.delta as string, 'base64');
        ws.send(audioBuffer);
        break;
      }

      case 'response.audio_transcript.delta':
        ws.send(JSON.stringify({ type: 'transcript', role: 'assistant', text: data.delta }));
        break;

      case 'conversation.item.input_audio_transcription.completed': {
        const text = data.transcript as string;
        if (text?.trim()) {
          session.transcript.push({ role: 'user', content: text });
        }
        ws.send(JSON.stringify({ type: 'transcript', role: 'user', text }));
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
    if (session.openAiWs.readyState === WebSocket.OPEN) {
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

        await MessageService.addMessages(
          session.transcript.map((t) => ({
            conversationId: session.conversationId,
            role: t.role,
            content: t.content,
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
