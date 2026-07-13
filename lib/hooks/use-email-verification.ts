import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth-client';

export function useVerifyRegistrationEmailCode() {
  return useMutation({
    mutationFn: ({ flowId, code }: { flowId: string; code: string }) =>
      authApi.verifyRegistrationEmailCode(flowId, code),
  });
}

export function useVerifyRegistrationEmailToken() {
  return useMutation({
    mutationFn: ({ flowId, token }: { flowId: string; token: string }) =>
      authApi.verifyRegistrationEmailToken(flowId, token),
  });
}

export function useResendRegistrationVerification() {
  return useMutation({
    mutationFn: (flowId: string) =>
      authApi.resendRegistrationVerification(flowId),
  });
}
