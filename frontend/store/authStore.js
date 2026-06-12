import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { disconnectVideoClient, disconnectChatClient } from '@/lib/streamClient';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      skills: [],
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      // ─── Actions ──────────────────────────────────────────────────────────
      login: async (email, password) => {
        set({ isLoading: true });
        const { data } = await api.post('/auth/login', { email, password });
        const { user, accessToken, refreshToken } = data.data;
        localStorage.setItem('knorvex_access_token', accessToken);
        localStorage.setItem('knorvex_refresh_token', refreshToken);
        set({ user, accessToken, refreshToken, isLoading: false });
        return user;
      },

      register: async (payload) => {
        set({ isLoading: true });
        const { data } = await api.post('/auth/register', payload);
        const { user, accessToken, refreshToken } = data.data;
        localStorage.setItem('knorvex_access_token', accessToken);
        localStorage.setItem('knorvex_refresh_token', refreshToken);
        set({ user, accessToken, refreshToken, isLoading: false });
        return user;
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch { /* ignore */ }
        localStorage.removeItem('knorvex_access_token');
        localStorage.removeItem('knorvex_refresh_token');
        
        // Clean up Stream client sessions
        try {
          disconnectVideoClient().catch(() => {});
          disconnectChatClient().catch(() => {});
        } catch (e) {
          console.warn('Stream disconnect failed:', e.message);
        }

        set({ user: null, skills: [], accessToken: null, refreshToken: null });
      },

      fetchMe: async () => {
        const { data } = await api.get('/auth/me');
        set({ user: data.data.user, skills: data.data.skills });
        return data.data;
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
      setSkills: (skills) => set({ skills }),
    }),
    {
      name: 'knorvex-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
