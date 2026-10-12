import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { PlayingCard } from './PlayingCard';
import {
  ChkobbaCard,
  RoundResult,
  initialDeal,
  findPossibleCaptures,
  pickBotMove,
  calculateScores,
} from './chkobbaLogic';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GameArenaProps {
  gameMode?: 'chkobba' | 'rami';
  opponentName?: string;
  targetScore?: number;
  onBackToLobby?: () => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  gameMode = 'chkobba',
  opponentName = 'CH AMINE',
  targetScore = 21,
  onBackToLobby,
}) => {
  const { user, addGameResult } = useAuth();

  // Match cumulative scores
  const [roundNumber, setRoundNumber] = useState(1);
  const [playerTotalScore, setPlayerTotalScore] = useState(0);
  const [opponentTotalScore, setOpponentTotalScore] = useState(0);

  // Round game state
  const [tableCards, setTableCards] = useState<ChkobbaCard[]>([]);
  const [playerHand, setPlayerHand] = useState<ChkobbaCard[]>([]);
  const [opponentHand, setOpponentHand] = useState<ChkobbaCard[]>([]);
  const [drawDeck, setDrawDeck] = useState<ChkobbaCard[]>([]);

  // Piles
  const [playerCaptured, setPlayerCaptured] = useState<ChkobbaCard[]>([]);
  const [opponentCaptured, setOpponentCaptured] = useState<ChkobbaCard[]>([]);
  const [playerChkobbas, setPlayerChkobbas] = useState(0);
  const [opponentChkobbas, setOpponentChkobbas] = useState(0);

  // Turn management
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [lastCapturer, setLastCapturer] = useState<'player' | 'opponent' | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [lastActionMessage, setLastActionMessage] = useState('دورك ، العب كارطة');
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Celebrations & Modals
  const [chkobbaBanner, setChkobbaBanner] = useState<string | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  // Rami specific state
  const [ramiDrawn, setRamiDrawn] = useState(false);

  // 1. Initialize fresh game round
  const startNewRound = () => {
    const deal = initialDeal();
    setTableCards(deal.table);
    setPlayerHand(deal.playerHand);
    setOpponentHand(deal.opponentHand);
    setDrawDeck(deal.drawDeck);
    setPlayerCaptured([]);
    setOpponentCaptured([]);
    setPlayerChkobbas(0);
    setOpponentChkobbas(0);
    setIsPlayerTurn(true);
    setLastCapturer(null);
    setSelectedCardId(null);
    setChkobbaBanner(null);
    setRoundResult(null);
    setLastActionMessage('جولة جديدة بدأت ، دورك للعب');
  };

  useEffect(() => {
    startNewRound();
  }, [gameMode]);

  // Hide Chkobba celebration banner after 2.5 seconds
  useEffect(() => {
    if (chkobbaBanner) {
      const timer = setTimeout(() => {
        setChkobbaBanner(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [chkobbaBanner]);

  // 2. Auto-deal new hands or finalize round when both hands become empty
  useEffect(() => {
    if (gameMode !== 'chkobba') return;

    // Both hands empty?
    if (playerHand.length === 0 && opponentHand.length === 0) {
      if (drawDeck.length > 0) {
        // Deal 3 new cards to each player
        const newPlayerHand = drawDeck.slice(0, 3);
        const newOpponentHand = drawDeck.slice(3, 6);
        const remainingDeck = drawDeck.slice(6);

        setPlayerHand(newPlayerHand);
        setOpponentHand(newOpponentHand);
        setDrawDeck(remainingDeck);
        setLastActionMessage(`توزيع كروت جديدة (${remainingDeck.length} باقية بالسحب)`);
      } else if (tableCards.length > 0 || playerCaptured.length > 0 || opponentCaptured.length > 0) {
        // Deck depleted & hands empty => Round Over!
        handleRoundOver();
      }
    }
  }, [playerHand.length, opponentHand.length, drawDeck.length]);

  // 3. Bot Turn trigger
  useEffect(() => {
    if (gameMode !== 'chkobba') return;
    if (isPlayerTurn || roundResult || playerHand.length === 0 && opponentHand.length === 0) return;

    if (opponentHand.length > 0) {
      setIsBotThinking(true);
      setLastActionMessage(`${opponentName} يفكر...`);

      const timer = setTimeout(() => {
        executeBotTurn();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, opponentHand.length, roundResult]);

  // Execute bot's move
  const executeBotTurn = () => {
    const isLastCardOfRound = drawDeck.length === 0 && opponentHand.length === 1 && playerHand.length === 0;
    const botDecision = pickBotMove(opponentHand, tableCards, isLastCardOfRound);
    const cardPlayed = botDecision.cardToPlay;

    let newTable = [...tableCards];
    let newOpponentCaptured = [...opponentCaptured];
    let newOpponentChkobbas = opponentChkobbas;

    if (botDecision.captureToTake) {
      const captured = botDecision.captureToTake.cards;
      const capturedIds = new Set(captured.map((c) => c.id));
      newTable = tableCards.filter((c) => !capturedIds.has(c.id));
      newOpponentCaptured = [...opponentCaptured, ...captured, cardPlayed];
      setLastCapturer('opponent');

      // Chkobba sweep?
      if (newTable.length === 0 && !isLastCardOfRound) {
        newOpponentChkobbas += 1;
        setOpponentChkobbas(newOpponentChkobbas);
        setChkobbaBanner(`🔥 ${opponentName} عمل شكبة! (+1)`);
      }

      setLastActionMessage(`${opponentName}: ${botDecision.actionMessage}`);
    } else {
      // Discard onto table
      newTable = [...tableCards, cardPlayed];
      setLastActionMessage(`${opponentName} رمى ${cardPlayed.rank} على الطاولة`);
    }

    setTableCards(newTable);
    setOpponentCaptured(newOpponentCaptured);
    setOpponentHand((prev) => prev.filter((c) => c.id !== cardPlayed.id));
    setIsBotThinking(false);
    setIsPlayerTurn(true);
  };

  // 4. Handle Player playing a card
  const handlePlayerPlayCard = () => {
    if (!selectedCardId || !isPlayerTurn || isBotThinking) return;

    const playedCard = playerHand.find((c) => c.id === selectedCardId);
    if (!playedCard) return;

    const isLastCardOfRound = drawDeck.length === 0 && playerHand.length === 1 && opponentHand.length === 0;
    const possibleCaptures = findPossibleCaptures(tableCards, playedCard);

    let newTable = [...tableCards];
    let newPlayerCaptured = [...playerCaptured];
    let newPlayerChkobbas = playerChkobbas;

    if (possibleCaptures.length > 0) {
      // Player captures! Pick best or single capture
      const captureToTake = possibleCaptures[0];
      const captured = captureToTake.cards;
      const capturedIds = new Set(captured.map((c) => c.id));

      newTable = tableCards.filter((c) => !capturedIds.has(c.id));
      newPlayerCaptured = [...playerCaptured, ...captured, playedCard];
      setLastCapturer('player');

      // Chkobba sweep?
      if (newTable.length === 0 && !isLastCardOfRound) {
        newPlayerChkobbas += 1;
        setPlayerChkobbas(newPlayerChkobbas);
        setChkobbaBanner('🔥 شـــــكـبـة ! (+1 نقطة) 🔥');
      }

      const cardNames = captured.map((c) => `${c.rank}`).join(' + ');
      setLastActionMessage(`أكلت الكارطة (${cardNames}) بنجاح`);
    } else {
      // Discard on the table
      newTable = [...tableCards, playedCard];
      setLastActionMessage(`رميت ${playedCard.rank} على الطاولة`);
    }

    setTableCards(newTable);
    setPlayerCaptured(newPlayerCaptured);
    setPlayerHand((prev) => prev.filter((c) => c.id !== playedCard.id));
    setSelectedCardId(null);
    setIsPlayerTurn(false);
  };

  // 5. Finalize Round & Tally Official Scores
  const handleRoundOver = () => {
    let finalPlayerCaptured = [...playerCaptured];
    let finalOpponentCaptured = [...opponentCaptured];

    // Any cards remaining on the table go to the last capturer
    if (tableCards.length > 0) {
      if (lastCapturer === 'player') {
        finalPlayerCaptured = [...playerCaptured, ...tableCards];
      } else if (lastCapturer === 'opponent') {
        finalOpponentCaptured = [...opponentCaptured, ...tableCards];
      }
      setTableCards([]);
    }

    const result = calculateScores(
      finalPlayerCaptured,
      finalOpponentCaptured,
      playerChkobbas,
      opponentChkobbas,
      playerTotalScore,
      opponentTotalScore,
      targetScore,
    );

    setPlayerTotalScore(result.playerTotalScore);
    setOpponentTotalScore(result.opponentTotalScore);
    setRoundResult(result);

    // If game ended, record stats in user profile
    if (result.isGameOver && result.winner) {
      const won = result.winner === 'player';
      const capturedSbaa = finalPlayerCaptured.some((c) => c.suit === 'dineri' && c.rank === 7);
      addGameResult(won, result.playerTotalScore, playerChkobbas, capturedSbaa);
    }
  };

  // Next round continuation
  const handleProceedNextRound = () => {
    setRoundNumber((r) => r + 1);
    startNewRound();
  };

  // Restart match from 0 - 0
  const handleRestartMatch = () => {
    setRoundNumber(1);
    setPlayerTotalScore(0);
    setOpponentTotalScore(0);
    startNewRound();
  };

  // Highlight capturable table cards when player selects a card
  const activeSelectedCard = playerHand.find((c) => c.id === selectedCardId);
  const currentCaptures = activeSelectedCard
    ? findPossibleCaptures(tableCards, activeSelectedCard)
    : [];
  const capturableCardIds = new Set(
    currentCaptures.flatMap((cap) => cap.cards.map((c) => c.id)),
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* 1. TOP SCORE & ROOM BAR */}
      <View style={styles.topScoreBar}>
        <View style={styles.scoreRow}>
          {/* Opponent Chip */}
          <View style={styles.playerScoreChip}>
            <View style={[styles.smallAvatarDot, { backgroundColor: '#E65100' }]} />
            <Text style={styles.playerScoreText}>
              {opponentName} ({opponentTotalScore} pts)
            </Text>
            {opponentChkobbas > 0 && (
              <Text style={styles.chkobbaMiniBadge}>🔥 {opponentChkobbas}</Text>
            )}
          </View>

          {/* User Score Chip */}
          <View style={[styles.playerScoreChip, styles.userScoreChip]}>
            <View style={[styles.smallAvatarDot, { backgroundColor: '#D4AF37' }]} />
            <Text style={[styles.playerScoreText, styles.userScoreText]}>
              أنت ({playerTotalScore} pts)
            </Text>
            {playerChkobbas > 0 && (
              <Text style={styles.chkobbaMiniBadge}>🔥 {playerChkobbas}</Text>
            )}
          </View>
        </View>

        <View style={styles.roomTagRow}>
          <Text style={styles.roomTagText}>
            {gameMode === 'chkobba' ? 'شكبة تونسية كلاسيك' : 'رامي تونسي'} · جولة {roundNumber} (الهدف {targetScore})
          </Text>
        </View>
      </View>

      {/* 2. THE FELT ARENA (Burgundy Velvet Mat with Wood Frame) */}
      <View style={styles.arenaContainer}>
        <View style={styles.woodFrame}>
          <View style={styles.feltMat}>
            <View pointerEvents="none" style={styles.feltInnerBorder} />
            <View pointerEvents="none" style={styles.tableMedallion}>
              <View style={styles.medallionRing} />
              <Text style={styles.medallionMark}>✦</Text>
            </View>
            {/* Left Action Drawer */}
            <View style={styles.leftActionDrawer}>
              <TouchableOpacity onPress={onBackToLobby} style={styles.drawerButton}>
                <Feather name="home" size={18} color="#D4AF37" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRestartMatch} style={styles.drawerButton}>
                <Feather name="refresh-cw" size={16} color="#D4AF37" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onBackToLobby} style={styles.drawerButton}>
                <Feather name="log-out" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {/* Top Seat: Opponent Bot */}
            <View style={styles.topSeat}>
              <View style={[styles.avatarCircle, isBotThinking && styles.avatarThinking]}>
                <Text style={styles.avatarText}>
                  {opponentName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.seatPlayerName}>{opponentName}</Text>
              <View style={styles.seatCardsCount}>
                <Ionicons name="albums-outline" size={12} color="#D4AF37" />
                <Text style={styles.seatCardsText}>{opponentHand.length} كروت</Text>
              </View>
            </View>

            {/* Turn Announcement Banner */}
            <View style={styles.turnBannerWrapper}>
              <View style={[styles.turnBanner, !isPlayerTurn && styles.turnBannerOpponent]}>
                <Text style={styles.turnBannerText}>
                  {isBotThinking ? `⏳ ${lastActionMessage}` : lastActionMessage}
                </Text>
              </View>
            </View>

            {/* Celebration Chkobba Banner */}
            {chkobbaBanner && (
              <View style={styles.floatingChkobbaBanner}>
                <Text style={styles.floatingChkobbaText}>{chkobbaBanner}</Text>
              </View>
            )}

            {/* TABLE CENTER: Deck Pile & Open Table Cards */}
            <View style={styles.tableCenter}>
              {/* Draw Pile */}
              <View style={styles.deckPileWrapper}>
                <PlayingCard
                  suit="spade"
                  rank={1}
                  isFaceDown
                  width={54}
                  height={78}
                />
                <View style={styles.deckLabelPill}>
                  <Text style={styles.deckLabelText}>
                    الكارطة ({drawDeck.length})
                  </Text>
                </View>
              </View>

              {/* Open Table Cards */}
              <View style={styles.openTableCards}>
                {tableCards.length === 0 ? (
                  <View style={styles.emptyTablePlaceholder}>
                    <Text style={styles.emptyTableText}>الطاولة فارغة (شكبة!)</Text>
                  </View>
                ) : (
                  tableCards.map((card) => {
                    const isCapturable = capturableCardIds.has(card.id);
                    return (
                      <View
                        key={card.id}
                        style={[
                          styles.tableCardItem,
                          isCapturable && styles.capturableGlow,
                        ]}
                      >
                        <PlayingCard
                          suit={card.suit}
                          rank={card.rank}
                          width={Math.min(62, Math.max(48, (SCREEN_WIDTH - 150) / 4))}
                          height={Math.min(88, Math.max(68, (SCREEN_WIDTH - 150) / 4 * 1.42))}
                        />
                        {isCapturable && (
                          <View style={styles.captureIndicatorPill}>
                            <Text style={styles.captureIndicatorText}>أكل ✓</Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            {/* Captured Cards Mini Stats */}
            <View style={styles.pilesRow}>
              <View style={styles.pileChip}>
                <Text style={styles.pileChipText}>
                  أنت: {playerCaptured.length} كارت
                </Text>
              </View>
              <View style={styles.pileChip}>
                <Text style={styles.pileChipText}>
                  الخصم: {opponentCaptured.length} كارت
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 3. USER HAND & CONTROLS (BOTTOM) */}
      <View style={styles.bottomControlArea}>
        {/* Quick action bar */}
        <View style={styles.actionToolBar}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => setLastActionMessage('😂 هههه شكبة عليك!')}
          >
            <Text style={styles.toolEmoji}>😂</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => setLastActionMessage('☕ صحّة القهوة!')}
          >
            <Text style={styles.toolEmoji}>☕</Text>
          </TouchableOpacity>

          {/* Action Button: Play / Throw */}
          <TouchableOpacity
            disabled={!selectedCardId || !isPlayerTurn || isBotThinking}
            onPress={handlePlayerPlayCard}
            style={[
              styles.primaryPlayButton,
              (!selectedCardId || !isPlayerTurn || isBotThinking) &&
                styles.disabledPlayButton,
            ]}
          >
            <Text style={styles.primaryPlayButtonText}>
              {selectedCardId
                ? currentCaptures.length > 0
                  ? '⚡ أكل الكارطة'
                  : 'ارمي على الطاولة'
                : isPlayerTurn
                ? 'اختر كارطة من يدك'
                : `${opponentName} يلعب...`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Player Cards */}
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
                      marginLeft: index === 0 ? 10 : -14,
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
                      if (!isPlayerTurn || isBotThinking) return;
                      setSelectedCardId(isSelected ? null : card.id);
                    }}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* ==================================================== */}
      {/* 4. ROUND SUMMARY & SCORING MODAL                     */}
      {/* ==================================================== */}
      <Modal visible={Boolean(roundResult)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.summaryModalBox}>
            {/* Header */}
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>
                {roundResult?.isGameOver
                  ? roundResult.winner === 'player'
                    ? '🎉 مبروك! فزت بالمباراة!'
                    : '💔 خسرت المباراة!'
                  : `🏆 نتائج الجولة ${roundNumber}`}
              </Text>
              <Text style={styles.summarySubtitle}>
                النتيجة التراكمية : أنت {playerTotalScore} - {opponentTotalScore} {opponentName} (الهدف {targetScore})
              </Text>
            </View>

            {/* Score Breakdown Table */}
            <View style={styles.scoreTable}>
              {/* Header row */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableCol, styles.colLabel]}>القاعدة</Text>
                <Text style={[styles.tableCol, styles.colVal]}>أنت</Text>
                <Text style={[styles.tableCol, styles.colVal]}>{opponentName}</Text>
              </View>

              {/* 1. Carta */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colLabel]}>
                  الكارطة (&gt;20)
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.colVal,
                    roundResult?.playerBreakdown.carta.won && styles.winVal,
                  ]}
                >
                  {roundResult?.playerBreakdown.carta.count} كارت (+{roundResult?.playerBreakdown.carta.points})
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.colVal,
                    roundResult?.opponentBreakdown.carta.won && styles.winVal,
                  ]}
                >
                  {roundResult?.opponentBreakdown.carta.count} كارت (+{roundResult?.opponentBreakdown.carta.points})
                </Text>
              </View>

              {/* 2. Dineri */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colLabel]}>
                  الديناري (&gt;5)
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.colVal,
                    roundResult?.playerBreakdown.dineri.won && styles.winVal,
                  ]}
                >
                  {roundResult?.playerBreakdown.dineri.count} (+{roundResult?.playerBreakdown.dineri.points})
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.colVal,
                    roundResult?.opponentBreakdown.dineri.won && styles.winVal,
                  ]}
                >
                  {roundResult?.opponentBreakdown.dineri.count} (+{roundResult?.opponentBreakdown.dineri.points})
                </Text>
              </View>

              {/* 3. Bermila */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colLabel]}>
                  البرميلة (السبعات)
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.colVal,
                    roundResult?.playerBreakdown.bermila.won && styles.winVal,
                  ]}
                >
                  {roundResult?.playerBreakdown.bermila.count} سبعات (+{roundResult?.playerBreakdown.bermila.points})
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.colVal,
                    roundResult?.opponentBreakdown.bermila.won && styles.winVal,
                  ]}
                >
                  {roundResult?.opponentBreakdown.bermila.count} سبعات (+{roundResult?.opponentBreakdown.bermila.points})
                </Text>
              </View>

              {/* 4. Sabaa El Haya */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colLabel]}>
                  السبع الحيّة ★
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.colVal,
                    roundResult?.playerBreakdown.sbaaElHaya.captured && styles.winVal,
                  ]}
                >
                  {roundResult?.playerBreakdown.sbaaElHaya.captured ? 'نعم (+1)' : 'لا'}
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.colVal,
                    roundResult?.opponentBreakdown.sbaaElHaya.captured && styles.winVal,
                  ]}
                >
                  {roundResult?.opponentBreakdown.sbaaElHaya.captured ? 'نعم (+1)' : 'لا'}
                </Text>
              </View>

              {/* 5. Chkobbas */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colLabel]}>
                  الشكبات 🔥
                </Text>
                <Text style={[styles.tableCol, styles.colVal]}>
                  {roundResult?.playerBreakdown.chkobbas.count} (+{roundResult?.playerBreakdown.chkobbas.points})
                </Text>
                <Text style={[styles.tableCol, styles.colVal]}>
                  {roundResult?.opponentBreakdown.chkobbas.count} (+{roundResult?.opponentBreakdown.chkobbas.points})
                </Text>
              </View>

              {/* Total Round Row */}
              <View style={[styles.tableRow, styles.totalRow]}>
                <Text style={[styles.tableCol, styles.colLabel, styles.totalLabel]}>
                  مجموع الجولة
                </Text>
                <Text style={[styles.tableCol, styles.colVal, styles.totalVal]}>
                  +{roundResult?.playerBreakdown.totalRoundPoints} pts
                </Text>
                <Text style={[styles.tableCol, styles.colVal, styles.totalVal]}>
                  +{roundResult?.opponentBreakdown.totalRoundPoints} pts
                </Text>
              </View>
            </View>

            {/* Victory coins reward */}
            {roundResult?.isGameOver && roundResult.winner === 'player' && (
              <View style={styles.rewardBanner}>
                <Text style={styles.rewardBannerText}>
                  💰 جائزة الفوز: +200 🪙 jetons & +150 XP !
                </Text>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              {roundResult?.isGameOver ? (
                <>
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={handleRestartMatch}
                  >
                    <Text style={styles.modalPrimaryBtnText}>⚡ مباراة جديدة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSecondaryBtn}
                    onPress={onBackToLobby}
                  >
                    <Text style={styles.modalSecondaryBtnText}>العودة للردهة</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={handleProceedNextRound}
                >
                  <Text style={styles.modalPrimaryBtnText}>
                    الجولة التالية (جولة {roundNumber + 1}) ➔
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 8,
  },
  playerScoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123321',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderColor: '#1C4A31',
    borderWidth: 1,
    gap: 6,
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
    fontSize: 12,
    fontWeight: '700',
  },
  userScoreText: {
    color: '#FDE68A',
  },
  chkobbaMiniBadge: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  roomTagRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  roomTagText: {
    color: '#8DA896',
    fontSize: 11,
    fontWeight: '600',
  },

  // Felt Arena
  arenaContainer: {
    flex: 1,
    padding: 8,
  },
  woodFrame: {
    flex: 1,
    backgroundColor: '#4A2511',
    borderRadius: 20,
    padding: 6,
    borderWidth: 3,
    borderColor: '#2D160A',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  feltMat: {
    flex: 1,
    backgroundColor: '#0B3827',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#23613F',
    position: 'relative',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  feltInnerBorder: {
    ...StyleSheet.absoluteFill,
    margin: 7,
    borderWidth: 1,
    borderColor: 'rgba(225, 189, 82, 0.18)',
    borderRadius: 10,
  },
  tableMedallion: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: 'rgba(225, 189, 82, 0.12)',
    alignSelf: 'center',
    top: '50%',
    marginTop: -85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
    borderColor: 'rgba(225, 189, 82, 0.10)',
  },
  medallionMark: {
    color: 'rgba(225, 189, 82, 0.12)',
    fontSize: 52,
  },
  leftActionDrawer: {
    position: 'absolute',
    left: 8,
    top: 8,
    gap: 8,
    zIndex: 10,
  },
  drawerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 30, 20, 0.75)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Top seat: Bot Opponent
  topSeat: {
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E65100',
    borderWidth: 2,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarThinking: {
    borderColor: '#60A5FA',
    backgroundColor: '#1E3A8A',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
  },
  seatPlayerName: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
  },
  seatCardsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  seatCardsText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },

  // Banner
  turnBannerWrapper: {
    alignItems: 'center',
    marginVertical: 4,
  },
  turnBanner: {
    backgroundColor: 'rgba(13, 40, 24, 0.88)',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  turnBannerOpponent: {
    borderColor: '#E65100',
    backgroundColor: 'rgba(50, 18, 12, 0.88)',
  },
  turnBannerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Floating celebratory Chkobba banner
  floatingChkobbaBanner: {
    position: 'absolute',
    top: '42%',
    left: '10%',
    right: '10%',
    backgroundColor: '#D97706',
    borderColor: '#FEF08A',
    borderWidth: 3,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 99,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 12,
  },
  floatingChkobbaText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  // Table Center
  tableCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 10,
    gap: 12,
  },
  deckPileWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  deckLabelPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deckLabelText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '700',
  },
  openTableCards: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    minHeight: 100,
    paddingHorizontal: 28,
    paddingVertical: 8,
    alignItems: 'center',
  },
  emptyTablePlaceholder: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  emptyTableText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '800',
  },
  tableCardItem: {
    position: 'relative',
  },
  capturableGlow: {
    transform: [{ scale: 1.05 }],
  },
  captureIndicatorPill: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  captureIndicatorText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // Piles
  pilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  pileChip: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pileChipText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '600',
  },

  // Bottom Hand & Controls
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#123321',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1C4A31',
  },
  toolEmoji: {
    fontSize: 16,
  },
  primaryPlayButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledPlayButton: {
    backgroundColor: '#2D3748',
    opacity: 0.7,
    shadowOpacity: 0,
  },
  primaryPlayButtonText: {
    color: '#1A1405',
    fontSize: 13,
    fontWeight: '800',
  },
  handContainer: {
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cardSlot: {
    // Overlap handled inline
  },

  // Summary Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  summaryModalBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F2C1C',
    borderColor: '#D4AF37',
    borderWidth: 2,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  summaryHeader: {
    alignItems: 'center',
    gap: 4,
  },
  summaryTitle: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  summarySubtitle: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreTable: {
    backgroundColor: '#143C25',
    borderRadius: 10,
    overflow: 'hidden',
    borderColor: '#1F5335',
    borderWidth: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1E4E32',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#174026',
  },
  totalRow: {
    backgroundColor: '#1B472D',
    borderBottomWidth: 0,
    paddingVertical: 10,
  },
  tableCol: {
    fontSize: 12,
    color: '#FFF',
  },
  colLabel: {
    flex: 1.4,
    fontWeight: '700',
  },
  colVal: {
    flex: 1,
    textAlign: 'center',
    color: '#CBD5E1',
  },
  winVal: {
    color: '#4ADE80',
    fontWeight: '800',
  },
  totalLabel: {
    color: '#FDE68A',
    fontWeight: '900',
    fontSize: 13,
  },
  totalVal: {
    color: '#FDE68A',
    fontWeight: '900',
    fontSize: 13,
  },
  rewardBanner: {
    backgroundColor: '#1E3A8A',
    borderColor: '#60A5FA',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  rewardBannerText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '800',
  },
  modalActionsRow: {
    gap: 8,
    marginTop: 4,
  },
  modalPrimaryBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#1A1405',
    fontSize: 14,
    fontWeight: '900',
  },
  modalSecondaryBtn: {
    backgroundColor: '#173E28',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '700',
  },
});
