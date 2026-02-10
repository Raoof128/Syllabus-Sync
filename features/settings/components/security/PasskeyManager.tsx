'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Input } from '@/components/ui/mq/input';
import {
  Fingerprint,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Smartphone,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TranslationKey } from '@/lib/i18n/translations';
import { toastUtils } from '@/lib/utils/toast';
import { API_ROUTES } from '@/lib/constants/config';

interface PasskeyCredential {
  id: string;
  credentialId: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface PasskeyManagerProps {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

export function PasskeyManager({ t }: PasskeyManagerProps) {
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PasskeyCredential | null>(
    null,
  );
  const [deviceName, setDeviceName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch(API_ROUTES.AUTH.WEBAUTHN_CREDENTIALS);
      if (res.ok) {
        const result = await res.json();
        setCredentials(result?.data?.credentials ?? []);
      }
    } catch {
      // Silent fail — just show empty state
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleAddPasskey = useCallback(async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setAddError('Passkeys are not supported on this device.');
      return;
    }

    setIsLoading(true);
    setAddError(null);
    try {
      // 1. Get registration options
      const optionsRes = await fetch(API_ROUTES.AUTH.WEBAUTHN_REGISTER_OPTIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: deviceName || 'Passkey' }),
      });
      const optionsResult = await optionsRes.json();

      if (!optionsRes.ok || !optionsResult?.data?.options) {
        setAddError(
          optionsResult?.error?.message || 'Failed to start passkey setup',
        );
        return;
      }

      const options = optionsResult.data.options;

      // 2. Create credential via browser API
      const publicKey: PublicKeyCredentialCreationOptions = {
        ...options,
        challenge: base64UrlToUint8Array(options.challenge),
        user: {
          ...options.user,
          id: base64UrlToUint8Array(options.user.id),
        },
        excludeCredentials: (options.excludeCredentials || []).map(
          (c: { id: string; type: PublicKeyCredentialType }) => ({
            ...c,
            id: base64UrlToUint8Array(c.id),
          }),
        ),
      };

      const credential = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential | null;

      if (!credential) {
        setAddError('Passkey creation was cancelled.');
        return;
      }

      // 3. Verify with server
      const attestation =
        credential.response as AuthenticatorAttestationResponse;
      const transports = attestation.getTransports?.() ?? [];

      const verifyRes = await fetch(API_ROUTES.AUTH.WEBAUTHN_REGISTER_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: {
            id: credential.id,
            rawId: bufferToBase64Url(credential.rawId),
            type: credential.type,
            response: {
              clientDataJSON: bufferToBase64Url(attestation.clientDataJSON),
              attestationObject: bufferToBase64Url(
                attestation.attestationObject,
              ),
              transports,
            },
            clientExtensionResults: credential.getClientExtensionResults(),
          },
          deviceName: deviceName || 'Passkey',
        }),
      });

      if (!verifyRes.ok) {
        const result = await verifyRes.json();
        setAddError(result?.error?.message || 'Failed to register passkey');
        return;
      }

      setShowAddDialog(false);
      setDeviceName('');
      toastUtils.success(t('security'), 'Passkey added successfully!');
      fetchCredentials();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : 'Failed to add passkey',
      );
    } finally {
      setIsLoading(false);
    }
  }, [deviceName, fetchCredentials, t]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsLoading(true);
    try {
      const res = await fetch(API_ROUTES.AUTH.WEBAUTHN_CREDENTIALS, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialDbId: deleteTarget.id }),
      });

      if (!res.ok) {
        toastUtils.error(t('error'), 'Failed to remove passkey');
        return;
      }

      setShowDeleteDialog(false);
      setDeleteTarget(null);
      toastUtils.success(t('security'), 'Passkey removed.');
      fetchCredentials();
    } catch {
      toastUtils.error(t('error'), t('tryAgainLater'));
    } finally {
      setIsLoading(false);
    }
  }, [deleteTarget, fetchCredentials, t]);

  return (
    <>
      <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-mq-primary/10 rounded-full">
              <Fingerprint className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-mq-content">
                  Passkeys & Biometrics
                </h3>
                {credentials.length > 0 ? (
                  <Badge className="bg-mq-success/20 text-mq-success">
                    {credentials.length} registered
                  </Badge>
                ) : (
                  <Badge className="bg-mq-content-secondary/20 text-mq-content-secondary">
                    None
                  </Badge>
                )}
              </div>
              <p className="text-mq-sm text-mq-content-secondary">
                Sign in securely with fingerprint, face recognition, or
                security keys.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAddError(null);
              setDeviceName('');
              setShowAddDialog(true);
            }}
            disabled={isLoading || isFetching}
            className="px-3 py-1 text-xs text-mq-primary hover:bg-mq-primary/10"
            data-testid="add-passkey"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        {/* Credential list */}
        {!isFetching && credentials.length > 0 && (
          <div className="mt-3 pt-3 border-t border-mq-border space-y-2">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-2 rounded-lg bg-mq-card-background border border-mq-border/50"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-mq-content-secondary" />
                  <div>
                    <p className="text-sm font-medium text-mq-content">
                      {cred.deviceName}
                    </p>
                    <p className="text-xs text-mq-content-tertiary">
                      Added{' '}
                      {new Date(cred.createdAt).toLocaleDateString()}
                      {cred.lastUsedAt &&
                        ` · Last used ${new Date(cred.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeleteTarget(cred);
                    setShowDeleteDialog(true);
                  }}
                  className="p-1 h-auto text-red-500 hover:bg-red-500/10"
                  aria-label={`Remove ${cred.deviceName}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {isFetching && (
          <div className="mt-3 pt-3 border-t border-mq-border text-center">
            <Loader2 className="h-4 w-4 animate-spin inline-block text-mq-content-secondary" />
          </div>
        )}
      </div>

      {/* Add Passkey Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Add a Passkey
            </DialogTitle>
            <DialogDescription>
              Give your passkey a name to identify it later. Then follow your
              browser&apos;s prompts to register.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              placeholder={t('passkeyNamePlaceholder')}
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              maxLength={100}
              className="h-12"
              autoFocus
            />
            {addError && (
              <div className="flex items-center gap-2 text-red-500 text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>{addError}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowAddDialog(false)}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleAddPasskey} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Register Passkey
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remove Passkey?
            </DialogTitle>
            <DialogDescription>
              Remove &ldquo;{deleteTarget?.deviceName}&rdquo;? You won&apos;t be
              able to use it to sign in anymore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                'Remove Passkey'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// Browser base64url helpers (inline to avoid importing server-side modules)
// ============================================================================

function base64UrlToUint8Array(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const base64 = padded.padEnd(Math.ceil(padded.length / 4) * 4, '=');
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
