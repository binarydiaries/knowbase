import type { IChannelWebConfig } from './model';

export const CHANNEL_CONFIG_DEFAULTS: Partial<IChannelWebConfig> = {
  allowedDomains: [],
  inputPlaceholder: 'Type your message...',
  primaryColor: '#000000',
  suggestionQuestions: [],
  subtitle: 'Virtual Assistant',
  welcomeMessage: 'Hi, How can i help you?',
};
