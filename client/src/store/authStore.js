import { create } from 'zustand';
import api from '../services/api';
import { getSocket } from '../services/socket';

const TOKEN_KEY = 'token';

const readToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

const disconnectSocket = () => {
  const socket = getSocket();
  if (socket) {
    socket.disconnect();
  }
};

const connectSocketForUser = (userId) => {
  const socket = getSocket();
  if (socket && userId) {
    socket.connect();
    socket.emit('join', userId);
  }
};

const initialToken = readToken();

const useAuthStore = create((set, get) => ({
  user: null,
  token: initialToken,
  isAuthenticated: !!initialToken,
  loading: false,
  error: null,

  initialize: async () => {
    const token = readToken();
    if (!token) {
      disconnectSocket();
      set({ user: null, isAuthenticated: false, loading: false, token: null });
      return;
    }

    set({ loading: true, token, isAuthenticated: true });

    try {
      const response = await api.get('/auth/me');
      set({
        user: response.data.user,
        token,
        isAuthenticated: true,
        loading: false
      });

      disconnectSocket();
      connectSocketForUser(response.data.user.id);
    } catch (err) {
      console.error('Initialize Auth Error:', err);
      localStorage.removeItem(TOKEN_KEY);
      disconnectSocket();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      });
    }
  },

  /**
   * Sync this tab when another tab changes localStorage.token
   * (storage events fire only on *other* documents, not the writer tab).
   */
  syncFromStorage: async () => {
    const token = readToken();
    const { token: currentToken, user, loading } = get();

    // Already in sync with shared storage
    if (token === currentToken) {
      if (!token) return;
      if (user || loading) return;
    }

    if (!token) {
      disconnectSocket();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
      return;
    }

    set({ token, isAuthenticated: true, user: null });
    await get().initialize();
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password });
      set({ loading: false });
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem(TOKEN_KEY, token);
      set({
        token,
        user,
        isAuthenticated: true,
        loading: false
      });

      disconnectSocket();
      connectSocketForUser(user.id);

      return user;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Login failed';
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    disconnectSocket();

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  }
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== TOKEN_KEY && event.key !== null) return;
    // key === null means clear() — treat as logout
    if (event.key === null || event.key === TOKEN_KEY) {
      useAuthStore.getState().syncFromStorage();
    }
  });

  // Same-tab 401 handler (api.js) clears token without a storage event
  window.addEventListener('campusfix:token-cleared', () => {
    useAuthStore.getState().syncFromStorage();
  });

  // When returning to a tab, re-read shared token (covers missed edge cases)
  window.addEventListener('focus', () => {
    useAuthStore.getState().syncFromStorage();
  });
}

export default useAuthStore;
