import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GameArena } from '@/components/game/GameArena';
import { RewardedAdModal } from '@/components/ads/RewardedAdModal';
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';

export default function HomeScreen() {
  const { user, updateCoins } = useAuth();
  const [activeGame, setActiveGame] = useState<'chkobba' | 'rami' | null>(null);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);

  const coins = user?.coins ?? 1000;
  const username = user?.username ?? 'monitoralk';
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 350;
  const xpTarget = user?.xpTarget ?? 2000;
  const avatarColor = user?.avatarColor ?? '#163E27';
  const avatarEmoji = user?.avatarEmoji ?? '👑';

  // If in game, render the full GameArena
  if (activeGame) {
    return (
      <GameArena
        gameMode={activeGame}
        onBackToLobby={() => setActiveGame(null)}
      />
    );
  }

  const handleClaimDaily = async () => {
    if (!dailyClaimed) {
      setDailyClaimed(true);
      await updateCoins(500);
    }
  };

  const xpPercent = Math.min(100, Math.round((xp / xpTarget) * 100));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2014" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================================================== */}
        {/* 1. TOP PROFILE & WALLET BAR                          */}
        {/* ==================================================== */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profileSection}
            activeOpacity={0.8}
            onPress={() => setShowLoginModal(true)}
          >
            {/* Avatar with level badge */}
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarEmojiText}>{avatarEmoji}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{level}</Text>
              </View>
            </View>

            {/* Username & XP Bar */}
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.username}>{username}</Text>
                <Feather name="edit-2" size={11} color="#D4AF37" style={{ marginLeft: 4 }} />
              </View>
              <View style={styles.xpRow}>
                <Text style={styles.levelLabel}>Niv. {level}</Text>
                <Text style={styles.xpText}>{xp} / {xpTarget} XP</Text>
              </View>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${xpPercent}%` }]} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Wallet & Settings */}
          <View style={styles.headerRight}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinAmount}>
                {coins >= 1000 ? `${(coins / 1000).toFixed(1)}K` : coins}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => setShowLoginModal(true)}
            >
              <Feather name="user" size={18} color="#D4AF37" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================================== */}
        {/* 2. DAILY REWARD CARD                                 */}
        {/* ==================================================== */}
        <View style={styles.rewardCard}>
          <View style={styles.rewardLeft}>
            <View style={styles.giftIconBox}>
              <Text style={styles.giftEmoji}>🎁</Text>
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Récompense Jour 4</Text>
              <Text style={styles.rewardSubtitle}>
                {dailyClaimed
                  ? 'Récompense réclamée avec succès !'
                  : '+500 pièces vous attendent'}
              </Text>

              {/* Progress Dots */}
              <View style={styles.rewardDotsRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <View
                    key={day}
                    style={[
                      styles.rewardDot,
                      day <= 4 && styles.rewardDotActive,
                      day === 4 && styles.rewardDotCurrent,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleClaimDaily}
            disabled={dailyClaimed}
            style={[
              styles.claimButton,
              dailyClaimed && styles.claimButtonDisabled,
            ]}
          >
            <Text style={styles.claimButtonText}>
              {dailyClaimed ? 'Réclamé' : 'Réclamer >'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ==================================================== */}
        {/* REWARDED AD SPOT: WATCH AD FOR COINS                 */}
        {/* ==================================================== */}
        <View style={styles.adBannerCard}>
          <View style={styles.adBannerLeft}>
            <View style={styles.adIconBox}>
              <Text style={styles.adEmoji}>🎬</Text>
            </View>
            <View style={styles.adInfo}>
              <View style={styles.adTitleRow}>
                <Text style={styles.adTitle}>Regarder une pub</Text>
                <View style={styles.adCoinBadge}>
                  <Text style={styles.adCoinText}>+100 🪙</Text>
                </View>
              </View>
              <Text style={styles.adSubtitle}>
                {adsWatched >= 5
                  ? 'Limite quotidienne atteinte (5/5)'
                  : `Obtenez 100 jetons gratuits (${5 - adsWatched}/5 restants)`}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            disabled={adsWatched >= 5}
            onPress={() => setShowAdModal(true)}
            style={[
              styles.watchAdBtn,
              adsWatched >= 5 && styles.watchAdBtnDisabled,
            ]}
          >
            <Feather name="play" size={14} color="#1A1405" />
            <Text style={styles.watchAdBtnText}>Visionner</Text>
          </TouchableOpacity>
        </View>

        {/* Rewarded Ad Modal */}
        <RewardedAdModal
          visible={showAdModal}
          rewardAmount={100}
          onRewardEarned={async (reward) => {
            await updateCoins(reward);
            setAdsWatched((w) => w + 1);
          }}
          onClose={() => setShowAdModal(false)}
        />

        {/* Login & Profile Customizer Modal */}
        <LoginModal
          visible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />

        {/* ==================================================== */}
        {/* 3. SECTION HEADER                                    */}
        {/* ==================================================== */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>🃏</Text>
            <Text style={styles.sectionTitle}>Choisir un jeu</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Joueurs réels uniquement — aucun robot
          </Text>
        </View>

        {/* ==================================================== */}
        {/* 4. GAME CARD: CHKOBBA TUNISIENNE                    */}
        {/* ==================================================== */}
        <View style={styles.gameCard}>
          {/* Card Banner / Visual */}
          <View style={styles.gameBannerArea}>
            <Text style={styles.gameBannerTitle}>Chkobba</Text>
            <View style={styles.gamePillTags}>
              <View style={styles.gamePill}>
                <Ionicons name="people" size={13} color="#FDE68A" />
                <Text style={styles.gamePillText}>2-4</Text>
              </View>
              <View style={styles.gamePill}>
                <Text style={styles.gamePillCoin}>🪙</Text>
                <Text style={styles.gamePillText}>100+</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.gameCardBody}>
            <Text style={styles.gameName}>Chkobba Tunisienne</Text>
            <Text style={styles.gameDetails}>
              2-4 joueurs · 40 cartes · Traditionnel
            </Text>

            {/* Main Action: Quick Play */}
            <TouchableOpacity
              onPress={() => setActiveGame('chkobba')}
              style={styles.quickPlayBtn}
            >
              <Text style={styles.quickPlayText}>⚡ Partie rapide</Text>
            </TouchableOpacity>

            {/* Secondary Buttons Row */}
            <View style={styles.secondaryBtnRow}>
              <TouchableOpacity
                onPress={() => setActiveGame('chkobba')}
                style={styles.subActionBtn}
              >
                <Feather name="plus-circle" size={14} color="#FDE68A" />
                <Text style={styles.subActionText}>Créer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveGame('chkobba')}
                style={styles.subActionBtn}
              >
                <Feather name="log-in" size={14} color="#FDE68A" />
                <Text style={styles.subActionText}>Rejoindre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ==================================================== */}
        {/* 5. GAME CARD: RAMI TUNISIEN                          */}
        {/* ==================================================== */}
        <View style={styles.gameCard}>
          <View style={[styles.gameBannerArea, styles.ramiBanner]}>
            <Text style={styles.gameBannerTitle}>Rami</Text>
            <View style={styles.gamePillTags}>
              <View style={styles.gamePill}>
                <Ionicons name="people" size={13} color="#FDE68A" />
                <Text style={styles.gamePillText}>2-4</Text>
              </View>
              <View style={styles.gamePill}>
                <Text style={styles.gamePillCoin}>🪙</Text>
                <Text style={styles.gamePillText}>100+</Text>
              </View>
            </View>
          </View>

          <View style={styles.gameCardBody}>
            <Text style={styles.gameName}>Rami Tunisien</Text>
            <Text style={styles.gameDetails}>
              2-4 joueurs · 108 cartes · Melds & Tierce
            </Text>

            <TouchableOpacity
              onPress={() => Alert.alert('Rami indisponible', 'Le mode Rami et ses règles ne sont pas encore implémentés. Jouez à Chkobba pour le moment.')}
              style={[styles.quickPlayBtn, { opacity: 0.65 }]}
            >
              <Text style={styles.quickPlayText}>⚡ Partie rapide</Text>
            </TouchableOpacity>

            <View style={styles.secondaryBtnRow}>
              <TouchableOpacity
              onPress={() => Alert.alert('Rami indisponible', 'Le mode Rami et ses règles ne sont pas encore implémentés.')}
                style={[styles.subActionBtn, { opacity: 0.65 }]}
              >
                <Feather name="plus-circle" size={14} color="#FDE68A" />
                <Text style={styles.subActionText}>Créer</Text>
              </TouchableOpacity>
              <TouchableOpacity
              onPress={() => Alert.alert('Rami indisponible', 'Le mode Rami et ses règles ne sont pas encore implémentés.')}
                style={[styles.subActionBtn, { opacity: 0.65 }]}
              >
                <Feather name="log-in" size={14} color="#FDE68A" />
                <Text style={styles.subActionText}>Rejoindre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#081B12',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A2114',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 90,
  },

  // 1. Header Profile & Wallet
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 18,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#163E27',
    borderColor: '#D4AF37',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmojiText: {
    fontSize: 22,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#D4AF37',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0D2818',
  },
  levelText: {
    color: '#1A1405',
    fontSize: 10,
    fontWeight: '800',
  },
  userInfo: {
    gap: 3,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelLabel: {
    color: '#9EBAA7',
    fontSize: 11,
    fontWeight: '600',
  },
  xpText: {
    color: '#6E8B78',
    fontSize: 10,
  },
  xpTrack: {
    width: 110,
    height: 4,
    backgroundColor: '#173F27',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123321',
    borderColor: '#D4AF37',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  coinIcon: {
    fontSize: 13,
  },
  coinAmount: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 13,
  },
  coinAddBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  settingsBtn: {
    padding: 6,
  },

  // 2. Daily Reward Card
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#102D1E',
    borderRadius: 18,
    padding: 14,
    borderColor: '#28563A',
    borderWidth: 1,
    marginBottom: 20,
  },
  rewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  giftIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1B472E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftEmoji: {
    fontSize: 24,
  },
  rewardInfo: {
    gap: 3,
    flex: 1,
  },
  rewardTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rewardSubtitle: {
    color: '#8DA896',
    fontSize: 11,
  },
  rewardDotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  rewardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1C442D',
  },
  rewardDotActive: {
    backgroundColor: '#D4AF37',
  },
  rewardDotCurrent: {
    width: 12,
    borderRadius: 4,
  },
  claimButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  claimButtonDisabled: {
    backgroundColor: '#1E4730',
  },
  claimButtonText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 12,
  },

  // 3. Section Header
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#769781',
    fontSize: 12,
    marginTop: 2,
  },

  // 4. Game Card
  gameCard: {
    backgroundColor: '#102D1E',
    borderRadius: 20,
    borderColor: '#28563A',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },
  gameBannerArea: {
    height: 124,
    backgroundColor: '#123B27',
    padding: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#28563A',
    position: 'relative',
  },
  ramiBanner: {
    backgroundColor: '#16281E',
  },
  gameBannerTitle: {
    color: '#E8C85E',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gamePillTags: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  gamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  gamePillCoin: {
    fontSize: 10,
  },
  gamePillText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '700',
  },
  gameCardBody: {
    padding: 16,
    gap: 9,
  },
  gameName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  gameDetails: {
    color: '#8DA896',
    fontSize: 13,
    marginBottom: 4,
  },
  quickPlayBtn: {
    backgroundColor: '#E0BD4F',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.24,
    shadowRadius: 6,
    elevation: 3,
  },
  quickPlayText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#183F29',
    borderColor: '#24593B',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  subActionText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },

  // Rewarded Ad Banner Card
  adBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#163E27',
    borderRadius: 14,
    padding: 14,
    borderColor: '#D4AF37',
    borderWidth: 1,
    marginBottom: 20,
  },
  adBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0F2C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderWidth: 1,
  },
  adEmoji: {
    fontSize: 22,
  },
  adInfo: {
    flex: 1,
    gap: 3,
  },
  adTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  adCoinBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  adCoinText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
  },
  adSubtitle: {
    color: '#8DA896',
    fontSize: 11,
  },
  watchAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  watchAdBtnDisabled: {
    backgroundColor: '#1E4730',
  },
  watchAdBtnText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 12,
  },
});

