type ChatErrorPayload = {
  code?: string;
  message?: string;
};

export function parseChatError(error: Error): ChatErrorPayload | null {
  try {
    return JSON.parse(error.message) as ChatErrorPayload;
  } catch {
    return null;
  }
}
