import { create } from 'zustand';
import { User, Event } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await api.login(email, password);
    localStorage.setItem('token', response.token);
    set({ user: response.user, token: response.token });
  },

  register: async (email: string, password: string, name: string) => {
    const response = await api.register(email, password, name);
    localStorage.setItem('token', response.token);
    set({ user: response.user, token: response.token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const response = await api.getMe();
      set({ user: response.user, token, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));

interface AppState {
  events: Event[];
  users: User[];
  isLoading: boolean;
  fetchEvents: () => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  events: [],
  users: [],
  isLoading: false,

  fetchEvents: async () => {
    set({ isLoading: true });
    try {
      const response = await api.getAllEvents();
      set({ events: response.events, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchUsers: async () => {
    try {
      const response = await api.getAllUsers();
      set({ users: response.users });
    } catch (error) {
      throw error;
    }
  },
}));
