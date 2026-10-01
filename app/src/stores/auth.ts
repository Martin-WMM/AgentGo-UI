import { defineStore } from 'pinia';

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
  email?: string;
  avatarUrl?: string;
}

const backendBaseUrl = (
  import.meta.env.VITE_AGENTGO_BACKEND_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const authRequestTimeoutMs = 8_000;
let sessionRequest: Promise<AuthSession> | null = null;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), authRequestTimeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
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
  },

  actions: {
    async loadSession(force = false): Promise<AuthSession> {
      if (!force && this.initialized && this.session) return this.session;
      if (!force && sessionRequest) return sessionRequest;

      this.isLoading = true;
      this.error = null;
      sessionRequest = fetchWithTimeout(`${backendBaseUrl}/api/auth/session`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
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

    async loadProfile(): Promise<UserProfile> {
      const response = await fetchWithTimeout(`${backendBaseUrl}/api/auth/profile`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Profile request failed: ${response.status}`);
      const profile = (await response.json()) as UserProfile;
      this.profile = profile;
      return profile;
    },

    async updateProfile(profile: Omit<UserProfile, 'username'>): Promise<UserProfile> {
      const response = await fetchWithTimeout(`${backendBaseUrl}/api/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!response.ok) throw new Error(`Profile update failed: ${response.status}`);
      const nextProfile = (await response.json()) as UserProfile;
      this.profile = nextProfile;
      if (this.session?.user) {
        this.session.user.name = nextProfile.displayName;
        this.session.user.email = nextProfile.email;
        this.session.user.picture = nextProfile.avatarUrl;
      }
      return nextProfile;
    },
  },
});

export { backendBaseUrl };
