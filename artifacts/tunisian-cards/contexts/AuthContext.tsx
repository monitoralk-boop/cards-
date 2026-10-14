import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  xpTarget: number;
  coins: number;
  dailyRewardClaimDate?: string;
  ownedCardBacks?: Array<'red' | 'green'>;
  equippedCardBack?: 'red' | 'green';
  ownedTableThemes?: Array<'burgundy' | 'emerald'>;
  equippedTableTheme?: 'burgundy' | 'emerald';
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
  loginAsTestUser: () => Promise<void>;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  loginWithUsername: (username: string, password: string) => Promise<boolean>;
  registerWithUsername: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  claimDailyReward: () => Promise<boolean>;
  purchaseCosmetic: (kind: 'cardBack' | 'tableTheme', item: 'red' | 'green' | 'burgundy' | 'emerald', price: number) => Promise<boolean>;
  equipCosmetic: (kind: 'cardBack' | 'tableTheme', item: 'red' | 'green' | 'burgundy' | 'emerald') => Promise<boolean>;
  addGameResult: (won: boolean, pointsScored: number, sweeps: number, capturedSbaa: boolean) => Promise<void>;
}

const STORAGE_KEY = '@tunisian_cards_user_session';
const ACCOUNTS_KEY = '@tunisian_cards_local_accounts';

const testUser: UserProfile = {
  id: 'test-player',
  username: 'Test Player',
  level: 1,
  xp: 350,
  xpTarget: 2000,
  coins: 1500,
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
  loginAsTestUser: async () => {},
  loginWithPhone: async () => false,
  loginWithEmail: async () => false,
  loginWithUsername: async () => false,
  registerWithUsername: async () => false,
  logout: async () => {},
  updateCoins: async () => {},
  spendCoins: async () => false,
  claimDailyReward: async () => false,
  purchaseCosmetic: async () => false,
  equipCosmetic: async () => false,
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
        const storedUser = JSON.parse(data) as UserProfile;
        if (storedUser && typeof storedUser.username === 'string' && typeof storedUser.coins === 'number') {
          setUser(storedUser);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
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
      coins: 1500,
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
    // Phone verification requires a real SMS provider; never accept a fabricated OTP.
    if (phone.length < 8 || otp.length !== 4) return false;
    return false;
  };

  const loginWithUsername = async (username: string, password: string): Promise<boolean> => {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername || !password) return false;
    try {
      const accounts = JSON.parse((await AsyncStorage.getItem(ACCOUNTS_KEY)) ?? '{}') as Record<string, { password: string; user: UserProfile }>;
      const account = accounts[normalizedUsername];
      if (!account || account.password !== password) return false;
      await saveUser(account.user);
      return true;
    } catch {
      return false;
    }
  };

  const registerWithUsername = async (username: string, password: string): Promise<boolean> => {
    const cleanUsername = username.trim();
    const normalizedUsername = cleanUsername.toLowerCase();
    if (cleanUsername.length < 3 || password.length < 6) return false;
    try {
      const accounts = JSON.parse((await AsyncStorage.getItem(ACCOUNTS_KEY)) ?? '{}') as Record<string, { password: string; user: UserProfile }>;
      if (accounts[normalizedUsername]) return false;
      const newUser: UserProfile = {
        id: `user-${Date.now()}`, username: cleanUsername, level: 1, xp: 0, xpTarget: 2000,
        coins: 1500, avatarColor: '#163E27', avatarEmoji: '👑', isGuest: false,
        stats: { gamesPlayed: 0, gamesWon: 0, chkobbaSweeps: 0, sbaaElHayaCaptures: 0, totalPoints: 0 },
      };
      accounts[normalizedUsername] = { password, user: newUser };
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      await saveUser(newUser);
      return true;
    } catch {
      return false;
    }
  };

  const loginWithEmail = async (username: string, pass: string): Promise<boolean> => {
    return loginWithUsername(username, pass);
  };

  const loginAsTestUser = async () => {
    await saveUser({ ...testUser, stats: { ...testUser.stats } });
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

  const spendCoins = async (amount: number): Promise<boolean> => {
    if (!Number.isSafeInteger(amount) || amount < 0 || !user || user.coins < amount) return false;
    const updated = { ...user, coins: user.coins - amount };
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
      return true;
    } catch (e) {
      console.error('Failed to save coin spend:', e);
      return false;
    }
  };

  const claimDailyReward = async (): Promise<boolean> => {
    if (!user) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (user.dailyRewardClaimDate === today) return false;
    const updated = { ...user, dailyRewardClaimDate: today, coins: user.coins + 500 };
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
      return true;
    } catch (e) {
      console.error('Failed to save daily reward:', e);
      return false;
    }
  };

  const purchaseCosmetic = async (
    kind: 'cardBack' | 'tableTheme',
    item: 'red' | 'green' | 'burgundy' | 'emerald',
    price: number,
  ): Promise<boolean> => {
    if (!Number.isSafeInteger(price) || price < 0 || !user || user.coins < price) return false;
    if (kind === 'cardBack' && item !== 'red' && item !== 'green') return false;
    if (kind === 'tableTheme' && item !== 'burgundy' && item !== 'emerald') return false;
    const ownedCardBacks = user.ownedCardBacks ?? ['red'];
    const ownedTableThemes = user.ownedTableThemes ?? ['burgundy'];
    if (kind === 'cardBack' && ownedCardBacks.includes(item as 'red' | 'green')) return true;
    if (kind === 'tableTheme' && ownedTableThemes.includes(item as 'burgundy' | 'emerald')) return true;
    const updated = kind === 'cardBack'
      ? { ...user, coins: user.coins - price, ownedCardBacks: [...ownedCardBacks, item as 'red' | 'green'] }
      : { ...user, coins: user.coins - price, ownedTableThemes: [...ownedTableThemes, item as 'burgundy' | 'emerald'] };
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
      return true;
    } catch (e) {
      console.error('Failed to save cosmetic purchase:', e);
      return false;
    }
  };

  const equipCosmetic = async (
    kind: 'cardBack' | 'tableTheme',
    item: 'red' | 'green' | 'burgundy' | 'emerald',
  ): Promise<boolean> => {
    if (!user) return false;
    const valid = kind === 'cardBack' ? item === 'red' || item === 'green' : item === 'burgundy' || item === 'emerald';
    if (!valid) return false;
    const owns = kind === 'cardBack'
      ? (user.ownedCardBacks ?? ['red']).includes(item as 'red' | 'green')
      : (user.ownedTableThemes ?? ['burgundy']).includes(item as 'burgundy' | 'emerald');
    if (!owns) return false;
    const updated = kind === 'cardBack' ? { ...user, equippedCardBack: item as 'red' | 'green' } : { ...user, equippedTableTheme: item as 'burgundy' | 'emerald' };
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
      return true;
    } catch (e) {
      console.error('Failed to equip cosmetic:', e);
      return false;
    }
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
        loginAsTestUser,
        loginWithPhone,
        loginWithEmail,
        loginWithUsername,
        registerWithUsername,
        logout,
        updateCoins,
        spendCoins,
        claimDailyReward,
        purchaseCosmetic,
        equipCosmetic,
        addGameResult,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
