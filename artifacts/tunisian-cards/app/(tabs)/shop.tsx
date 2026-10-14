import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CardBackPattern } from '@/components/game/CardSuits';
import { RewardedAdModal } from '@/components/ads/RewardedAdModal';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateCoins, spendCoins, purchaseCosmetic, equipCosmetic } = useAuth();
  const coins = user?.coins ?? 1500;
  const [showAdModal, setShowAdModal] = useState(false);
  const selectedBack = user?.equippedCardBack ?? 'red';
  const ownedBacks = user?.ownedCardBacks ?? ['red'];
  const ownedThemes = user?.ownedTableThemes ?? ['burgundy'];
  const selectedTheme = user?.equippedTableTheme ?? 'burgundy';

  const handleCosmetic = async (kind: 'cardBack' | 'tableTheme', item: 'red' | 'green' | 'burgundy' | 'emerald', price: number) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour sauvegarder vos achats et équipements.');
      return;
    }
    const owned = kind === 'cardBack' ? ownedBacks.includes(item as 'red' | 'green') : ownedThemes.includes(item as 'burgundy' | 'emerald');
    if (!owned) {
      const purchased = await purchaseCosmetic(kind, item, price);
      if (!purchased) {
        Alert.alert('Solde insuffisant', 'Vous n’avez pas assez de pièces pour cet article.');
        return;
      }
    }
    const equipped = await equipCosmetic(kind, item);
    if (equipped) Alert.alert('Boutique', owned ? 'Article équipé.' : 'Article acheté et équipé !');
    else Alert.alert('Erreur', 'Impossible d’équiper cet article. Réessayez.');
  };

  const coinPackages = [
    { id: 'c-1', coins: 1000, price: '3.00 TND', popular: false },
    { id: 'c-2', coins: 5000, price: '12.00 TND', popular: true, bonus: '+10%' },
    { id: 'c-3', coins: 15000, price: '30.00 TND', popular: false, bonus: '+25%' },
  ];

  const handleBuyCoins = (pkg: typeof coinPackages[0]) => {
    Alert.alert(
      'Achat de jetons',
      `Confirmer l'achat de ${pkg.coins} jetons pour ${pkg.price} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await updateCoins(pkg.coins);
            Alert.alert('Succès', `${pkg.coins} jetons ajoutés à votre compte !`);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0) }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Balance */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Boutique Souk</Text>
            <Text style={styles.subtitle}>Personnalisez vos cartes et jetons</Text>
          </View>

          <View style={styles.coinBadge}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinAmount}>{coins}</Text>
          </View>
        </View>

        {/* Section 1: Coins Packs */}
        <Text style={styles.sectionTitle}>💰 Packs de Jetons</Text>
        <View style={styles.packageRow}>
          {coinPackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              activeOpacity={0.85}
              onPress={() => handleBuyCoins(pkg)}
              style={[
                styles.packageCard,
                pkg.popular && styles.packageCardPopular,
              ]}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Populaire</Text>
                </View>
              )}
              <Text style={styles.packageCoins}>🪙 {pkg.coins}</Text>
              {pkg.bonus && <Text style={styles.bonusText}>{pkg.bonus}</Text>}
              <View style={styles.priceBtn}>
                <Text style={styles.priceBtnText}>{pkg.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Free Coins from Rewarded Ad */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowAdModal(true)}
          style={styles.freeCoinsAdCard}
        >
          <View style={styles.freeCoinsLeft}>
            <View style={styles.adIconBox}>
              <Text style={styles.adEmoji}>🎬</Text>
            </View>
            <View style={styles.freeCoinsInfo}>
              <Text style={styles.freeCoinsTitle}>Jetons Gratuits</Text>
              <Text style={styles.freeCoinsDesc}>
                Regardez une courte vidéo pour gagner +100 pièces
              </Text>
            </View>
          </View>
          <View style={styles.freeClaimBtn}>
            <Text style={styles.freeClaimBtnText}>+100 🪙 Gratuit</Text>
          </View>
        </TouchableOpacity>

        {/* Rewarded Ad Modal */}
        <RewardedAdModal
          visible={showAdModal}
          rewardAmount={100}
          onRewardEarned={async (reward) => {
            await updateCoins(reward);
          }}
          onClose={() => setShowAdModal(false)}
        />

        {/* Section 2: Card Backs Skins */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          🎴 Dos de Cartes Traditionnels
        </Text>
        <View style={styles.cardBacksRow}>
          {/* Red Arabesque */}
          <TouchableOpacity
            onPress={() => void handleCosmetic('cardBack', 'red', 0)}
            style={[
              styles.backSkinCard,
              selectedBack === 'red' && styles.backSkinActive,
            ]}
          >
            <View style={styles.cardPreviewBox}>
              <CardBackPattern width={70} height={100} theme="red" />
            </View>
            <Text style={styles.skinTitle}>Zellij Rouge Beylical</Text>
            <Text style={styles.skinStatus}>
              {selectedBack === 'red' ? '✓ Équipé' : ownedBacks.includes('red') ? 'Équiper' : 'Gratuit'}
            </Text>
          </TouchableOpacity>

          {/* Green Arabesque */}
          <TouchableOpacity
            onPress={() => void handleCosmetic('cardBack', 'green', 750)}
            style={[
              styles.backSkinCard,
              selectedBack === 'green' && styles.backSkinActive,
            ]}
          >
            <View style={styles.cardPreviewBox}>
              <CardBackPattern width={70} height={100} theme="green" />
            </View>
            <Text style={styles.skinTitle}>Émeraude Médina</Text>
            <Text style={styles.skinStatus}>
              {selectedBack === 'green' ? '✓ Équipé' : ownedBacks.includes('green') ? 'Équiper' : '750 pièces'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: Tables and Felt */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          ☕ Tapis de Table
        </Text>
        <View style={styles.feltList}>
          <View style={styles.feltCard}>
            <View style={[styles.feltCircle, { backgroundColor: '#3E1220' }]} />
            <View style={styles.feltInfo}>
              <Text style={styles.feltName}>Bordeaux Café des Nattes</Text>
              <Text style={styles.feltDesc}>Ambiance traditionnelle Sidi Bou Saïd</Text>
            </View>
            <TouchableOpacity onPress={() => void handleCosmetic('tableTheme', 'burgundy', 0)} style={styles.activeTag}>
              <Text style={styles.activeTagText}>{selectedTheme === 'burgundy' ? 'Actif' : 'Équiper'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.feltCard}>
            <View style={[styles.feltCircle, { backgroundColor: '#0B3820' }]} />
            <View style={styles.feltInfo}>
              <Text style={styles.feltName}>Vert Émeraude Zitouna</Text>
              <Text style={styles.feltDesc}>Tapis classique de tournoi</Text>
            </View>
            <TouchableOpacity onPress={() => void handleCosmetic('tableTheme', 'emerald', 1000)} style={styles.equipBtn}>
              <Text style={styles.equipBtnText}>{selectedTheme === 'emerald' ? 'Actif' : ownedThemes.includes('emerald') ? 'Équiper' : '1000 pièces'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Jetons Gratuits (Pub) */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          🎁 Jetons Gratuits
        </Text>
        <TouchableOpacity
          onPress={() => setShowAdModal(true)}
          style={styles.freeCoinsAdCard}
        >
          <View style={styles.freeCoinsLeft}>
            <View style={styles.adIconBox}>
              <Text style={styles.adEmoji}>🎬</Text>
            </View>
            <View style={styles.freeCoinsInfo}>
              <Text style={styles.freeCoinsTitle}>Regarder une courte vidéo</Text>
              <Text style={styles.freeCoinsDesc}>Gagnez +100 pièces gratuitement</Text>
            </View>
          </View>
          <View style={styles.freeClaimBtn}>
            <Text style={styles.freeClaimBtnText}>+100 🪙</Text>
          </View>
        </TouchableOpacity>

        {/* Rewarded Ad Modal */}
        <RewardedAdModal
          visible={showAdModal}
          rewardAmount={100}
          onRewardEarned={async (reward) => {
            await updateCoins(reward);
          }}
          onClose={() => setShowAdModal(false)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8DA896',
    fontSize: 12,
    marginTop: 2,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123321',
    borderColor: '#D4AF37',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  coinEmoji: {
    fontSize: 13,
  },
  coinAmount: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  packageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  packageCard: {
    flex: 1,
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    gap: 4,
  },
  packageCardPopular: {
    borderColor: '#D4AF37',
    backgroundColor: '#163E27',
  },
  popularBadge: {
    position: 'absolute',
    top: -9,
    backgroundColor: '#D4AF37',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  popularBadgeText: {
    color: '#1A1405',
    fontSize: 9,
    fontWeight: '800',
  },
  packageCoins: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 14,
    marginTop: 4,
  },
  bonusText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '700',
  },
  priceBtn: {
    backgroundColor: '#091E12',
    borderColor: '#24593B',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  priceBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBacksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backSkinCard: {
    flex: 1,
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  backSkinActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#173E28',
  },
  cardPreviewBox: {
    padding: 4,
    borderRadius: 6,
  },
  skinTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  skinStatus: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
  },
  feltList: {
    gap: 10,
  },
  feltCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  feltCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderColor: '#D4AF37',
    borderWidth: 1.5,
  },
  feltInfo: {
    flex: 1,
    gap: 2,
  },
  feltName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  feltDesc: {
    color: '#8DA896',
    fontSize: 11,
  },
  activeTag: {
    backgroundColor: '#174026',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
  },
  equipBtn: {
    backgroundColor: '#1A3F29',
    borderColor: '#24593B',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  equipBtnText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  freeCoinsAdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#163E27',
    borderColor: '#D4AF37',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  freeCoinsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  adIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0F2C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderWidth: 1,
  },
  adEmoji: {
    fontSize: 20,
  },
  freeCoinsInfo: {
    flex: 1,
    gap: 2,
  },
  freeCoinsTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  freeCoinsDesc: {
    color: '#8DA896',
    fontSize: 11,
  },
  freeClaimBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  freeClaimBtnText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 11,
  },
});
