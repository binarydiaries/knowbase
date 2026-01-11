export interface IChatMessage {
  type: 'system' | 'user';
  message: string;
}
