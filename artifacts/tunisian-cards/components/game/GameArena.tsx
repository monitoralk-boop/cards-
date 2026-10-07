import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { PlayingCard } from './PlayingCard';
import { SuitType } from './CardSuits';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CardItem {
  id: string;
  suit: SuitType;
  rank: number;
}

interface PlayerInfo {
  name: string;
  score: number;
  cardCount: number;
  isActive?: boolean;
  avatarColor: string;
}

interface GameArenaProps {
  gameMode?: 'chkobba' | 'rami';
  onBackToLobby?: () => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  gameMode = 'chkobba',
  onBackToLobby,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [lastActionMessage, setLastActionMessage] = useState<string>(
    gameMode === 'chkobba' ? 'دورك ، العب كارطة' : 'دورك ، أجبد كارطة'
  );
  const [turnTimer, setTurnTimer] = useState<number>(38);
  const [chkobbaCount, setChkobbaCount] = useState<number>(0);

  // Table cards (Chkobba starts with 4 on the table)
  const [tableCards, setTableCards] = useState<CardItem[]>([
    { id: 't1', suit: 'dineri', rank: 3 },
    { id: 't2', suit: 'bastoni', rank: 7 },
    { id: 't3', suit: 'coupe', rank: 4 },
    { id: 't4', suit: 'spade', rank: 10 }, // Roi de Spade
  ]);

  // Player's hand
  const [playerHand, setPlayerHand] = useState<CardItem[]>(
    gameMode === 'chkobba'
      ? [
          { id: 'p1', suit: 'dineri', rank: 7 }, // Sabaa El Haya!
          { id: 'p2', suit: 'spade', rank: 8 },  // Jack of Spades (Tunisian Musician!)
          { id: 'p3', suit: 'coupe', rank: 3 },
        ]
      : [
          { id: 'r1', suit: 'clubs', rank: 2 },
          { id: 'r2', suit: 'clubs', rank: 3 },
          { id: 'r3', suit: 'clubs', rank: 5 },
          { id: 'r4', suit: 'clubs', rank: 6 },
          { id: 'r5', suit: 'clubs', rank: 9 },
          { id: 'r6', suit: 'clubs', rank: 9 },
          { id: 'r7', suit: 'diamonds', rank: 3 },
          { id: 'r8', suit: 'diamonds', rank: 7 },
          { id: 'r9', suit: 'diamonds', rank: 8 },
          { id: 'r10', suit: 'hearts', rank: 4 },
          { id: 'r11', suit: 'spades', rank: 2 },
          { id: 'r12', suit: 'spades', rank: 5 },
          { id: 'r13', suit: 'spades', rank: 8 },
          { id: 'r14', suit: 'spades', rank: 8 }, // Jack
        ]
  );

  // Opponents around the table
  const opponents: PlayerInfo[] = [
    { name: 'CH AMINE', score: 2, cardCount: 3, avatarColor: '#E65100' },
    { name: 'ANIS', score: 0, cardCount: 3, avatarColor: '#1976D2' },
    { name: 'OUSSAMA', score: 3, cardCount: 3, avatarColor: '#388E3C' },
  ];

  // Play or Discard card handler
  const handlePlayCard = () => {
    if (!selectedCardId) return;

    const played = playerHand.find((c) => c.id === selectedCardId);
    if (!played) return;

    // Check Chkobba capture logic demo
    if (gameMode === 'chkobba') {
      const matchExact = tableCards.find((c) => c.rank === played.rank);
      if (matchExact) {
        // Captured!
        const remainingTable = tableCards.filter((c) => c.id !== matchExact.id);
        setTableCards(remainingTable);
        if (remainingTable.length === 0) {
          setChkobbaCount((prev) => prev + 1);
          setLastActionMessage('🔥 شكبة رائعة! (+1 نقطة)');
        } else {
          setLastActionMessage(`أكلت الكارطة ${matchExact.rank} بنجاح`);
        }
      } else {
        // Put card on the table
        setTableCards([...tableCards, played]);
        setLastActionMessage(`رميت ${played.rank} على الطاولة`);
      }
    } else {
      setTableCards([played]);
      setLastActionMessage('رميت الكارطة');
    }

    setPlayerHand(playerHand.filter((c) => c.id !== selectedCardId));
    setSelectedCardId(null);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* 1. TOP STATUS BAR (Player Scores & Game Room) */}
      <View style={styles.topScoreBar}>
        <View style={styles.scoreRow}>
          {opponents.map((opp, idx) => (
            <View key={idx} style={styles.playerScoreChip}>
              <View
                style={[
                  styles.smallAvatarDot,
                  { backgroundColor: opp.avatarColor },
                ]}
              />
              <Text style={styles.playerScoreText}>
                {opp.name} {opp.score}
              </Text>
            </View>
          ))}
          <View style={[styles.playerScoreChip, styles.userScoreChip]}>
            <View
              style={[styles.smallAvatarDot, { backgroundColor: '#D4AF37' }]}
            />
            <Text style={[styles.playerScoreText, styles.userScoreText]}>
              أنت {chkobbaCount}
            </Text>
          </View>
        </View>

