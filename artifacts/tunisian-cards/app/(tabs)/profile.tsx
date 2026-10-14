import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Switch,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/auth/LoginModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  // Settings states
  const [soundEffects, setSoundEffects] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'ar' | 'fr'>('fr');

  const username = user?.username ?? 'Joueur';
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const xpTarget = user?.xpTarget ?? 2000;
  const avatarColor = user?.avatarColor ?? '#163E27';
  const avatarEmoji = user?.avatarEmoji ?? '👑';
  const isGuest = user?.isGuest ?? true;

  const statsData = user?.stats ?? { gamesPlayed: 0, gamesWon: 0, chkobbaSweeps: 0, sbaaElHayaCaptures: 0, totalPoints: 0 };

  const winRate =
    statsData.gamesPlayed > 0
      ? ((statsData.gamesWon / statsData.gamesPlayed) * 100).toFixed(1) + '%'
      : '0%';

  const stats = [
    { label: 'Parties Jouées', value: `${statsData.gamesPlayed}`, icon: 'gamepad-variant-outline' },
    { label: 'Victoires', value: `${statsData.gamesWon}`, icon: 'trophy-outline' },
    { label: 'Taux de Victoire', value: winRate, icon: 'chart-line' },
    { label: 'Total Chkobba 🔥', value: `${statsData.chkobbaSweeps}`, icon: 'cards-playing-outline' },
    { label: '7 الحيّة Capturés', value: `${statsData.sbaaElHayaCaptures}`, icon: 'star-outline' },
    { label: 'Points Totaux', value: `${statsData.totalPoints}`, icon: 'counter' },
  ];

  const matchHistory = [
    { id: 'm-1', type: 'Chkobba 1v1', result: 'Victoire', score: '21 - 18', date: 'Aujourd’hui', gain: '+200 🪙' },
    { id: 'm-2', type: 'Chkobba 1v1', result: 'Victoire', score: '22 - 14', date: 'Hier', gain: '+500 🪙' },
    { id: 'm-3', type: 'Chkobba 2v2', result: 'Défaite', score: '15 - 21', date: 'Il y a 2j', gain: '-100 🪙' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter de cette session ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            setShowLoginModal(true);
          },
        },
      ]
    );
  };

  const xpPercent = Math.min(100, Math.round((xp / xpTarget) * 100));

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0) }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatarLarge, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarLargeEmoji}>{avatarEmoji}</Text>
            <View style={styles.levelTag}>
              <Text style={styles.levelTagText}>{level}</Text>
            </View>
          </View>

          <Text style={styles.username}>{username}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, isGuest ? styles.guestBadge : styles.verifiedBadge]}>
              <Text style={styles.statusBadgeText}>
                {isGuest ? '👤 Mode Invité' : user?.phone ? '📱 Téléphone vérifié' : '📧 Email vérifié'}
              </Text>
            </View>
          </View>
          <Text style={styles.playerTitle}>Joueur Passionné · Chkobba & Rami 🇹🇳</Text>

          {/* XP Progression */}
          <View style={styles.xpBox}>
            <View style={styles.xpTextRow}>
              <Text style={styles.xpLabel}>Niveau {level}</Text>
              <Text style={styles.xpValue}>
                {xp} / {xpTarget} XP ({xpPercent}%)
              </Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpPercent}%` }]} />
            </View>
          </View>

          {/* Action Buttons: Edit / Change Account */}
          <View style={styles.profileActionsRow}>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => setShowLoginModal(true)}
            >
              <Feather name="edit-2" size={14} color="#1A1405" />
              <Text style={styles.editProfileBtnText}>Modifier Profil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchAccountBtn}
              onPress={() => setShowLoginModal(true)}
            >
              <Feather name="user-check" size={14} color="#D4AF37" />
              <Text style={styles.switchAccountBtnText}>Se Connecter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Grid */}
        <Text style={styles.sectionTitle}>📊 Statistiques de Jeu</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Match History */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          📜 Historique des Parties
        </Text>
        <View style={styles.historyList}>
          {matchHistory.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyType}>{item.type}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>

              <View style={styles.historyCenter}>
                <Text
                  style={[
                    styles.historyResult,
                    item.result === 'Victoire'
                      ? styles.victoryText
                      : styles.defeatText,
                  ]}
                >
                  {item.result}
                </Text>
                <Text style={styles.historyScore}>{item.score}</Text>
              </View>

              <Text
                style={[
                  styles.historyGain,
                  item.gain.startsWith('+') ? styles.gainPositive : styles.gainNegative,
                ]}
              >
                {item.gain}
              </Text>
            </View>
          ))}
        </View>

        {/* Settings Links */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          ⚙️ Paramètres & Règles
        </Text>
        <View style={styles.settingsList}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLangModal(true)}
          >
            <View style={styles.settingLeft}>
              <Feather name="globe" size={18} color="#D4AF37" />
              <Text style={styles.settingText}>
                Langue ({selectedLang === 'ar' ? 'العربية' : 'Français'})
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color="#8DA896" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowAudioModal(true)}
          >
            <View style={styles.settingLeft}>
              <Feather name="volume-2" size={18} color="#D4AF37" />
              <Text style={styles.settingText}>Effets Sonores & Musique</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#8DA896" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowRulesModal(true)}
          >
            <View style={styles.settingLeft}>
              <Feather name="shield" size={18} color="#D4AF37" />
              <Text style={styles.settingText}>Règles Officielles Chkobba Tunisienne</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#8DA896" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <Feather name="log-out" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>Se Déconnecter</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ==================================================== */}
        {/* MODAL 1: RULES EXPLANATION MODAL                     */}
        {/* ==================================================== */}
        <Modal visible={showRulesModal} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.rulesModalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>قواعد الشكبة التونسية</Text>
                <TouchableOpacity onPress={() => setShowRulesModal(false)}>
                  <Feather name="x" size={24} color="#D4AF37" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <Text style={styles.ruleIntro}>
                  لعبة الشكبة التونسية التقليدية تُلعب بـ 40 ورقة. تنتهي الجولة عند استنفاد أوراق السحب وتُحسب النقاط الخمس الأساسية:
                </Text>

                <View style={styles.ruleItem}>
                  <Text style={styles.ruleBadge}>1. الكارطة (Carta)</Text>
                  <Text style={styles.ruleDesc}>
                    اللاعب أو الفريق الذي يجمع أكثر من 20 ورقة (أغلبية الأوراق) ينال نقطة واحدة (+1).
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <Text style={styles.ruleBadge}>2. الديناري (Dineri)</Text>
                  <Text style={styles.ruleDesc}>
                    اللاعب الذي يجمع أكثر من 5 أوراق من رمز الديناري (الذهب) ينال نقطة واحدة (+1).
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <Text style={styles.ruleBadge}>3. البرميلة (Bermila)</Text>
                  <Text style={styles.ruleDesc}>
                    اللاعب الذي يجمع 3 أو 4 سبعات ينال نقطة (+1). في حال التعادل (2 سبعات لكل لاعب) تُلغى النقطة.
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <Text style={styles.ruleBadge}>4. السبع الحيّة (Sbaa El Haya ★)</Text>
                  <Text style={styles.ruleDesc}>
                    اللاعب الذي يظفر بسبع الديناري الحيّة ينال نقطة مضمونة ومباشرة (+1).
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <Text style={styles.ruleBadge}>5. الشكبة (Chkobba 🔥)</Text>
                  <Text style={styles.ruleDesc}>
                    كل عملية أكل تُفرغ الطاولة تماماً (باستثناء اللعبة الأخيرة) تعتبر شكبة وتمنح نقطة إضافية فورية (+1).
                  </Text>
                </View>

                <View style={styles.ruleTargetBox}>
                  <Text style={styles.ruleTargetTitle}>🎯 نهاية المباراة :</Text>
                  <Text style={styles.ruleTargetText}>
                    الفائز هو أول لاعب أو فريق يصل إلى 11 أو 21 نقطة المتفق عليها مسبقاً.
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowRulesModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>فهمت القواعد ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ==================================================== */}
        {/* MODAL 2: AUDIO SETTINGS MODAL                        */}
        {/* ==================================================== */}
        <Modal visible={showAudioModal} animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.dialogCard}>
              <Text style={styles.modalTitle}>🔊 الصوت والموسيقى</Text>
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>المؤثرات الصوتية (أصوات الكروت والشكبة)</Text>
                <Switch
                  value={soundEffects}
                  onValueChange={setSoundEffects}
                  trackColor={{ false: '#264D36', true: '#D4AF37' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>موسيقى المقهى التونسي التقليدي</Text>
                <Switch
                  value={musicEnabled}
                  onValueChange={setMusicEnabled}
                  trackColor={{ false: '#264D36', true: '#D4AF37' }}
                  thumbColor="#FFF"
                />
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowAudioModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ==================================================== */}
        {/* MODAL 3: LANGUAGE SELECTION MODAL                    */}
        {/* ==================================================== */}
        <Modal visible={showLangModal} animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.dialogCard}>
              <Text style={styles.modalTitle}>🌐 Choix de la Langue / اللغة</Text>

              <TouchableOpacity
                style={[
                  styles.langOption,
                  selectedLang === 'ar' && styles.langOptionActive,
                ]}
                onPress={() => {
                  setSelectedLang('ar');
                  setShowLangModal(false);
                }}
              >
                <Text style={styles.langText}>🇹🇳 العربية (اللهجة التونسية)</Text>
                {selectedLang === 'ar' && <Feather name="check" size={18} color="#D4AF37" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.langOption,
                  selectedLang === 'fr' && styles.langOptionActive,
                ]}
                onPress={() => {
                  setSelectedLang('fr');
                  setShowLangModal(false);
                }}
              >
                <Text style={styles.langText}>🇫🇷 Français</Text>
                {selectedLang === 'fr' && <Feather name="check" size={18} color="#D4AF37" />}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Auth / Login Modal */}
        <LoginModal
          visible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A2114',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#0D2818',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  profileCard: {
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
    gap: 6,
  },
  avatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderColor: '#D4AF37',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  avatarLargeEmoji: {
    fontSize: 36,
  },
  levelTag: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#D4AF37',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#123321',
  },
  levelTagText: {
    color: '#1A1405',
    fontSize: 12,
    fontWeight: '800',
  },
  username: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  guestBadge: {
    backgroundColor: '#1E462E',
  },
  verifiedBadge: {
    backgroundColor: '#16532D',
  },
  statusBadgeText: {
    color: '#86EFAC',
    fontSize: 11,
    fontWeight: '600',
  },
  playerTitle: {
    color: '#8DA896',
    fontSize: 12,
  },
  xpBox: {
    width: '100%',
    marginTop: 8,
  },
  xpTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  xpLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  xpValue: {
    color: '#D4AF37',
    fontSize: 12,
  },
  xpTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#1A3F29',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 3,
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  editProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  editProfileBtnText: {
    color: '#1A1405',
    fontSize: 12,
    fontWeight: '800',
  },
  switchAccountBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#183B26',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  switchAccountBtnText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#8DA896',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  historyList: {
    gap: 8,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  historyLeft: {
    gap: 2,
  },
  historyType: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyDate: {
    color: '#6F8C79',
    fontSize: 11,
  },
  historyCenter: {
    alignItems: 'center',
  },
  historyResult: {
    fontSize: 12,
    fontWeight: '800',
  },
  victoryText: {
    color: '#4ADE80',
  },
  defeatText: {
    color: '#F87171',
  },
  historyScore: {
    color: '#A0B8A7',
    fontSize: 11,
  },
  historyGain: {
    fontSize: 13,
    fontWeight: '800',
  },
  gainPositive: {
    color: '#4ADE80',
  },
  gainNegative: {
    color: '#F87171',
  },
  settingsList: {
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#173E28',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rulesModalContent: {
    backgroundColor: '#0F2C1C',
    borderColor: '#D4AF37',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 420,
  },
  dialogCard: {
    backgroundColor: '#0F2C1C',
    borderColor: '#D4AF37',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#D4AF37',
    fontSize: 17,
    fontWeight: '800',
  },
  ruleIntro: {
    color: '#D1E0D7',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  ruleItem: {
    backgroundColor: '#143C25',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  ruleBadge: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 3,
  },
  ruleDesc: {
    color: '#A9C2B3',
    fontSize: 12,
    lineHeight: 17,
  },
  ruleTargetBox: {
    backgroundColor: '#1E462E',
    borderColor: '#D4AF37',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  ruleTargetTitle: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 12,
  },
  ruleTargetText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  modalCloseBtnText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    color: '#FFF',
    fontSize: 13,
    flex: 1,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#143C25',
  },
  langOptionActive: {
    borderColor: '#D4AF37',
    borderWidth: 1,
  },
  langText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
