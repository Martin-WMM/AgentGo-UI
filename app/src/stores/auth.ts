import { defineStore } from 'pinia';

import { backendRequestHeaders } from '../api/locale';

export interface AuthUser {
  subject: string;
  name: string;
  email?: string;
  picture?: string;
}

export interface AuthSession {
  authenticated: boolean;
  user?: AuthUser;
}

export interface UserProfile {
  username: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  description?: string | null;
  occupation?: string | null;
  organization?: string | null;
  homepageUrl?: string | null;
  location?: string | null;
  timezone?: string | null;
  preferredLanguage?: string | null;
}

const backendBaseUrl = (
  import.meta.env.VITE_AGENTGO_BACKEND_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const authRequestTimeoutMs = 8_000;
let sessionRequest: Promise<AuthSession> | null = null;

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message?.trim() ?? '';
  } catch {
    return '';
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), authRequestTimeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      headers: backendRequestHeaders(init?.headers),
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as AuthSession | null,
    profile: null as UserProfile | null,
    isLoading: false,
    initialized: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => state.session?.authenticated === true,
    user: (state) => state.session?.user,
    /** Prefer the AgentGo profile avatar; OIDC `picture` is often absent from Authentik. */
    avatarUrl: (state) => state.profile?.avatarUrl ?? state.session?.user?.picture ?? null,
  },

  actions: {
    async loadSession(force = false): Promise<AuthSession> {
      if (!force && this.initialized && this.session) return this.session;
      if (!force && sessionRequest) return sessionRequest;

      this.isLoading = true;
      this.error = null;
      sessionRequest = fetchWithTimeout(`${backendBaseUrl}/api/auth/session`, {
        credentials: 'include',
      })
        .then(async (response) => {
          if (response.status === 401) return { authenticated: false };
          if (!response.ok) throw new Error(`Session request failed: ${response.status}`);

          const body = (await response.json()) as {
            authenticated: boolean;
            subject?: string;
            name?: string;
            email?: string;
            picture?: string;
          };
          return {
            authenticated: body.authenticated,
            user: body.authenticated
              ? {
                  subject: body.subject ?? '',
                  name: body.name ?? '',
                  email: body.email,
                  picture: body.picture,
                }
              : undefined,
          };
        })
        .catch((error: unknown) => {
          this.error = error instanceof Error ? error.message : 'Session request failed';
          return { authenticated: false };
        })
        .then((nextSession) => {
          this.session = nextSession;
          this.initialized = true;
          if (nextSession.authenticated) {
            // Header avatar comes from profile, not the OIDC picture claim.
            void this.loadProfile().catch(() => undefined);
          } else {
            this.profile = null;
          }
          return nextSession;
        })
        .finally(() => {
          this.isLoading = false;
          sessionRequest = null;
        });

      return sessionRequest;
    },

    login() {
      window.location.assign(`${backendBaseUrl}/api/auth/login`);
    },

    logout() {
      this.clearSession();
      // Use a top-level navigation so the backend can complete the OIDC logout redirect.
      window.location.assign(`${backendBaseUrl}/api/auth/logout`);
    },

    clearSession() {
      this.session = { authenticated: false };
      this.profile = null;
      this.initialized = true;
      this.error = null;
      sessionRequest = null;
    },

    syncSessionIdentity(profile: UserProfile) {
      if (!this.session?.user) return;
      this.session.user.name = profile.displayName;
      this.session.user.email = profile.email ?? undefined;
      this.session.user.picture = profile.avatarUrl ?? undefined;
    },

    /** Updates the in-memory avatar after upload so the header matches Settings before save. */
    setAvatarUrl(avatarUrl: string | null) {
      if (this.profile) {
        this.profile = { ...this.profile, avatarUrl };
      }
      if (this.session?.user) {
        this.session.user.picture = avatarUrl ?? undefined;
      }
    },

    async loadProfile(): Promise<UserProfile> {
      const response = await fetchWithTimeout(`${backendBaseUrl}/api/auth/profile`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const profile = (await response.json()) as UserProfile;
      this.profile = profile;
      this.syncSessionIdentity(profile);
      return profile;
    },

    async updateProfile(profile: Omit<UserProfile, 'username'>): Promise<UserProfile> {
      const response = await fetchWithTimeout(`${backendBaseUrl}/api/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const nextProfile = (await response.json()) as UserProfile;
      this.profile = nextProfile;
      this.syncSessionIdentity(nextProfile);
      return nextProfile;
    },
  },
});

export { backendBaseUrl };
