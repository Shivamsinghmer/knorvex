import { create } from 'zustand';
import api from '@/lib/api';

const useSessionStore = create((set, get) => ({
  sessions: [],
  upcoming: [],
  activeSession: null,
  isLoading: false,

  fetchSessions: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/sessions', { params });
      set({ sessions: data.data, isLoading: false });
      return data.data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  fetchUpcoming: async () => {
    try {
      const { data } = await api.get('/sessions/upcoming');
      set({ upcoming: data.data });
      return data.data;
    } catch {
      return [];
    }
  },

  setActiveSession: (session) => set({ activeSession: session }),

  bookSession: async (payload) => {
    const { data } = await api.post('/sessions', payload);
    set((state) => ({ sessions: [data.data, ...state.sessions] }));
    return data.data;
  },

  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s._id === sessionId ? { ...s, ...updates } : s
      ),
      activeSession:
        state.activeSession?._id === sessionId
          ? { ...state.activeSession, ...updates }
          : state.activeSession,
    })),
}));

export default useSessionStore;
