import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  RenderSuitIcon,
  SuitType,
  CardBackPattern,
} from './CardSuits';
import { getCardArtwork } from './CardArtwork';

export interface PlayingCardProps {
  gameMode?: 'chkobba' | 'rami';
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
  gameMode = 'chkobba',
  suit,
  rank,
  isFaceDown = false,
  isSelected = false,
  onPress,
  width = 68,
  height = 98,
  disabled = false,
}) => {
  // Display string for the rank
  const getRankDisplay = (val: number): string => {
    switch (val) {
      case 1:
        return '1'; // In Tunisian card games, Ace is '1'
      case 8:
        return gameMode === 'chkobba' ? 'J' : '8';
      case 9:
        return gameMode === 'chkobba' ? 'Q' : '9';
      case 10:
        return gameMode === 'chkobba' ? 'K' : '10';
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

  const isRedSuit =
    suit === 'hearts' || suit === 'diamonds' || suit === 'dineri' || suit === 'coupe';
  const isSabaaElHaya =
    gameMode === 'chkobba' && (suit === 'dineri' || suit === 'diamonds') && rank === 7;

  const rankColor = isRedSuit ? '#C5221F' : '#1C1917';

  // Face down (Card back)
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

  // Check if a real image asset exists for this card
  const localImage = getCardArtwork(gameMode, suit, rank);

  if (localImage) {
    const imageCardContent = (
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
            backgroundColor: '#FAF7EE',
            padding: 2,
          },
        ]}
      >
        {isSabaaElHaya && (
          <View style={styles.sabaaHayaBadge}>
            <Text style={styles.sabaaHayaText}>★ 7 الحيّة</Text>
          </View>
        )}
        <Image
          source={localImage}
          style={{ width: '100%', height: '100%', borderRadius: 6 }}
          resizeMode="contain"
        />
      </View>
    );

    if (onPress && !disabled) {
      return (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPress}
          style={styles.touchableWrapper}
        >
          {imageCardContent}
        </TouchableOpacity>
      );
    }
    return imageCardContent;
  }

  // Vector render for other cards in the classic French café style
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
      {/* Sabaa El Haya Golden Ribbon */}
      {isSabaaElHaya && (
        <View style={styles.sabaaHayaBadge}>
          <Text style={styles.sabaaHayaText}>★ 7 الحيّة</Text>
        </View>
      )}

      {/* Top Left Rank & Suit */}
      <View style={styles.cornerTopLeft}>
        <Text style={[styles.rankText, { color: rankColor }]}>
          {getRankDisplay(rank)}
        </Text>
        <View style={styles.suitIconWrapper}>
          <RenderSuitIcon suit={suit} size={width > 60 ? 15 : 12} />
        </View>
      </View>

      {/* Center Art / Pips */}
      <View style={styles.centerArt}>
        {rank === 7 ? (
          // 7-pips arrangement (like the traditional 7 of Clubs)
          <View style={styles.sevenPipsContainer}>
            <View style={styles.pipsRow}>
              <RenderSuitIcon suit={suit} size={width > 60 ? 13 : 10} />
              <RenderSuitIcon suit={suit} size={width > 60 ? 13 : 10} />
            </View>
            <View style={styles.pipsCenterRow}>
              <RenderSuitIcon suit={suit} size={width > 60 ? 13 : 10} />
            </View>
            <View style={styles.pipsRow}>
              <RenderSuitIcon suit={suit} size={width > 60 ? 13 : 10} />
              <RenderSuitIcon suit={suit} size={width > 60 ? 13 : 10} />
            </View>
            <View style={styles.pipsRow}>
              <RenderSuitIcon suit={suit} size={width > 60 ? 13 : 10} />
              <RenderSuitIcon suit={suit} size={width > 60 ? 13 : 10} />
            </View>
          </View>
        ) : (
          <RenderSuitIcon
            suit={suit}
            size={Math.min(width * 0.46, height * 0.42)}
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
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 4,
  },
  cardFace: {
    backgroundColor: '#FFFDF7',
    justifyContent: 'space-between',
    padding: 4,
    borderWidth: 1,
    borderColor: '#E7DFC9',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 4,
    left: 4,
    alignItems: 'center',
    gap: 1,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    alignItems: 'center',
    gap: 1,
    transform: [{ rotate: '180deg' }],
  },
  rankText: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'sans-serif',
    lineHeight: 17,
  },
  suitIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerArt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sevenPipsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '65%',
  },
  pipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  pipsCenterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  sabaaHayaBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    zIndex: 10,
    borderWidth: 0.8,
    borderColor: '#78350F',
  },
  sabaaHayaText: {
    color: '#1A1405',
    fontSize: 8,
    fontWeight: '900',
  },
});
