import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

interface RewardedAdModalProps {
  visible: boolean;
  rewardAmount?: number;
  onRewardEarned: (coins: number) => void;
  onClose: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  visible,
  rewardAmount = 100,
  onRewardEarned,
  onClose,
}) => {
  const [countdown, setCountdown] = useState(5);
  const [adFinished, setAdFinished] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (visible) {
      setCountdown(5);
      setAdFinished(false);

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setAdFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  const handleClaim = () => {
    onRewardEarned(rewardAmount);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.adContainer}>
          {/* Top Ad Header */}
          <View style={styles.adHeader}>
            <View style={styles.sponsorBadge}>
              <Text style={styles.sponsorText}>SPONSORISÉ · ANNONCE</Text>
            </View>

            {adFinished ? (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>Récompense dans {countdown}s</Text>
              </View>
            )}
          </View>

          {/* Ad Creative Area */}
          <View style={styles.creativeArea}>
            <View style={styles.adLogoCircle}>
              <Text style={styles.adLogoEmoji}>☕</Text>
            </View>
            <Text style={styles.adBrandTitle}>Café des Nattes - Sidi Bou Saïd</Text>
            <Text style={styles.adBrandTagline}>
              Le vrai goût du thé aux pignons et de l'ambiance tunisienne.
            </Text>

            {/* Simulated Video Player */}
            <View style={styles.videoMockup}>
              {!adFinished ? (
                <View style={styles.videoPlayingState}>
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text style={styles.videoStatusText}>Lecture de la vidéo publicitaire...</Text>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${((5 - countdown) / 5) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.rewardReadyState}>
                  <Text style={styles.rewardTrophy}>🏆</Text>
                  <Text style={styles.rewardReadyTitle}>Félicitations !</Text>
                  <Text style={styles.rewardReadyDesc}>
                    Vous avez débloqué votre récompense de +{rewardAmount} jetons !
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Claim Action */}
          <View style={styles.adFooter}>
            {adFinished ? (
              <TouchableOpacity onPress={handleClaim} style={styles.claimRewardBtn}>
                <Text style={styles.claimRewardText}>
                  🪙 Réclamer +{rewardAmount} Jetons Gratuits
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.footerNotice}>
                Regardez la vidéo jusqu'à la fin pour recevoir vos jetons.
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  adContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F2C1C',
    borderRadius: 20,
    borderColor: '#D4AF37',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 10,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#081D12',
    borderBottomWidth: 1,
    borderBottomColor: '#174026',
  },
  sponsorBadge: {
    backgroundColor: '#163E27',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sponsorText: {
    color: '#8DA896',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A4A2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creativeArea: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  adLogoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#163E27',
    borderColor: '#D4AF37',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adLogoEmoji: {
    fontSize: 30,
  },
  adBrandTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  adBrandTagline: {
    color: '#8DA896',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  videoMockup: {
    width: '100%',
    height: 150,
    backgroundColor: '#06170E',
    borderRadius: 12,
    borderColor: '#174026',
    borderWidth: 1,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  videoPlayingState: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  videoStatusText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarTrack: {
    width: '80%',
    height: 6,
    backgroundColor: '#163E27',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 3,
  },
  rewardReadyState: {
    alignItems: 'center',
    gap: 6,
  },
  rewardTrophy: {
    fontSize: 32,
  },
  rewardReadyTitle: {
    color: '#FDE68A',
    fontSize: 16,
    fontWeight: '800',
  },
  rewardReadyDesc: {
    color: '#E2E8F0',
    fontSize: 12,
    textAlign: 'center',
  },
  adFooter: {
    padding: 16,
    backgroundColor: '#081D12',
    borderTopWidth: 1,
    borderTopColor: '#174026',
    alignItems: 'center',
  },
  claimRewardBtn: {
    width: '100%',
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  claimRewardText: {
    color: '#1A1405',
    fontSize: 14,
    fontWeight: '800',
  },
  footerNotice: {
    color: '#6E8B78',
    fontSize: 11,
    textAlign: 'center',
  },
});
