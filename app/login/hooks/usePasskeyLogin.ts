import { useState, useCallback } from 'react';
import { toastUtils } from '@/lib/utils/toast';
import { API_ROUTES } from '@/lib/constants/config';
import { base64UrlToUint8Array, bufferToBase64Url } from '@/lib/utils/passkey';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

export function usePasskeyLogin() {
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const { t } = useTypedTranslation();

  const loginWithPasskey = useCallback(
    async (email: string, onSuccess: () => void) => {
      if (!email) {
        toastUtils.error(t('emailRequired'), t('emailRequiredPasskey'));
        return;
      }

      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        toastUtils.error(t('notSupported'), t('biometricSetupFailedMsg'));
        return;
      }

      setIsPasskeyLoading(true);

      try {
        // 1. Get Challenge
        const optionsRes = await fetch(API_ROUTES.AUTH.WEBAUTHN_AUTH_OPTIONS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });

        const optionsData = await optionsRes.json();
        if (!optionsRes.ok || !optionsData?.data?.options) {
          throw new Error(t('passkeyLoginInitFailed'));
        }

        const options = optionsData.data.options;

        // 2. Sign Challenge (Browser Native)
        const credential = await navigator.credentials.get({
          publicKey: {
            ...options,
            challenge: base64UrlToUint8Array(options.challenge),
            allowCredentials: options.allowCredentials?.map(
              (c: { id: string; type: PublicKeyCredentialType }) => ({
                ...c,
                id: base64UrlToUint8Array(c.id),
              }),
            ),
          },
        });

        if (!credential) throw new Error(t('biometricAuthenticationCancelled'));

        // 3. Verify Signature
        const assertion = credential as PublicKeyCredential;
        const response = assertion.response as AuthenticatorAssertionResponse;

        const verifyRes = await fetch(API_ROUTES.AUTH.WEBAUTHN_AUTH_VERIFY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: {
              id: assertion.id,
              rawId: bufferToBase64Url(assertion.rawId),
              type: assertion.type,
              response: {
                clientDataJSON: bufferToBase64Url(response.clientDataJSON),
                authenticatorData: bufferToBase64Url(response.authenticatorData),
                signature: bufferToBase64Url(response.signature),
                userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : null,
              },
              clientExtensionResults: assertion.getClientExtensionResults(),
            },
          }),
        });

        if (!verifyRes.ok) throw new Error(t('passkeyVerificationFailed'));

        // 4. Success
        toastUtils.success(t('welcomeBack'), t('loginSuccess'));
        onSuccess();
      } catch (err) {
        console.error(err);
        toastUtils.error(
          t('loginErrorFailed'),
          err instanceof Error ? err.message : t('unexpectedError'),
        );
      } finally {
        setIsPasskeyLoading(false);
      }
    },
    [t],
  );

  return { loginWithPasskey, isPasskeyLoading };
}
