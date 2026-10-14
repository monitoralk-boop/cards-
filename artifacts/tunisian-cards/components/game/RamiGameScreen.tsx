import React, { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  resolveRamiDeadMelds,
  validateRamiMeld,
  type RamiActionResult,
  type RamiCard,
  type RamiGameState,
  type RamiMeldCard,
} from './ramiLogic';

interface Props { opponentName: string; onBackToLobby?: () => void }
const cardLabel = (card: RamiCard) => card.suit === 'joker' ? 'Joker' : `${card.rank === 1 ? 'A' : card.rank >= 11 ? ['J', 'Q', 'K'][card.rank - 11] : card.rank}${{ spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[card.suit]}`;

export const RamiGameScreen: React.FC<Props> = ({ opponentName, onBackToLobby }) => {
  const insets = useSafeAreaInsets();
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
  const canOpen = Boolean(selectedMeldInfo) && (player.opened || game.firstOpeningLimit === null || selectedMeldInfo!.points > game.firstOpeningLimit);
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
        <TouchableOpacity onPress={onBackToLobby}><Text style={styles.link}>‹ Lobby</Text></TouchableOpacity>
        <Text style={styles.title}>Rami Tunisien · Quatorze</Text>
        <Text style={styles.score}>Round {game.roundNumber} · You {player.score} / {game.players[1].name} {game.players[1].score}</Text>
      </View>
      <Text style={styles.status}>{game.phase === 'roundOver' ? game.message : `${current.name}: ${game.phase === 'draw' ? 'draw a card' : game.phase === 'play' ? 'meld or discard' : game.message}`}</Text>
      {game.phase === 'play' && game.turnNumber === 0 && <Text style={styles.muted}>Dealer opens by discarding one card · no draw or meld on turn one</Text>}
      {game.phase === 'draw' && game.turnNumber === 1 && <Text style={styles.muted}>First draw: draw pile only · no discard pickup</Text>}
      {game.players.some((entry) => canCallFreesh(entry.hand)) && game.phase === 'draw' && game.turnNumber === 0 && <TouchableOpacity style={styles.button} onPress={() => setGame(createRamiGame(game.players.map((entry) => entry.name), game.dealerIndex, game.roundNumber, game.players.map((entry) => entry.score)))}><Text style={styles.buttonText}>Freesh · reshuffle</Text></TouchableOpacity>}
      <View style={styles.opponent}><Text style={styles.section}>{opponentName} · {game.players[1].hand.length} cards</Text></View>
      <View style={styles.zone}>
      <View style={styles.piles}>
          <TouchableOpacity disabled={game.phase !== 'draw' || botTurn} style={styles.pile} onPress={() => apply(drawRamiCard(game, 'draw'))}>
            <Text style={styles.pileText}>Draw pile</Text><Text style={styles.count}>{game.drawPile.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={game.phase !== 'draw' || botTurn || game.turnNumber < 2} style={styles.pile} onPress={() => apply(drawRamiCard(game, 'discard'))}>
            <Text style={styles.pileText}>Discard</Text><Text style={styles.count}>{game.discardPile.length ? cardLabel(game.discardPile[game.discardPile.length - 1]) : 'Empty'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.meldArea}>
          {game.melds.map((meld) => <View key={meld.id} style={styles.meld}>
            <Text style={styles.meldTitle}>{meld.faceDown ? 'Dead meld (buried)' : `${meld.kind} · ${meld.ownerId === player.id ? 'You' : opponentName}`}</Text>
            {!meld.faceDown && <View style={styles.meldCards}>{meld.cards.map(({ card }) => <Text key={card.id} style={styles.cardText}>{cardLabel(card)}</Text>)}</View>}
            {!meld.faceDown && game.phase === 'play' && !botTurn && player.opened && <View style={styles.meldCards}>{player.hand.filter((card) => card.suit !== 'joker').map((card) => <TouchableOpacity key={card.id} onPress={() => apply(addRamiCardToMeld(game, player.id, card.id, meld.id))}><Text style={styles.link}>+{cardLabel(card)}</Text></TouchableOpacity>)}</View>}
            {!meld.faceDown && game.phase === 'play' && !botTurn && player.opened && meld.cards.filter((entry) => entry.card.suit === 'joker').map((entry) => {
              const real = player.hand.find((card) => card.suit === entry.representedSuit && card.rank === entry.representedRank);
              return real ? <TouchableOpacity key={entry.card.id} onPress={() => apply(exchangeRamiJoker(game, player.id, entry.card.id, real.id))}><Text style={styles.link}>Replace joker with {cardLabel(real)}</Text></TouchableOpacity> : null;
            })}
          </View>)}
          {game.melds.length === 0 && <Text style={styles.muted}>No melds yet · opening meld sets the initial limit (51+ points).</Text>}
        </ScrollView>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity disabled={!canOpen || game.phase !== 'play' || botTurn || game.turnNumber === 0} style={[styles.button, (!canOpen || game.phase !== 'play' || botTurn || game.turnNumber === 0) && styles.disabled]} onPress={() => apply(meldRamiCards(game, player.id, selectedMeld))}>
          <Text style={styles.buttonText}>{player.opened ? 'Meld selected cards' : `Open${selectedMeldInfo ? ` (${selectedMeldInfo.points} pts)` : ' · select a meld'}`}</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={!canDiscardSelected} style={[styles.button, styles.discardButton, !canDiscardSelected && styles.disabled]} onPress={() => {
          const card = player.hand.find((entry) => entry.id === selected[0]);
          if (card) apply(discardRamiCard(game, player.id, card.id, player.hand.length === 1));
        }}><Text style={styles.buttonText}>Discard selected</Text></TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        contentContainerStyle={styles.hand}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
      >
        {player.hand.map((card) => <TouchableOpacity
          key={card.id}
          onPress={() => setSelected((ids) =>
            ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id]
          )}
          onLongPress={() => {
            if (game.phase === 'play' && !botTurn && game.turnNumber !== 0) {
              const selectedCard = player.hand.find((entry) => entry.id === card.id);
              if (selectedCard && selectedCard.suit !== 'joker') {
                const last = player.hand.length === 1;
                apply(discardRamiCard(game, player.id, card.id, last));
              }
            }
          }}
          delayLongPress={400}
          style={[styles.handCard, selected.includes(card.id) && styles.selectedCard, plusIds.has(card.id) && styles.plusCard]}
        >
          {card.suit === 'joker' ? <View style={styles.joker}><Text style={styles.jokerText}>JOKER</Text></View> : <PlayingCard gameMode="rami" suit={card.suit} rank={card.rank} width={58} height={84} />}
          {plusIds.has(card.id) && <Text style={styles.plusLabel}>PLUS</Text>}
        </TouchableOpacity>)}
      </ScrollView>
      {game.phase === 'roundOver' && <View style={styles.roundOver}>
        <Text style={styles.title}>Round complete · lowest total score wins</Text>
        {game.players.map((entry) => <Text key={entry.id} style={styles.score}>{entry.name}: {entry.score} points</Text>)}
        <TouchableOpacity style={styles.button} onPress={startNextRound}><Text style={styles.buttonText}>Next round</Text></TouchableOpacity>
      </View>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D2818' },
  header: { alignItems: 'center', gap: 4, paddingHorizontal: 16 },
  title: { color: '#FDE68A', fontWeight: '900', fontSize: 18, textAlign: 'center' },
  score: { color: '#FFF', fontSize: 13, textAlign: 'center' },
  link: { color: '#FDE68A', fontWeight: '800', padding: 6 },
  status: { color: '#FFF', textAlign: 'center', padding: 10, fontWeight: '700' },
  opponent: { alignItems: 'center', padding: 8 },
  section: { color: '#FFF', fontWeight: '800' },
  zone: { flex: 1, margin: 12, padding: 10, borderRadius: 16, backgroundColor: '#15532F' },
  piles: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  pile: { minWidth: 110, minHeight: 64, backgroundColor: '#073B25', borderColor: '#D4AF37', borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pileText: { color: '#FFF', fontWeight: '700' },
  count: { color: '#FDE68A', fontWeight: '900' },
  meldArea: { flex: 1, marginTop: 10 },
  meld: { backgroundColor: '#0D2818', borderRadius: 10, padding: 8, marginVertical: 5 },
  meldTitle: { color: '#FDE68A', fontWeight: '800' },
  meldCards: { flexDirection: 'row', gap: 8, padding: 6 },
  cardText: { color: '#FFF', fontWeight: '800' },
  muted: { color: '#D1D5DB', textAlign: 'center', marginTop: 20 },
  controls: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  button: { flex: 1, minHeight: 42, borderRadius: 10, backgroundColor: '#B8860B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, marginVertical: 4 },
  discardButton: { backgroundColor: '#9F3A38' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#FFF', fontWeight: '900', textAlign: 'center' },
  hand: { alignItems: 'flex-end', paddingHorizontal: 32, paddingTop: 10, paddingBottom: 18, gap: 3 },
  handCard: { borderWidth: 2, borderColor: 'transparent', borderRadius: 8, position: 'relative' },
  selectedCard: { borderColor: '#FDE047', transform: [{ translateY: -8 }] },
  plusCard: { borderBottomColor: '#22C55E' },
  plusLabel: { color: '#86EFAC', position: 'absolute', bottom: -14, alignSelf: 'center', fontSize: 8, fontWeight: '900' },
  joker: { width: 58, height: 84, borderRadius: 7, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderColor: '#D4AF37', borderWidth: 1 },
  jokerText: { color: '#9F1239', fontWeight: '900', fontSize: 10 },
  roundOver: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5,20,12,0.96)', justifyContent: 'center', padding: 24, gap: 12 },
});