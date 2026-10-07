import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  RenderSuitIcon,
  SuitType,
  CardBackPattern,
  TunisianJackIllustration,
} from './CardSuits';

export interface PlayingCardProps {
  suit: SuitType;
  rank: number; // 1-10 for Chkobba, 1-13 for standard/Rami
  isFaceDown?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  width?: number;
  height?: number;
  disabled?: boolean;
  elevationOffset?: number;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  suit,
  rank,
  isFaceDown = false,
  isSelected = false,
  onPress,
  width = 68,
  height = 98,
  disabled = false,
}) => {
  // Determine displayed rank string
  const getRankDisplay = (val: number): string => {
    switch (val) {
      case 1:
        return '1'; // In Tunisian card games, Ace is usually '1'
      case 8:
        return 'J'; // Valet / Fante
      case 9:
        return 'Q'; // Cavalier / Reine / Dama
      case 10:
        return 'K'; // Roi / Re
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      default:
        return String(val);
    }
  };

  const isRedSuit = suit === 'hearts' || suit === 'diamonds';
  const isSabaaElHaya = suit === 'dineri' && rank === 7;
  const isJackSpade =
    (suit === 'spade' || suit === 'spades') && (rank === 8 || rank === 11);

  const rankColor = isRedSuit
    ? '#C5221F'
    : suit === 'dineri'
    ? '#8A5E04'
    : '#1C1917';

  if (isFaceDown) {
    return (
      <View
        style={[
          styles.cardBase,
          {
            width,
            height,
            backgroundColor: '#450A0A',
          },
        ]}
      >
        <CardBackPattern width={width} height={height} theme="red" />
      </View>
    );
  }

  const cardContent = (
    <View
      style={[
        styles.cardBase,
        styles.cardFace,
        {
          width,
          height,
          borderColor: isSelected
            ? '#F59E0B'
            : isSabaaElHaya
            ? '#D4AF37'
            : '#D6CDB8',
          borderWidth: isSelected ? 2.5 : 1.2,
          transform: [{ translateY: isSelected ? -16 : 0 }],
          shadowOpacity: isSelected ? 0.45 : 0.2,
          shadowRadius: isSelected ? 10 : 4,
          elevation: isSelected ? 12 : 3,
        },
      ]}
    >
      {/* Sabaa El Haya Golden Ribbon Glow */}
      {isSabaaElHaya && (
        <View style={styles.sabaaHayaBadge}>
          <Text style={styles.sabaaHayaText}>★ 7 الحيّة</Text>
        </View>
      )}

      {/* Top Left Rank & Suit Badge */}
      <View style={styles.cornerTopLeft}>
        <Text style={[styles.rankText, { color: rankColor }]}>
          {getRankDisplay(rank)}
        </Text>
        <View style={styles.suitIconWrapper}>
          <RenderSuitIcon suit={suit} size={width > 60 ? 15 : 12} />
        </View>
      </View>

      {/* Center Art */}
      <View style={styles.centerArt}>
        {isJackSpade && width >= 60 ? (
          <TunisianJackIllustration width={width * 0.72} height={height * 0.7} />
        ) : (
          <RenderSuitIcon
            suit={suit}
            size={Math.min(width * 0.48, height * 0.45)}
          />
        )}
      </View>

      {/* Bottom Right Inverted Rank & Suit */}
      <View style={styles.cornerBottomRight}>
        <View style={styles.suitIconWrapper}>
          <RenderSuitIcon suit={suit} size={width > 60 ? 15 : 12} />
        </View>
        <Text style={[styles.rankText, { color: rankColor }]}>
          {getRankDisplay(rank)}
        </Text>
      </View>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={styles.touchableWrapper}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  touchableWrapper: {
    zIndex: 1,
  },
  cardBase: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
  },
  cardFace: {
    backgroundColor: '#FAF7EE',
    justifyContent: 'space-between',
    padding: 3,
  },
  cornerTopLeft: {
    alignItems: 'center',
    position: 'absolute',
    top: 4,
    left: 4,
  },
  cornerBottomRight: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 4,
    right: 4,
    transform: [{ rotate: '180deg' }],
  },
  rankText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Arial-BoldMT', default: 'sans-serif' }),
    lineHeight: 18,
  },
  suitIconWrapper: {
    marginTop: 1,
  },
  centerArt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sabaaHayaBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderColor: '#D4AF37',
    borderWidth: 0.8,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    zIndex: 10,
  },
  sabaaHayaText: {
    color: '#8A5E04',
    fontSize: 8,
    fontWeight: '700',
  },
});
