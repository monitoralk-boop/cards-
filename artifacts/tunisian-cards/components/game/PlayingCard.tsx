import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  CardBackPattern,
  RenderSuitIcon,
  TunisianJackIllustration,
  type SuitType,
} from './CardSuits';
import { tunisianTheme } from '../../src/theme/tunisianTheme';

type GameMode = 'chkobba' | 'rami';

export interface PlayingCardProps {
  suit: SuitType;
  rank: number;
  width?: number;
  height?: number;
  selected?: boolean;
  playable?: boolean;
  dimmed?: boolean;
  small?: boolean;
  /** Compatibility with existing game callers. */
  gameMode?: GameMode;
  isFaceDown?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  backTheme?: 'red' | 'green';
}

const pipPositions: Record<number, readonly [number, number][]> = {
  2: [[0.5, 0.22], [0.5, 0.78]],
  3: [[0.5, 0.2], [0.5, 0.5], [0.5, 0.8]],
  4: [[0.28, 0.23], [0.72, 0.23], [0.28, 0.77], [0.72, 0.77]],
  5: [[0.28, 0.23], [0.72, 0.23], [0.5, 0.5], [0.28, 0.77], [0.72, 0.77]],
  6: [[0.28, 0.2], [0.72, 0.2], [0.28, 0.5], [0.72, 0.5], [0.28, 0.8], [0.72, 0.8]],
  7: [[0.28, 0.18], [0.72, 0.18], [0.5, 0.36], [0.28, 0.5], [0.72, 0.5], [0.28, 0.82], [0.72, 0.82]],
  8: [[0.28, 0.16], [0.72, 0.16], [0.28, 0.36], [0.72, 0.36], [0.28, 0.64], [0.72, 0.64], [0.28, 0.84], [0.72, 0.84]],
  9: [[0.28, 0.15], [0.72, 0.15], [0.28, 0.33], [0.72, 0.33], [0.5, 0.5], [0.28, 0.67], [0.72, 0.67], [0.28, 0.85], [0.72, 0.85]],
  10: [[0.28, 0.13], [0.72, 0.13], [0.28, 0.31], [0.72, 0.31], [0.28, 0.45], [0.72, 0.45], [0.28, 0.55], [0.72, 0.55], [0.28, 0.69], [0.72, 0.69]],
};

