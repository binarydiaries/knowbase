export type ChannelSchema = {
  id: string;
  agentId: string;
  enabled: boolean;
  status: 'inactive' | 'active' | 'error';
  additional: {
    type: string;
    config: {
      displayName: string;
      subtitle?: string;
      welcomeMessage: string;
      suggestionQuestions?: Array<string>;
      inputPlaceholder?: string;
      primaryColor: string;
      allowedDomains: Array<string>;
      avatarUrl?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
};
