import React, { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TableArena } from './GameArena';
import { Feather, Ionicons } from '@expo/vector-icons';
import { PlayingCard } from './PlayingCard';
import {
  addRamiCardToMeld,
  canCallFreesh,
  completeRamiRound,
  createRamiGame,
  discardRamiCard,
  drawRamiCard,
  exchangeRamiJoker,
  findPlusPlayableCardIds,
  meldRamiCards,
  meldMultipleRamiCards,
  detectHandMelds,
  resolveRamiDeadMelds,
  validateRamiMeld,
  type RamiActionResult,
  type RamiCard,
  type RamiGameState,
  type RamiMeldCard,
  type RamiSuit,
} from './ramiLogic';

interface Props { opponentName: string; onBackToLobby?: () => void }
const cardLabel = (card: RamiCard) => card.suit === 'joker' ? 'Joker' : `${card.rank === 1 ? 'A' : card.rank >= 11 ? ['J', 'Q', 'K'][card.rank - 11] : card.rank}${{ spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[card.suit]}`;
const suitOrder: Record<RamiCard['suit'], number> = { clubs: 0, diamonds: 1, hearts: 2, spades: 3, joker: 4 };
const ramiCardValue = (card: RamiCard) => card.suit === 'joker' ? 10 : card.rank === 1 || card.rank >= 11 ? 10 : card.rank;

