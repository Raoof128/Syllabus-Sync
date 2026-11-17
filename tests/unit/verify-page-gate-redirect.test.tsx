import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => searchParams,
}));

vi.mock('@/lib/hooks/useTypedTranslation', () => ({
  useTypedTranslation: () => ({ t: (key: string) => key }),
}));

import VerifyPage from '@/app/verify/page';

/**
 * The middleware's email-verification gate redirects a signed-in but
 * unconfirmed user to /verify?reason=unverified — with no token. That used to
 * fall into the page's only non-token state, "Verification Failed / Invalid or
 * expired verification link", telling the user their link was broken when
 * nothing was wrong with it and no link had been clicked.
 */
describe('/verify — arrival from the middleware email gate', () => {
  beforeEach(() => {
    for (const key of [...searchParams.keys()]) searchParams.delete(key);
    vi.restoreAllMocks();
  });

  it('shows check-your-inbox, not an invalid-link error, when sent by the gate', async () => {
    searchParams.set('reason', 'unverified');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<VerifyPage />);

    expect(screen.getByText('verifyEmail')).toBeInTheDocument();
    expect(screen.getByText('verificationEmailSent')).toBeInTheDocument();
    expect(screen.queryByText('verificationFailed')).not.toBeInTheDocument();
    expect(screen.queryByText('invalidVerificationLink')).not.toBeInTheDocument();
    // No token to redeem, so the page must not call the verify endpoint.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('still rejects a malformed token as an invalid link', async () => {
    searchParams.set('token', 'not-a-valid-token');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<VerifyPage />);

    expect(screen.getByText('verificationFailed')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('redeems a well-formed token and reports success', async () => {
    searchParams.set('token', 'a'.repeat(64));
    const fetchSpy = vi.fn().mockResolvedValue({
      json: async () => ({ data: { verified: true } }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(<VerifyPage />);

    await waitFor(() => expect(screen.getByText('emailVerified')).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
