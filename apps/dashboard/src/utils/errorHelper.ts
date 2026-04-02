import type { AxiosError } from 'axios';

type ErrorResponse = {
  message?: string;
};

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  const axiosError = error as AxiosError<ErrorResponse>;
  const backendMessage = axiosError.response?.data?.message;

  if (backendMessage) {
    return backendMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
