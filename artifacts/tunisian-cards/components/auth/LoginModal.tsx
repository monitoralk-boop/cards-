import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { DineriIcon } from '../game/CardSuits';

interface LoginModalProps {
  visible: boolean;
  onClose?: () => void;
}

const AVATAR_COLORS = ['#163E27', '#8E24AA', '#1976D2', '#D84315', '#C2185B', '#00796B'];
const AVATAR_EMOJIS = ['👑', '🇹🇳', '🃏', '🦅', '🦁', '☕', '🌟', '🎯'];

export const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose }) => {
  const { user, loginAsGuest, loginAsTestUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'guest' | 'phone' | 'email'>('guest');

  // Guest inputs
  const [guestName, setGuestName] = useState(user?.username || '');
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor || AVATAR_COLORS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState(user?.avatarEmoji || AVATAR_EMOJIS[0]);

  // Sync when user changes or modal opens
  React.useEffect(() => {
    if (user) {
      setGuestName(user.username);
      if (user.avatarColor) setSelectedColor(user.avatarColor);
      if (user.avatarEmoji) setSelectedEmoji(user.avatarEmoji);
    }
  }, [user, visible]);

  // Phone inputs

  const handleGuestSubmit = async () => {
    if (!guestName.trim()) {
      Alert.alert('Pseudo requis', 'Veuillez entrer votre pseudo.');
      return;
    }
    await loginAsGuest(guestName, selectedColor, selectedEmoji);
    if (onClose) onClose();
  };

  const handleTestLogin = async () => {
    await loginAsTestUser();
    onClose?.();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {onClose && (
            <View style={styles.topDismissBar}>
              <TouchableOpacity onPress={onClose} style={styles.topCloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={22} color="#D4AF37" />
              </TouchableOpacity>
            </View>
          )}
          {/* Header Branding */}
          <View style={styles.brandSection}>
            <View style={styles.logoRow}>
              <DineriIcon size={44} />
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>🇹🇳 تونس</Text>
              </View>
            </View>
            <Text style={styles.appTitle}>شكبة و رامي تونسية</Text>
            <Text style={styles.appSubtitle}>Chkobba & Rami Tunisienne</Text>
            <Text style={styles.tagline}>
              Joueurs réels uniquement · Café & Tournois
            </Text>
          </View>

          {/* Login Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('guest')}
              style={[styles.tabBtn, activeTab === 'guest' && styles.tabBtnActive]}
            >
              <Feather name="zap" size={14} color={activeTab === 'guest' ? '#1A1405' : '#8DA896'} />
              <Text style={[styles.tabText, activeTab === 'guest' && styles.tabTextActive]}>
                Invité
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('phone')}
              style={[styles.tabBtn, activeTab === 'phone' && styles.tabBtnActive]}
            >
              <Feather name="phone" size={14} color={activeTab === 'phone' ? '#1A1405' : '#8DA896'} />
              <Text style={[styles.tabText, activeTab === 'phone' && styles.tabTextActive]}>
                Téléphone
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('email')}
              style={[styles.tabBtn, activeTab === 'email' && styles.tabBtnActive]}
            >
              <Feather name="mail" size={14} color={activeTab === 'email' ? '#1A1405' : '#8DA896'} />
              <Text style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <View style={styles.cardContainer}>
            {activeTab === 'guest' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Bienvenue à la table</Text>
                <Text style={styles.formDesc}>Accès de démonstration, sans compte réel ni mot de passe.</Text>
                <TouchableOpacity onPress={handleTestLogin} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>🎮 Entrer avec le compte de test</Text>
                </TouchableOpacity>
                <Text style={styles.formDesc}>Test Player · sauvegarde locale sur cet appareil</Text>

                {/* Avatar Preview */}
                <View style={styles.avatarPreviewCenter}>
                  <View style={[styles.avatarBigCircle, { backgroundColor: selectedColor }]}>
                    <Text style={styles.avatarBigEmoji}>{selectedEmoji}</Text>
                  </View>
                </View>

                {/* Emoji choices */}
                <Text style={styles.inputLabel}>Choisir un insigne :</Text>
                <View style={styles.emojiRow}>
                  {AVATAR_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => setSelectedEmoji(emoji)}
                      style={[
                        styles.emojiBtn,
                        selectedEmoji === emoji && styles.emojiBtnActive,
                      ]}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Color choices */}
                <Text style={styles.inputLabel}>Couleur de fond :</Text>
                <View style={styles.colorRow}>
                  {AVATAR_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setSelectedColor(c)}
                      style={[
                        styles.colorDot,
                        { backgroundColor: c },
                        selectedColor === c && styles.colorDotActive,
                      ]}
                    />
                  ))}
                </View>

                {/* Nickname input */}
                <Text style={styles.inputLabel}>Votre pseudonyme :</Text>
                <View style={styles.inputBox}>
                  <Feather name="user" size={16} color="#D4AF37" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: monitoralk"
                    placeholderTextColor="#688773"
                    value={guestName}
                    onChangeText={setGuestName}
                  />
                </View>

                {/* Submit button */}
                <TouchableOpacity onPress={handleGuestSubmit} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>⚡ Commencer à jouer</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'phone' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Connexion par Téléphone</Text>
                <Text style={styles.formDesc}>
                  La connexion par SMS n’est pas disponible : aucun fournisseur d’authentification n’est configuré.
                </Text>

                <Text style={styles.formDesc}>Utilisez le compte de test local ou le mode invité ci-dessus.</Text>
                <TouchableOpacity onPress={handleTestLogin} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Utiliser le compte de test</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'email' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Connexion par Email</Text>
                <Text style={styles.formDesc}>
                  La connexion par email n’est pas disponible : aucun serveur de comptes n’est configuré.
                </Text>

                <Text style={styles.formDesc}>Utilisez le compte de test local ou le mode invité ci-dessus.</Text>
                <TouchableOpacity onPress={handleTestLogin} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Utiliser le compte de test</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Close / Skip button */}
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>Continuer en arrière-plan →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0A2114',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  logoBadge: {
    backgroundColor: '#163E27',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  logoBadgeText: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 12,
  },
  appTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  appSubtitle: {
    color: '#D4AF37',
    fontSize: 15,
    fontWeight: '700',
  },
  tagline: {
    color: '#8DA896',
    fontSize: 12,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#123321',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    borderColor: '#1D4A30',
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#D4AF37',
  },
  tabText: {
    color: '#8DA896',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#1A1405',
    fontWeight: '800',
  },
  cardContainer: {
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  formSection: {
    gap: 10,
  },
  formTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  formDesc: {
    color: '#8DA896',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  avatarPreviewCenter: {
    alignItems: 'center',
    marginVertical: 6,
  },
  avatarBigCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderColor: '#D4AF37',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBigEmoji: {
    fontSize: 32,
  },
  inputLabel: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#163E27',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#1D4A30',
    borderWidth: 1,
  },
  emojiBtnActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#1F4D32',
  },
  emojiText: {
    fontSize: 18,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorDotActive: {
    borderColor: '#D4AF37',
    borderWidth: 3,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#091E12',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    padding: 0,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#091E12',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  prefixText: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#D4AF37',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#1A1405',
    fontSize: 14,
    fontWeight: '800',
  },
  skipBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  skipBtnText: {
    color: '#8DA896',
    fontSize: 12,
    fontWeight: '600',
  },
  topDismissBar: {
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  topCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#133522',
    borderColor: '#1D4A30',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
