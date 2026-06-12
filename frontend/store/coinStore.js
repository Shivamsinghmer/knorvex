import { create } from 'zustand';
import api from '@/lib/api';

const useCoinStore = create((set) => ({
  balance: 0,
  ledger: [],
  isLoading: false,

  fetchBalance: async () => {
    const { data } = await api.get('/auth/me');
    const balance = data.data.user.skillCoinBalance;
    set({ balance });
    return balance;
  },

  setBalance: (balance) => set({ balance }),

  addLedgerEntry: (entry) =>
    set((state) => ({
      ledger: [entry, ...state.ledger],
      balance: entry.balanceAfter ?? state.balance,
    })),
}));

export default useCoinStore;
