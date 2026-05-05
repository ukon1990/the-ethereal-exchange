import { describe, expect, it } from 'vitest';

import {
  buildLoginUrl,
  decryptPayload,
  encryptPayload,
  readAuthConfig,
  sessionNeedsRefresh,
} from './auth-session';

describe('auth session helpers', () => {
  const config = {
    clientId: 'client-123',
    hostedUiBaseUrl: 'https://auth.example.test',
    sessionSecret: 'test-secret',
  };

  it('builds a Cognito hosted UI login URL with PKCE parameters', () => {
    const url = new URL(
      buildLoginUrl({
        config,
        redirectUri: 'https://eu.example.test/auth/callback',
        state: 'state-123',
        codeChallenge: 'challenge-123',
      }),
    );

    expect(url.origin).toBe('https://auth.example.test');
    expect(url.pathname).toBe('/oauth2/authorize');
    expect(url.searchParams.get('client_id')).toBe('client-123');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('redirect_uri')).toBe('https://eu.example.test/auth/callback');
    expect(url.searchParams.get('state')).toBe('state-123');
    expect(url.searchParams.get('code_challenge')).toBe('challenge-123');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('can request the Cognito sign-up screen', () => {
    const url = new URL(
      buildLoginUrl({
        config,
        redirectUri: 'http://localhost:4000/auth/callback',
        state: 'state-123',
        codeChallenge: 'challenge-123',
        screenHint: 'signup',
      }),
    );

    expect(url.searchParams.get('screen_hint')).toBe('signup');
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:4000/auth/callback');
  });

  it('round trips encrypted cookie payloads', () => {
    const payload = { accessToken: 'access', expiresAt: 123 };
    const encrypted = encryptPayload(payload, config.sessionSecret);

    expect(encrypted).not.toContain('access');
    expect(decryptPayload(encrypted, config.sessionSecret)).toEqual(payload);
    expect(decryptPayload(encrypted, 'wrong-secret')).toBeNull();
  });

  it('reads auth config only when all required values are present', () => {
    expect(
      readAuthConfig({
        WAE_COGNITO_CLIENT_ID: 'client-123',
        WAE_COGNITO_HOSTED_UI_BASE_URL: 'https://auth.example.test/',
        WAE_AUTH_SESSION_SECRET: 'secret',
      }),
    ).toEqual({
      clientId: 'client-123',
      hostedUiBaseUrl: 'https://auth.example.test',
      sessionSecret: 'secret',
    });

    expect(readAuthConfig({ WAE_COGNITO_CLIENT_ID: 'client-123' })).toBeNull();
  });

  it('refreshes sessions before access token expiry', () => {
    expect(sessionNeedsRefresh({ accessToken: 'a', idToken: 'i', expiresAt: 120_000 }, 1_000)).toBe(
      false,
    );
    expect(sessionNeedsRefresh({ accessToken: 'a', idToken: 'i', expiresAt: 60_000 }, 1_000)).toBe(
      true,
    );
  });
});
