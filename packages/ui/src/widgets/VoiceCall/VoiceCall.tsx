import { Button } from '@knowbase/ui/components/button';
import { PhoneOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type CallStatus = 'connecting' | 'active' | 'ended' | 'error';

export interface VoiceCallProps {
  wsUrl: string;
  agentName: string;
  primaryColor: string;
  onClose: () => void;
}

export const VoiceCall = ({ wsUrl, agentName, primaryColor, onClose }: VoiceCallProps) => {
  const [status, setStatus] = useState<CallStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    wsRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  }, []);

  const playPcm16 = useCallback((buffer: ArrayBuffer) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const dataView = new DataView(buffer);
    const numSamples = buffer.byteLength / 2;
    const float32 = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      float32[i] = dataView.getInt16(i * 2, true) / 0x8000;
    }
    const audioBuffer = ctx.createBuffer(1, numSamples, 24000);
    audioBuffer.copyToChannel(float32, 0);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    source.start(startAt);
    nextPlayTimeRef.current = startAt + audioBuffer.duration;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        if (!cancelled) {
          setErrorMessage('Microphone permission denied.');
          setStatus('error');
        }
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const context = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = context;
      nextPlayTimeRef.current = context.currentTime;

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        const float32 = e.inputBuffer.getChannelData(0);
        const pcm16 = float32ToPcm16(float32);
        wsRef.current.send(pcm16);
      };

      source.connect(processor);
      processor.connect(context.destination);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = 'arraybuffer';

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          playPcm16(event.data);
        } else if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data) as Record<string, unknown>;
            if (msg.type === 'connected') setStatus('active');
            else if (msg.type === 'ended') { setStatus('ended'); cleanup(); }
            else if (msg.type === 'error') { setErrorMessage(msg.message as string); setStatus('error'); }
          } catch {}
        }
      };

      ws.onerror = () => {
        if (!cancelled) { setErrorMessage('Connection failed. Please try again.'); setStatus('error'); }
        cleanup();
      };

      ws.onclose = () => {
        if (!cancelled) setStatus((s) => (s === 'active' || s === 'connecting' ? 'ended' : s));
      };
    };

    void start();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [wsUrl, playPcm16, cleanup]);

  const endCall = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'end_call' }));
    setStatus('ended');
    cleanup();
  }, [cleanup]);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-3xl">
      <div className="w-72 rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border border-border">
        <div className="p-6 text-center text-white" style={{ backgroundColor: primaryColor }}>
          <p className="text-sm font-medium opacity-80 mb-1">
            {status === 'connecting' ? 'Connecting…' : status === 'active' ? 'On a call with' : 'Call ended'}
          </p>
          <p className="text-xl font-bold">{agentName}</p>
        </div>

        <div className="flex items-center justify-center py-8 min-h-24">
          {status === 'active' && (
            <div className="flex gap-1 items-end h-10">
              {[14, 22, 10, 28, 16, 20, 12].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full opacity-80"
                  style={{
                    backgroundColor: primaryColor,
                    height: `${h}px`,
                    animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}
          {(status === 'connecting') && (
            <p className="text-sm text-muted-foreground">Connecting…</p>
          )}
          {(status === 'ended') && (
            <p className="text-sm text-muted-foreground">Call ended</p>
          )}
          {status === 'error' && (
            <p className="text-sm text-destructive text-center px-4">{errorMessage ?? 'Something went wrong'}</p>
          )}
        </div>

        <div className="pb-6 flex justify-center gap-3">
          {status === 'active' && (
            <Button
              variant="destructive"
              className="rounded-full w-14 h-14 p-0 shadow-lg"
              onClick={endCall}
              aria-label="End call"
            >
              <PhoneOff className="size-5" />
            </Button>
          )}
          {(status === 'ended' || status === 'error') && (
            <Button variant="outline" className="rounded-full px-6" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

function float32ToPcm16(float32: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}