export const RamiGameScreen: React.FC<Props> = ({ opponentName, onBackToLobby }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [game, setGame] = useState<RamiGameState>(() => createRamiGame(['You', opponentName]));
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'مغادرة اللعبة',
        'هل أنت متأكد من مغادرة الطاولة الحالية؟',
        [
          { text: 'مواصلة اللعب', style: 'cancel' },
          { text: 'خروج', style: 'destructive', onPress: () => onBackToLobby?.() },
        ],
      );
      return true;
    });

    return () => subscription.remove();
  }, [onBackToLobby]);

  const player = game.players[0];
  const current = game.players[game.currentPlayerIndex];
  const botTurn = game.currentPlayerIndex !== 0;
  const plusIds = useMemo(() => findPlusPlayableCardIds(game, player.id), [game, player.id]);
  const orderedHand = useMemo(() => [...player.hand].sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || a.rank - b.rank || a.id.localeCompare(b.id)), [player.hand]);
  const handCardWidth = Math.min(58, Math.max(42, (screenWidth - 36 + 6 * 18) / 7));
  const handCardHeight = handCardWidth * (84 / 58);
  const handRows = Array.from({ length: Math.ceil(orderedHand.length / 7) }, (_, index) => orderedHand.slice(index * 7, (index + 1) * 7));

  const apply = (result: RamiActionResult) => {
    if (!result.ok) { Alert.alert('Rami', result.error); return; }
    setGame(resolveRamiDeadMelds(result.state));
    setSelected([]);
  };

  const startNextRound = () => setGame((state) => createRamiGame(
    state.players.map((entry) => entry.name),
    (state.dealerIndex + 1) % state.players.length,
    state.roundNumber + 1,
    state.players.map((entry) => entry.score),
  ));

  useEffect(() => {
    if (!botTurn || game.phase === 'roundOver' || game.phase === 'freesh') return;
    const timer = setTimeout(() => {
      setGame((state) => {
        if (state.phase === 'draw') {
          const drawn = drawRamiCard(state, state.turnNumber < 2 || !state.discardPile.length ? 'draw' : 'discard');
          return drawn.ok ? drawn.state : state;
        }
        if (state.phase !== 'play') return state;
        const actor = state.players[state.currentPlayerIndex];
        if (state.turnNumber === 0) {
          const openingDiscard = actor.hand.find((card) => card.suit !== 'joker');
          if (!openingDiscard) return state;
          const opened = discardRamiCard(state, actor.id, openingDiscard.id);
          return opened.ok ? opened.state : state;
        }
        // Open with the highest-scoring legal three-card combination available.
        if (!actor.opened) {
          const candidates: RamiMeldCard[][] = [];
          for (let a = 0; a < actor.hand.length; a++) for (let b = a + 1; b < actor.hand.length; b++) for (let c = b + 1; c < actor.hand.length; c++) {
            const set = [actor.hand[a], actor.hand[b], actor.hand[c]].map((card) => ({ card }));
            if (validateRamiMeld(set)) candidates.push(set);
          }
          const legal = candidates.map((cards) => ({ cards, info: validateRamiMeld(cards)! })).filter(({ info }) => state.firstOpeningLimit === null || info.points > state.firstOpeningLimit).sort((a, b) => b.info.points - a.info.points)[0];
          if (legal) {
            const melded = meldRamiCards(state, actor.id, legal.cards);
            if (melded.ok) return melded.state;
          }
        }
        const plus = findPlusPlayableCardIds(state, actor.id);
        const disposable = actor.hand.find((card) => card.suit !== 'joker' && !plus.has(card.id));
        if (!disposable) return state;
        const result = discardRamiCard(state, actor.id, disposable.id, actor.hand.length === 1);
        return result.ok ? result.state : state;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [botTurn, game]);

  useEffect(() => {
    if (game.phase === 'roundOver') setGame((state) => completeRamiRound(state));
  }, [game.phase]);

  const selectedCards = selected.map((id) => player.hand.find((card) => card.id === id)).filter((card): card is RamiCard => Boolean(card));
  const selectedMeld: RamiMeldCard[] = selectedCards.map((card) => ({ card }));
  const selectedMeldInfo = validateRamiMeld(selectedMeld);
  const detectedMelds = useMemo(() => detectHandMelds(player.hand), [player.hand]);
  const selectedDetectedGroups = detectedMelds.groups.filter((group) => group.cards.every(({ card }) => selected.includes(card.id)));
  const selectedDetectedCardCount = selectedDetectedGroups.reduce((count, group) => count + group.cards.length, 0);
  const meetsOpeningThreshold = Boolean(selectedMeldInfo) && (player.opened || game.firstOpeningLimit === null || selectedMeldInfo!.points > game.firstOpeningLimit);
  const canOpen = Boolean(meetsOpeningThreshold) && game.phase === 'play' && !botTurn && game.turnNumber !== 0;
  const handPoints = player.hand.reduce((sum, card) => sum + ramiCardValue(card), 0);
  const canMeldInteract = game.phase === 'play' && !botTurn && game.turnNumber !== 0;
  const meldPoints = (cards: RamiMeldCard[]) => validateRamiMeld(cards)?.points ?? 0;
  const meldOwnerName = (ownerId: string) => game.players.find((entry) => entry.id === ownerId)?.name ?? '';
  const cardFace = (card: RamiCard, representedSuit?: RamiSuit, representedRank?: number) => (
    <PlayingCard gameMode="rami" suit={card.suit === 'joker' ? representedSuit ?? 'spades' : card.suit} rank={card.suit === 'joker' ? representedRank ?? 1 : card.rank} width={39} height={56} />
  );
  const canDiscardSelected = selected.length === 1 && game.phase === 'play' && !botTurn && (() => {
    const card = player.hand.find((entry) => entry.id === selected[0]);
    if (!card || card.suit === 'joker') return false;
    if (game.turnNumber === 0) return true; // Dealer must discard on opening turn
    const last = player.hand.length === 1;
    return last || !plusIds.has(card.id);
  })();

  return (
    <SafeAreaView style={[styles.root, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0) }]}>
      <View style={styles.header}>
        <View style={styles.topBar}>
          <TouchableOpacity accessibilityLabel="Menu" onPress={onBackToLobby} style={styles.topIcon}><Feather name="menu" size={20} color="#FFF" /></TouchableOpacity>
          <View style={styles.partner}><View style={styles.partnerAvatar}><Text style={styles.partnerAvatarText}>{opponentName.slice(0, 1).toUpperCase()}</Text></View><Text numberOfLines={1} style={styles.partnerName}>Partenaire saoudien</Text></View>
          <TouchableOpacity accessibilityLabel="Inviter" onPress={() => Alert.alert('Invitation', 'Invitez un partenaire à la table.')} style={styles.topIcon}><Feather name="user-plus" size={18} color="#FFF" /></TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Notifications" onPress={() => Alert.alert('Notifications', 'Aucune nouvelle notification.')} style={styles.topIcon}><Ionicons name="notifications-outline" size={19} color="#FFF" /><View style={styles.notificationDot}><Text style={styles.notificationText}>2</Text></View></TouchableOpacity>
        </View>
        <View style={styles.scoreStrip}>{game.players.map((entry, index) => <View key={entry.id} style={styles.scorePill}><View style={[styles.scoreDot, index === game.currentPlayerIndex && styles.activeScoreDot]} /><Text numberOfLines={1} style={styles.scorePlayer}>{entry.name}</Text><Text style={styles.scoreValue}>{entry.score}</Text></View>)}<View style={styles.turnPill}><Text style={styles.turnText}>Tour {game.turnNumber + 1}/5</Text></View></View>
      </View>
      <Text style={styles.status}>{game.phase === 'roundOver' ? game.message : `${current.name}: ${game.phase === 'draw' ? 'draw a card' : game.phase === 'play' ? 'meld or discard' : game.message}`}</Text>
      {game.phase === 'play' && game.turnNumber === 0 && <Text style={styles.muted}>Dealer opens by discarding one card · no draw or meld on turn one</Text>}
      {game.phase === 'draw' && game.turnNumber === 1 && <Text style={styles.muted}>First draw: draw pile only · no discard pickup</Text>}
      {game.players.some((entry) => canCallFreesh(entry.hand)) && game.phase === 'draw' && game.turnNumber === 0 && <TouchableOpacity style={styles.button} onPress={() => setGame(createRamiGame(game.players.map((entry) => entry.name), game.dealerIndex, game.roundNumber, game.players.map((entry) => entry.score)))}><Text style={styles.buttonText}>Freesh · reshuffle</Text></TouchableOpacity>}
      <TableArena portrait style={styles.ramiArena}>
        <View style={styles.seatRow}>
          <View style={styles.seat}><View style={styles.opponentAvatar}><Text style={styles.avatarText}>{opponentName.slice(0, 1).toUpperCase()}</Text></View><Text numberOfLines={1} style={styles.seatName}>{opponentName}</Text><View style={styles.cardFan}>{[0,1,2].map((i) => <View key={i} style={[styles.backCard, { left: i * 9 }]} />)}</View></View>
          <View style={styles.seat}><View style={styles.opponentAvatar}><Text style={styles.avatarText}>Y</Text></View><Text style={styles.seatName}>You</Text><View style={styles.cardFan}>{[0,1,2].map((i) => <View key={i} style={[styles.backCard, { left: i * 9 }]} />)}</View></View>
        </View>
        <View style={styles.tableMiddle}>
          <View style={styles.sideSeat}><View style={styles.opponentAvatar}><Text style={styles.avatarText}>{opponentName.slice(0, 1).toUpperCase()}</Text></View><Text numberOfLines={1} style={styles.seatName}>{opponentName}</Text></View>
          <View style={styles.pileColumn}>
            <View style={styles.arrows}><Feather name="arrow-down" size={20} color="#FFF" /><Feather name="arrow-up" size={20} color="#FFF" /></View>
            <View style={styles.piles}>
              <TouchableOpacity disabled={game.phase !== 'draw' || botTurn} style={styles.pile} onPress={() => apply(drawRamiCard(game, 'draw'))}>
                <View style={styles.backCardLarge} /><Text style={styles.pileText}>Pioche</Text><Text style={styles.count}>{game.drawPile.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={game.phase !== 'draw' || botTurn || game.turnNumber < 2} style={styles.pile} onPress={() => apply(drawRamiCard(game, 'discard'))}>
                {game.discardPile.length ? cardFace(game.discardPile[game.discardPile.length - 1]) : <Text style={styles.pileText}>Défausse</Text>}<Text style={styles.count}>{game.discardPile.length}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.sideSeat}><View style={styles.opponentAvatar}><Text style={styles.avatarText}>R</Text></View><Text style={styles.seatName}>Rami</Text></View>
        </View>
        <ScrollView style={styles.meldArea} contentContainerStyle={styles.meldContent}>
          {game.melds.map((meld) => <View key={meld.id} style={styles.meld}>
            {meld.faceDown ? <View style={styles.deadMeld}><View style={styles.deadCard}><PlayingCard gameMode="rami" suit="spades" rank={1} width={39} height={56} isFaceDown /></View><View style={[styles.deadCard, styles.deadCardSecond]}><PlayingCard gameMode="rami" suit="spades" rank={1} width={39} height={56} isFaceDown /></View><Text style={styles.deadLabel}>Meld enterré · مجموعة مخفية</Text></View> : <>
              <View style={styles.meldHeader}><Text numberOfLines={1} style={styles.meldTitle}>{meld.kind === 'sequence' ? 'Séquence' : 'Brelan'} {meldPoints(meld.cards)} pts · {meld.ownerId === player.id ? 'Toi' : meldOwnerName(meld.ownerId)}</Text></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.meldCards}>
                {meld.cards.map(({ card, representedSuit, representedRank }, index) => <View key={card.id} style={[styles.meldCard, index > 0 && styles.overlapCard]}>{cardFace(card, representedSuit, representedRank)}</View>)}
                {canMeldInteract && player.opened && player.hand.filter((card) => card.suit !== 'joker').map((card) => <TouchableOpacity accessibilityLabel={`Ajouter ${cardLabel(card)}`} key={`add-${meld.id}-${card.id}`} style={[styles.addMeldCard, styles.overlapCard]} onPress={() => apply(addRamiCardToMeld(game, player.id, card.id, meld.id))}><Feather name="plus" size={20} color="#123B27" /></TouchableOpacity>)}
                {canMeldInteract && player.opened && meld.cards.filter((entry) => entry.card.suit === 'joker').map((entry) => {
                  const real = player.hand.find((card) => card.suit === entry.representedSuit && card.rank === entry.representedRank);
                  return real ? <TouchableOpacity key={`exchange-${entry.card.id}`} style={[styles.exchangeCard, styles.overlapCard]} onPress={() => apply(exchangeRamiJoker(game, player.id, entry.card.id, real.id))}><Text style={styles.exchangeText}>Remplacer Joker</Text><Text style={styles.exchangeSubtext}>par {cardLabel(real)}</Text></TouchableOpacity> : null;
                })}
              </ScrollView>
            </>}
          </View>)}
          {game.melds.length === 0 && <Text style={styles.muted}>Aucune combinaison · ouverture à {game.firstOpeningLimit ?? 51}+ pts</Text>}
        </ScrollView>
      </TableArena>
      <View style={styles.hand}>
        {handRows.map((row, rowIndex) => <View key={rowIndex} style={[styles.handRow, rowIndex > 0 && styles.secondHandRow]}>
        {row.map((card, columnIndex) => <TouchableOpacity
          key={card.id}
          activeOpacity={0.88}
          onPress={() => setSelected((ids) =>
            ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id]
          )}
          onLongPress={() => {
            if (game.phase === 'play' && !botTurn && game.turnNumber !== 0) {
              const selectedCard = player.hand.find((entry) => entry.id === card.id);
              if (selectedCard && selectedCard.suit !== 'joker' && (game.turnNumber === 0 || player.hand.length === 1 || !plusIds.has(card.id))) {
                const last = player.hand.length === 1;
                apply(discardRamiCard(game, player.id, card.id, last));
              }
            }
          }}
          delayLongPress={400}
          style={[styles.handCard, { width: handCardWidth, height: handCardHeight }, { marginLeft: columnIndex === 0 ? 0 : -18 }, detectedMelds.cardGroupMap[card.id] && { borderColor: detectedMelds.cardGroupMap[card.id].color }, selected.includes(card.id) && styles.selectedCard]}
        >
          {card.suit === 'joker' ? <View style={[styles.joker, { width: handCardWidth, height: handCardHeight }]}><Text style={styles.jokerText}>JOKER</Text></View> : <PlayingCard gameMode="rami" suit={card.suit} rank={card.rank} width={handCardWidth} height={handCardHeight} />}
        </TouchableOpacity>)}
        </View>)}
      </View>
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.socialActions}>
          <View style={styles.avatar}><Text style={styles.avatarText}>Y</Text></View>
          <TouchableOpacity onPress={() => Alert.alert('Chat', 'Le chat sera bientôt disponible.')} style={styles.socialButton}><Text style={styles.socialIcon}>☷</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Cadeau', 'Les cadeaux seront bientôt disponibles.')} style={styles.socialButton}><Text style={styles.socialIcon}>🎁</Text></TouchableOpacity>
        </View>
        <Text style={styles.totalText}>Total {handPoints}/{game.firstOpeningLimit ?? 51}{'\n'}<Text style={styles.totalCaption}>{handPoints} en main · seuil d’ouverture {game.firstOpeningLimit ?? 51}</Text></Text>
        <TouchableOpacity disabled={!(canOpen || (selectedDetectedGroups.length > 0 && selectedDetectedCardCount === selected.length && canMeldInteract))} style={[styles.descendButton, !(canOpen || (selectedDetectedGroups.length > 0 && selectedDetectedCardCount === selected.length && canMeldInteract)) && styles.descendDisabled]} onPress={() => {
          if (selectedDetectedGroups.length > 0 && selectedDetectedCardCount === selected.length && canMeldInteract) {
            apply(meldMultipleRamiCards(game, player.id, selectedDetectedGroups.map((group) => group.cards)));
          } else {
            apply(meldRamiCards(game, player.id, selectedMeld));
          }
        }}>
          <Text style={[styles.descendText, !(canOpen || (selectedDetectedGroups.length > 0 && selectedDetectedCardCount === selected.length && canMeldInteract)) && styles.descendDisabledText]}>{selectedDetectedGroups.length > 0 && selectedDetectedCardCount === selected.length && selected.length > 0 ? `Descendre ${selectedDetectedGroups.length} meld(s)` : meetsOpeningThreshold && selectedMeldInfo ? (player.opened ? `Descendre (${selectedMeldInfo.points} pts)` : `Ouvrir (${selectedMeldInfo.points} pts)`) : 'Meld invalide'}</Text>
        </TouchableOpacity>
      </View>
      {game.phase === 'roundOver' && <View style={styles.roundOver}>
        <Text style={styles.title}>Round complete · lowest total score wins</Text>
        {game.players.map((entry) => <Text key={entry.id} style={styles.score}>{entry.name}: {entry.score} points</Text>)}
        <TouchableOpacity style={styles.button} onPress={startNextRound}><Text style={styles.buttonText}>Next round</Text></TouchableOpacity>
      </View>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101014' },
  header: { gap: 7, paddingHorizontal: 10, paddingTop: 4 },
  topBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#22242A', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  partner: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8 },
  partnerAvatar: { width: 31, height: 31, borderRadius: 16, backgroundColor: '#1B6A40', borderWidth: 1.5, borderColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  partnerAvatarText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  partnerName: { color: '#FFF', fontWeight: '800', fontSize: 12, flexShrink: 1 },
  notificationDot: { position: 'absolute', right: -2, top: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#E34242', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#101014' },
  notificationText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  scoreStrip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scorePill: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 6, height: 27, borderRadius: 14, backgroundColor: '#27282D' },
  scoreDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7C827D' },
  activeScoreDot: { backgroundColor: '#42D392' },
  scorePlayer: { color: '#E8E8E8', fontSize: 9, fontWeight: '700', flexShrink: 1 },
  scoreValue: { color: '#F6CE62', fontSize: 10, fontWeight: '900' },
  turnPill: { minWidth: 58, height: 27, borderRadius: 14, backgroundColor: '#050506', paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  turnText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  title: { color: '#FDE68A', fontWeight: '900', fontSize: 18, textAlign: 'center' },
  score: { color: '#FFF', fontSize: 13, textAlign: 'center' },
  link: { color: '#FDE68A', fontWeight: '800', padding: 6 },
  status: { color: '#FFF', textAlign: 'center', padding: 10, fontWeight: '700' },
  opponent: { alignItems: 'center', padding: 8 },
  section: { color: '#FFF', fontWeight: '800' },
  zone: { flex: 1, margin: 12, padding: 10, borderRadius: 16, backgroundColor: '#15532F' },
  ramiArena: { zIndex: 1 },
  seatRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', width: '100%', zIndex: 2 },
  seat: { width: 92, minHeight: 76, alignItems: 'center', justifyContent: 'flex-start' },
  sideSeat: { width: 56, alignItems: 'center', justifyContent: 'center' },
  opponentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1B6A40', borderWidth: 2, borderColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  seatName: { color: '#FFF', fontSize: 9, fontWeight: '800', backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, maxWidth: 76, textAlign: 'center', overflow: 'hidden', zIndex: 3 },
  cardFan: { width: 40, height: 24, position: 'absolute', top: 20, zIndex: 1 },
  backCard: { position: 'absolute', width: 16, height: 24, borderRadius: 3, borderWidth: 1, borderColor: '#E3C66A', backgroundColor: '#173D72', transform: [{ rotate: '-8deg' }] },
  tableMiddle: { flex: 1, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pileColumn: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  arrows: { flexDirection: 'row', justifyContent: 'space-evenly', width: 90, marginBottom: 4 },
  piles: { flexDirection: 'row', justifyContent: 'center', gap: 8, width: '100%' },
  pile: { width: '47%', minWidth: 88, minHeight: 64, backgroundColor: '#0A5C38', borderColor: '#D4AF37', borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', padding: 4 },
  backCardLarge: { width: 22, height: 30, borderRadius: 3, borderWidth: 1, borderColor: '#E3C66A', backgroundColor: '#173D72' },
  pileText: { color: '#FFF', fontWeight: '700' },
  count: { color: '#FDE68A', fontWeight: '900' },
  meldArea: { flex: 1, marginTop: 10 },
  meldContent: { paddingBottom: 12 },
  meld: { backgroundColor: 'rgba(4,39,24,0.76)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5, marginVertical: 4, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  meldHeader: { minHeight: 21, justifyContent: 'center' },
  meldTitle: { color: '#FDE68A', fontWeight: '800', fontSize: 10 },
  meldCards: { flexDirection: 'row', alignItems: 'center', paddingTop: 2, paddingBottom: 4, paddingRight: 6 },
  meldCard: { width: 39, height: 56, flexShrink: 0 },
  overlapCard: { marginLeft: -14 },
  addMeldCard: { width: 34, height: 48, borderRadius: 7, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E3C66A', backgroundColor: '#FDE68A', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  exchangeCard: { minWidth: 74, height: 48, paddingHorizontal: 5, borderRadius: 7, borderWidth: 1, borderColor: '#F2C45C', backgroundColor: '#183B2B', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  exchangeText: { color: '#FFE39A', fontSize: 8, fontWeight: '900', textAlign: 'center' },
  exchangeSubtext: { color: '#FFF', fontSize: 7, textAlign: 'center' },
  deadMeld: { height: 62, flexDirection: 'row', alignItems: 'center', paddingLeft: 2 },
  deadCard: { width: 39, height: 56 },
  deadCardSecond: { marginLeft: -14 },
  deadLabel: { color: '#E5D7A3', fontSize: 9, fontWeight: '800', marginLeft: 8 },
  muted: { color: '#D1D5DB', textAlign: 'center', marginTop: 20 },
  button: { flex: 1, minHeight: 42, borderRadius: 10, backgroundColor: '#B8860B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, marginVertical: 4 },
  discardButton: { backgroundColor: '#9F3A38' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#FFF', fontWeight: '900', textAlign: 'center' },
  hand: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20, alignItems: 'center' },
  handRow: { height: 104, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2 },
  secondHandRow: { marginTop: 14, zIndex: 1 },
  handCard: { borderWidth: 1, borderColor: 'transparent', borderRadius: 8, position: 'relative', flexShrink: 0, overflow: 'visible' },
  selectedCard: { borderColor: '#FDE047', transform: [{ translateY: -10 }], zIndex: 10, elevation: 12 },
  joker: { width: 58, height: 84, borderRadius: 7, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderColor: '#D4AF37', borderWidth: 1 },
  jokerText: { color: '#9F1239', fontWeight: '900', fontSize: 10 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8, paddingHorizontal: 12, backgroundColor: '#071D12', borderTopWidth: 1, borderTopColor: '#27543B' },
  socialActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1B6A40', alignItems: 'center', justifyContent: 'center', borderColor: '#F5B301', borderWidth: 1.5 },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  socialButton: { width: 30, height: 34, alignItems: 'center', justifyContent: 'center' },
  socialIcon: { color: '#FFF', fontSize: 19, fontWeight: '800' },
  totalText: { color: '#FFF', fontSize: 12, fontWeight: '900', textAlign: 'center', flexShrink: 1 },
  totalCaption: { color: '#CBD5CE', fontSize: 8, fontWeight: '600' },
  descendButton: { minWidth: 112, minHeight: 48, borderRadius: 12, backgroundColor: '#F5B301', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  descendDisabled: { backgroundColor: '#66716A' },
  descendText: { color: '#172012', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  descendDisabledText: { color: '#E5E7EB' },
  roundOver: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5,20,12,0.96)', justifyContent: 'center', padding: 24, gap: 12 },
});