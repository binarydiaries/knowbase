export type IntentRow = {
  id: string;
  name: string;
  triggerInstructions: string;
  requiredFields: string[];
  optionalFields: string[];
  config: { success?: string; failure?: string } | null;
  actions: { actionType: string; config?: unknown }[];
};
