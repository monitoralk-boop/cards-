import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  xpTarget: number;
  coins: number;
  avatarColor: string;
  avatarEmoji: string;
  isGuest: boolean;
  phone?: string;
  email?: string;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    chkobbaSweeps: number;
    sbaaElHayaCaptures: number;
    totalPoints: number;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  loginAsGuest: (username: string, avatarColor?: string, avatarEmoji?: string) => Promise<void>;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCoins: (amount: number) => Promise<void>;
  addGameResult: (won: boolean, pointsScored: number, sweeps: number, capturedSbaa: boolean) => Promise<void>;
}

const STORAGE_KEY = '@tunisian_cards_user_session';

const defaultUser: UserProfile = {
  id: 'usr-1',
  username: 'monitoralk',
  level: 1,
  xp: 350,
  xpTarget: 2000,
  coins: 1000,
  avatarColor: '#163E27',
  avatarEmoji: '👑',
  isGuest: true,
  stats: {
    gamesPlayed: 18,
    gamesWon: 12,
    chkobbaSweeps: 34,
    sbaaElHayaCaptures: 14,
    totalPoints: 246,
  },
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  loginAsGuest: async () => {},
  loginWithPhone: async () => false,
  loginWithEmail: async () => false,
  logout: async () => {},
  updateCoins: async () => {},
  addGameResult: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setUser(JSON.parse(data));
      } else {
        // Automatically seed with default monitoralk profile on first load
        setUser(defaultUser);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
      }
    } catch (e) {
      setUser(defaultUser);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (updated: UserProfile) => {
    setUser(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save user session:', e);
    }
  };

  const loginAsGuest = async (
    username: string,
    avatarColor = '#163E27',
    avatarEmoji = '👑',
  ) => {
    const newUser: UserProfile = {
      id: `guest-${Date.now()}`,
      username: username.trim() || 'Joueur Tunisien',
      level: 1,
      xp: 0,
      xpTarget: 2000,
      coins: 1000,
      avatarColor,
      avatarEmoji,
      isGuest: true,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        chkobbaSweeps: 0,
        sbaaElHayaCaptures: 0,
        totalPoints: 0,
      },
    };
    await saveUser(newUser);
  };

  const loginWithPhone = async (phone: string, otp: string): Promise<boolean> => {
    if (otp.length < 4) return false;
    const phoneUser: UserProfile = {
      id: `usr-tel-${Date.now()}`,
      username: `TN_${phone.slice(-4)}`,
      level: 1,
      xp: 100,
      xpTarget: 2000,
      coins: 1500, // +500 bonus for verified phone
      avatarColor: '#1A4A2D',
      avatarEmoji: '📱',
      isGuest: false,
      phone,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        chkobbaSweeps: 0,
        sbaaElHayaCaptures: 0,
        totalPoints: 0,
      },
    };
    await saveUser(phoneUser);
    return true;
  };

  const loginWithEmail = async (email: string, _pass: string): Promise<boolean> => {
    const username = email.split('@')[0] || 'Joueur';
    const emailUser: UserProfile = {
      id: `usr-em-${Date.now()}`,
      username,
      level: 1,
      xp: 150,
      xpTarget: 2000,
      coins: 1500,
      avatarColor: '#0E4829',
      avatarEmoji: '🃏',
      isGuest: false,
      email,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        chkobbaSweeps: 0,
        sbaaElHayaCaptures: 0,
        totalPoints: 0,
      },
    };
    await saveUser(emailUser);
    return true;
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  };

  const updateCoins = async (amount: number) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      coins: Math.max(0, user.coins + amount),
    };
    await saveUser(updated);
  };

  const addGameResult = async (
    won: boolean,
    pointsScored: number,
    sweeps: number,
    capturedSbaa: boolean,
  ) => {
    if (!user) return;
    const xpGained = won ? 150 : 50;
    const coinsGained = won ? 200 : 20;

    let newXp = user.xp + xpGained;
    let newLevel = user.level;
    let newTarget = user.xpTarget;

    if (newXp >= newTarget) {
      newLevel += 1;
      newXp = newXp - newTarget;
      newTarget = Math.round(newTarget * 1.5);
    }

    const updated: UserProfile = {
      ...user,
      level: newLevel,
      xp: newXp,
      xpTarget: newTarget,
      coins: user.coins + coinsGained,
      stats: {
        gamesPlayed: user.stats.gamesPlayed + 1,
        gamesWon: user.stats.gamesWon + (won ? 1 : 0),
        chkobbaSweeps: user.stats.chkobbaSweeps + sweeps,
        sbaaElHayaCaptures: user.stats.sbaaElHayaCaptures + (capturedSbaa ? 1 : 0),
        totalPoints: user.stats.totalPoints + pointsScored,
      },
    };
    await saveUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: Boolean(user),
        loginAsGuest,
        loginWithPhone,
        loginWithEmail,
        logout,
        updateCoins,
        addGameResult,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
