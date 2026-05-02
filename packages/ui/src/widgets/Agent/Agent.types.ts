export interface IChatMessage {
  id: string;
  type: 'system' | 'user';
  message: string;
}

export interface IAgentVoiceProps {
  voiceEnabled?: boolean;
  onStartCall?: () => void;
}
