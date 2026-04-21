export interface IChatMessage {
  id: string;
  type: 'system' | 'user';
  message: string;
}
