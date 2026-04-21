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
      inputPlaceholder?: string;
      primaryColor: string;
      allowedDomains: Array<string>;
    };
  };
  createdAt: string;
  updatedAt: string;
};