        <View style={styles.roomTagRow}>
          <Text style={styles.roomTagText}>
            {gameMode === 'chkobba' ? 'شكبة تونسية كلاسيك' : 'رامي تونسي'} · جولة 1
          </Text>
        </View>
      </View>

      {/* 2. THE FELT ARENA (Burgundy / Wine Red with Table Border) */}
      <View style={styles.arenaContainer}>
        {/* Wooden Border Wrap */}
        <View style={styles.woodFrame}>
          {/* Burgundy Patterned Felt Mat */}
          <View style={styles.feltMat}>
            {/* Left Action Buttons Drawer */}
            <View style={styles.leftActionDrawer}>
              <TouchableOpacity
                onPress={onBackToLobby}
                style={styles.drawerButton}
              >
                <Feather name="home" size={18} color="#D4AF37" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerButton}>
                <Feather name="settings" size={18} color="#D4AF37" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onBackToLobby}
                style={styles.drawerButton}
              >
                <Feather name="log-out" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {/* Top Opponent (Seat 2) */}
            <View style={styles.topSeat}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>AN</Text>
              </View>
              <Text style={styles.seatPlayerName}>ANIS</Text>
              <View style={styles.seatCardsCount}>
                <Ionicons name="albums-outline" size={12} color="#D4AF37" />
                <Text style={styles.seatCardsText}>3</Text>
              </View>
            </View>

            {/* Left Opponent (Seat 1) */}
            <View style={styles.leftSeat}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>AM</Text>
              </View>
              <Text style={styles.seatPlayerName}>CH AMINE</Text>
              <View style={styles.seatCardsCount}>
                <Text style={styles.seatCardsText}>3 كروت</Text>
              </View>
            </View>

            {/* Right Opponent (Seat 3) */}
            <View style={styles.rightSeat}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>OU</Text>
              </View>
              <Text style={styles.seatPlayerName}>OUSSAMA</Text>
              <View style={styles.seatCardsCount}>
                <Text style={styles.seatCardsText}>3 كروت</Text>
              </View>
            </View>

            {/* Turn Announcement Banner */}
            <View style={styles.turnBannerWrapper}>
              <View style={styles.turnBanner}>
                <View style={styles.turnTimerIndicator}>
                  <Text style={styles.turnTimerDigit}>{turnTimer}s</Text>
                </View>
                <Text style={styles.turnBannerText}>{lastActionMessage}</Text>
              </View>
            </View>

            {/* TABLE CENTER: Deck Pile & Open Table Cards */}
            <View style={styles.tableCenter}>
              {/* Draw Pile (Face Down) */}
              <View style={styles.deckPileWrapper}>
                <PlayingCard
                  suit="spade"
                  rank={1}
                  isFaceDown
                  width={54}
                  height={78}
                />
                <View style={styles.deckLabelPill}>
                  <Text style={styles.deckLabelText}>الكارطة (32)</Text>
                </View>
              </View>

              {/* Open Cards on the Table */}
              <View style={styles.openTableCards}>
                {tableCards.length === 0 ? (
                  <View style={styles.emptyTablePlaceholder}>
                    <Text style={styles.emptyTableText}>الطاولة فارغة (شكبة!)</Text>
                  </View>
                ) : (
                  tableCards.map((card) => (
                    <View key={card.id} style={styles.tableCardItem}>
                      <PlayingCard
                        suit={card.suit}
                        rank={card.rank}
                        width={56}
                        height={80}
                      />
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Meld / Game Info Pill */}
            {gameMode === 'rami' && (
              <View style={styles.meldBadge}>
                <Text style={styles.meldBadgeText}>الحلة الأولى 51 نقاط</Text>
              </View>
            )}

            {chkobbaCount > 0 && (
              <View style={styles.chkobbaCounterBadge}>
                <Text style={styles.chkobbaCounterText}>
                  🏆 شكبة: {chkobbaCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 3. USER HAND & CONTROLS (BOTTOM) */}
      <View style={styles.bottomControlArea}>
        {/* Quick action bar */}
        <View style={styles.actionToolBar}>
          <TouchableOpacity style={styles.toolBtn}>
            <Text style={styles.toolEmoji}>😂</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn}>
            <Text style={styles.toolEmoji}>🎁</Text>
          </TouchableOpacity>

          {/* Action Button: Play / Throw */}
          <TouchableOpacity
            disabled={!selectedCardId}
            onPress={handlePlayCard}
            style={[
              styles.primaryPlayButton,
              !selectedCardId && styles.disabledPlayButton,
            ]}
          >
            <Text style={styles.primaryPlayButtonText}>
              {selectedCardId
                ? gameMode === 'chkobba'
                  ? '⚡ العب الكارطة'
                  : 'ارمي'
                : 'اختر كارطة'}
            </Text>
          </TouchableOpacity>

          {gameMode === 'rami' && (
            <TouchableOpacity style={styles.secondaryActionBtn}>
              <Text style={styles.secondaryActionText}>سكر اليد</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Fanned Player Cards */}
        <View style={styles.handContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.handScrollContent}
          >
            {playerHand.map((card, index) => {
              const isSelected = selectedCardId === card.id;
              return (
                <View
                  key={card.id}
                  style={[
                    styles.cardSlot,
                    {
                      marginLeft: index === 0 ? 10 : -14, // overlap cards for fan effect
                      zIndex: isSelected ? 50 : index + 1,
                    },
                  ]}
                >
                  <PlayingCard
                    suit={card.suit}
                    rank={card.rank}
                    isSelected={isSelected}
                    width={64}
                    height={92}
                    onPress={() => {
                      setSelectedCardId(isSelected ? null : card.id);
                    }}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0D2818',
  },
  topScoreBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: '#091E12',
    borderBottomWidth: 1,
    borderBottomColor: '#174026',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  playerScoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123321',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderColor: '#1C4A31',
    borderWidth: 1,
    gap: 5,
  },
  userScoreChip: {
    borderColor: '#D4AF37',
    backgroundColor: '#1F3C28',
  },
  smallAvatarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playerScoreText: {
    color: '#D8E2DC',
    fontSize: 11,
    fontWeight: '700',
  },
  userScoreText: {
    color: '#FDE68A',
  },
  roomTagRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  roomTagText: {
    color: '#A2BDA9',
    fontSize: 11,
    fontWeight: '600',
  },

  // Wood & Felt Arena
  arenaContainer: {
    flex: 1,
    padding: 8,
  },
  woodFrame: {
    flex: 1,
    backgroundColor: '#27170E', // Dark Mahogany Wood table
    borderRadius: 18,
    padding: 6,
    borderColor: '#422718',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  feltMat: {
    flex: 1,
    backgroundColor: '#401322', // Authentic burgundy / red felt
    borderRadius: 14,
    borderColor: '#260B14',
    borderWidth: 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Left action drawer
  leftActionDrawer: {
    position: 'absolute',
    top: 10,
    left: 8,
    zIndex: 20,
    gap: 6,
  },
  drawerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(18, 51, 33, 0.85)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Opponents Seats
  topSeat: {
    position: 'absolute',
    top: 10,
    alignItems: 'center',
    zIndex: 10,
  },
  leftSeat: {
    position: 'absolute',
    left: 10,
    top: '38%',
    alignItems: 'center',
    zIndex: 10,
  },
  rightSeat: {
    position: 'absolute',
    right: 10,
    top: '38%',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C3A27',
    borderColor: '#D4AF37',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  seatPlayerName: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  seatCardsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginTop: 2,
    gap: 3,
  },
  seatCardsText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '600',
  },

  // Turn Announcement
  turnBannerWrapper: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
    zIndex: 15,
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 10, 14, 0.82)',
    borderColor: '#D4AF37',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 8,
  },
  turnTimerIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnTimerDigit: {
    color: '#1C1917',
    fontSize: 9,
    fontWeight: '900',
  },
  turnBannerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Table Center
  tableCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  deckPileWrapper: {
    alignItems: 'center',
  },
  deckLabelPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderWidth: 0.8,
  },
  deckLabelText: {
    color: '#FDE68A',
    fontSize: 9,
    fontWeight: '700',
  },
  openTableCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: SCREEN_WIDTH * 0.55,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tableCardItem: {
    margin: 2,
  },
  emptyTablePlaceholder: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: '#D4AF37',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTableText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
  },

  meldBadge: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(20, 10, 14, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    borderWidth: 1,
  },
  meldBadgeText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '700',
  },
  chkobbaCounterBadge: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chkobbaCounterText: {
    color: '#1C1917',
    fontSize: 11,
    fontWeight: '800',
  },

  // Bottom Hand Controls
  bottomControlArea: {
    backgroundColor: '#091E12',
    borderTopWidth: 1,
    borderTopColor: '#174026',
    paddingBottom: 8,
  },
  actionToolBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 12,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#123321',
    borderColor: '#1F4D32',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolEmoji: {
    fontSize: 18,
  },
  primaryPlayButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#D4AF37',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledPlayButton: {
    backgroundColor: '#1D3B28',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryPlayButtonText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 13,
  },
  secondaryActionBtn: {
    backgroundColor: '#1A422B',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  secondaryActionText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
  },

  // Hand Fan
  handContainer: {
    height: 110,
    justifyContent: 'center',
  },
  handScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    height: 110,
  },
  cardSlot: {
    paddingBottom: 4,
  },
});