function getRankLabel(rank: number, mode: GameMode): string {
  if (mode === 'chkobba') {
    if (rank === 8) return 'J';
    if (rank === 9) return 'Q';
    if (rank === 10) return 'K';
  } else {
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
  }
  return String(rank);
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  suit,
  rank,
  width = 58,
  height = 84,
  selected = false,
  playable = false,
  dimmed = false,
  small = false,
  gameMode = 'rami',
  isFaceDown = false,
  isSelected = false,
  onPress,
  disabled = false,
  backTheme,
}) => {
  const isCardSelected = selected || isSelected;
  const mode = gameMode;
  const faceRank = getRankLabel(rank, mode);
  const isFigure = faceRank === 'J' || faceRank === 'Q' || faceRank === 'K';
  const isJoker = suit === 'joker';
  const ink = suit === 'hearts' || suit === 'diamonds' || suit === 'dineri' || suit === 'coupe'
    ? tunisianTheme.colors.danger
    : tunisianTheme.colors.ink;
  const edgeInset = Math.max(3, Math.round(width * 0.075));
  const cornerRankSize = Math.max(10, Math.min(small ? 12 : 16, width * 0.23));
  const pipSize = Math.max(9, Math.min(18, width * 0.24));
  const centerPipPositions = pipPositions[rank];
  const resolvedBackTheme = backTheme ?? (mode === 'chkobba' ? 'green' : 'red');

  const card = isFaceDown ? (
    <View style={[styles.card, styles.back, { width, height }, isCardSelected && styles.selectedCard]}>
      <CardBackPattern width={width} height={height} theme={resolvedBackTheme} />
    </View>
  ) : (
    <View
      style={[
        styles.card,
        styles.face,
        { width, height, borderRadius: tunisianTheme.radius.card, opacity: dimmed ? 0.45 : 1 },
        isCardSelected && styles.selectedCard,
        playable && styles.playableCard,
      ]}
    >
      <View style={[styles.corner, styles.topCorner, { top: edgeInset, left: edgeInset }]}>
        <Text numberOfLines={1} style={[styles.rank, { color: isJoker ? '#7C3AED' : ink, fontSize: cornerRankSize }]}>
          {isJoker ? 'J' : faceRank}
        </Text>
        {isJoker ? <Text style={[styles.cornerStar, { color: '#D4AF37' }]}>✦</Text> : <RenderSuitIcon suit={suit} size={Math.min(14, cornerRankSize)} />}
      </View>

      <View pointerEvents="none" style={styles.center}>
        {isJoker ? (
          <View style={styles.jokerCenter}>
            <Text style={styles.jokerStar}>✦</Text>
            <Text style={[styles.jokerLetter, { fontSize: Math.min(48, height * 0.53) }]}>J</Text>
            <Text style={styles.jokerStar}>✦</Text>
          </View>
        ) : isFigure ? (
          <View style={[styles.figure, { width: width * 0.76, height: height * 0.56 }]}>
            <TunisianJackIllustration width={width * 0.76} height={height * 0.56} />
            <View style={styles.figureLabel}>
              <Text style={[styles.figureRank, { color: ink }]}>{faceRank}</Text>
              <RenderSuitIcon suit={suit} size={Math.max(8, Math.min(13, width * 0.18))} />
            </View>
          </View>
        ) : rank === 1 ? (
          <RenderSuitIcon suit={suit} size={Math.min(width * 0.52, height * 0.34)} />
        ) : centerPipPositions ? (
          <View style={styles.pips}>
            {centerPipPositions.map(([x, y], index) => (
              <View key={index} style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, transform: [{ translateX: -pipSize / 2 }, { translateY: -pipSize / 2 }, ...(y > 0.5 ? [{ rotate: '180deg' as const }] : [])] }}>
                <RenderSuitIcon suit={suit} size={pipSize} />
              </View>
            ))}
          </View>
        ) : (
          <RenderSuitIcon suit={suit} size={Math.min(width * 0.48, height * 0.35)} />
        )}
      </View>

      <View style={[styles.corner, styles.bottomCorner, { bottom: edgeInset, right: edgeInset }]}>
        <Text numberOfLines={1} style={[styles.rank, { color: isJoker ? '#7C3AED' : ink, fontSize: cornerRankSize }]}>
          {isJoker ? 'J' : faceRank}
        </Text>
        {isJoker ? <Text style={[styles.cornerStar, { color: '#D4AF37' }]}>✦</Text> : <RenderSuitIcon suit={suit} size={Math.min(14, cornerRankSize)} />}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} disabled={disabled} onPress={onPress} style={styles.touchable}>
        {card}
      </TouchableOpacity>
    );
  }
  return card;
};

const styles = StyleSheet.create({
  touchable: { zIndex: 1 },
  card: {
    position: 'relative',
    borderRadius: tunisianTheme.radius.card,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: tunisianTheme.colors.ivory,
    backgroundColor: tunisianTheme.colors.ivory,
    ...tunisianTheme.shadows.card,
  },
  face: { backgroundColor: '#FFFDF7' },
  back: { backgroundColor: '#450A0A' },
  selectedCard: {
    transform: [{ translateY: -12 }],
    borderColor: '#F59E0B',
    borderWidth: 2.2,
    elevation: 10,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.38,
    shadowRadius: 9,
  },
  playableCard: {
    shadowColor: '#22C55E',
    shadowOpacity: 0.55,
    shadowRadius: 9,
    elevation: 8,
  },
  corner: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 17,
    minHeight: 28,
    gap: 0,
  },
  topCorner: {},
  bottomCorner: { transform: [{ rotate: '180deg' }] },
  rank: { fontWeight: '900', lineHeight: 18, textAlign: 'center' },
  cornerStar: { fontSize: 8, lineHeight: 9 },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  pips: { width: '76%', height: '68%', position: 'relative' },
  figure: { alignItems: 'center', justifyContent: 'center' },
  figureLabel: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,253,247,0.88)',
    paddingHorizontal: 3,
    borderRadius: 4,
  },
  figureRank: { fontSize: 11, fontWeight: '900' },
  jokerCenter: { alignItems: 'center', justifyContent: 'center' },
  jokerLetter: { color: '#7C3AED', fontWeight: '900', fontFamily: 'serif', lineHeight: 52 },
  jokerStar: { color: '#D4AF37', fontSize: 13, lineHeight: 15 },
});