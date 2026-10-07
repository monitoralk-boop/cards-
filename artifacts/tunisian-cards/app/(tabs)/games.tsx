import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { GameArena } from '@/components/game/GameArena';

interface Room {
  id: string;
  code: string;
  title: string;
  gameType: 'chkobba' | 'rami';
  playerCount: number;
  maxPlayers: number;
  entryFee: number;
  targetScore: number;
  hostName: string;
}

export default function GamesScreen() {
  const [filter, setFilter] = useState<'all' | 'chkobba' | 'rami'>('all');
  const [joinCode, setJoinCode] = useState('');
  const [activeGameMode, setActiveGameMode] = useState<'chkobba' | 'rami' | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomType, setNewRoomType] = useState<'chkobba' | 'rami'>('chkobba');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState<2 | 3 | 4>(2);

  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 'r-1',
      code: 'TUN21',
      title: 'قهوة العالية · Chkobba 2v2',
      gameType: 'chkobba',
      playerCount: 3,
      maxPlayers: 4,
      entryFee: 100,
      targetScore: 21,
      hostName: 'CH AMINE',
    },
    {
      id: 'r-2',
      code: 'CHK77',
      title: 'دفي 1 ضد 1 · السبع الحيّة',
      gameType: 'chkobba',
      playerCount: 1,
      maxPlayers: 2,
      entryFee: 250,
      targetScore: 21,
      hostName: 'ANIS',
    },
    {
      id: 'r-3',
      code: 'RAM51',
      title: 'طاولة الرامي الكلاسيكية',
      gameType: 'rami',
      playerCount: 2,
      maxPlayers: 4,
      entryFee: 500,
      targetScore: 51,
      hostName: 'MAHDI V.',
    },
    {
      id: 'r-4',
      code: 'SOUSSE',
      title: 'تحدي سوسة السريع',
      gameType: 'chkobba',
      playerCount: 1,
      maxPlayers: 2,
      entryFee: 100,
      targetScore: 11,
      hostName: 'Sami_Sousse',
    },
  ]);

  if (activeGameMode) {
    return (
      <GameArena
        gameMode={activeGameMode}
        onBackToLobby={() => setActiveGameMode(null)}
      />
    );
  }

  const filteredRooms = rooms.filter((r) => {
    if (filter === 'all') return true;
    return r.gameType === filter;
  });

  const handleJoinByCode = () => {
    if (!joinCode.trim()) return;
    const found = rooms.find((r) => r.code.toUpperCase() === joinCode.trim().toUpperCase());
    if (found) {
      setActiveGameMode(found.gameType);
    } else {
      Alert.alert('Table introuvable', 'Vérifiez le code de la table.');
    }
  };

  const handleCreateRoom = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newRoom: Room = {
      id: `r-${Date.now()}`,
      code,
      title: newRoomTitle.trim() || (newRoomType === 'chkobba' ? 'طاولة شكبة جديدة' : 'طاولة رامي جديدة'),
      gameType: newRoomType,
      playerCount: 1,
      maxPlayers: newRoomMaxPlayers,
      entryFee: 100,
      targetScore: newRoomType === 'chkobba' ? 21 : 51,
      hostName: 'monitoralk',
    };

    setRooms([newRoom, ...rooms]);
    setShowCreateModal(false);
    setActiveGameMode(newRoomType);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Salons & Tables</Text>
            <Text style={styles.subtitle}>Rejoignez des joueurs en direct</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.createBtn}
          >
            <Feather name="plus-circle" size={16} color="#1A1405" />
            <Text style={styles.createBtnText}>Créer une table</Text>
          </TouchableOpacity>
        </View>

        {/* Join by Code bar */}
        <View style={styles.joinCodeBox}>
          <Feather name="hash" size={16} color="#D4AF37" />
          <TextInput
            style={styles.joinInput}
            placeholder="Code de table privé (ex: TUN21)..."
            placeholderTextColor="#688773"
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            disabled={!joinCode.trim()}
            onPress={handleJoinByCode}
            style={[
              styles.joinBtn,
              !joinCode.trim() && styles.joinBtnDisabled,
            ]}
          >
            <Text style={styles.joinBtnText}>Rejoindre</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive,
              ]}
            >
              Toutes ({rooms.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('chkobba')}
            style={[
              styles.filterPill,
              filter === 'chkobba' && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'chkobba' && styles.filterTextActive,
              ]}
            >
              🃏 Chkobba
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('rami')}
            style={[
              styles.filterPill,
              filter === 'rami' && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'rami' && styles.filterTextActive,
              ]}
            >
              ♠️ Rami
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rooms List */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredRooms.map((room) => (
            <View key={room.id} style={styles.roomCard}>
              <View style={styles.roomHeader}>
                <View style={styles.roomBadgeRow}>
                  <View style={styles.roomTypeTag}>
                    <Text style={styles.roomTypeTagText}>
                      {room.gameType === 'chkobba' ? 'Chkobba 40c' : 'Rami 108c'}
                    </Text>
                  </View>
                  <Text style={styles.roomCode}>#{room.code}</Text>
                </View>

                <View style={styles.seatsPill}>
                  <Ionicons name="people" size={12} color="#D4AF37" />
                  <Text style={styles.seatsPillText}>
                    {room.playerCount}/{room.maxPlayers}
                  </Text>
                </View>
              </View>

              <Text style={styles.roomTitle}>{room.title}</Text>
              <Text style={styles.roomHost}>Hôte : {room.hostName} · Objectif {room.targetScore} pts</Text>

              <View style={styles.roomFooter}>
                <View style={styles.entryFeePill}>
                  <Text style={styles.entryFeeEmoji}>🪙</Text>
                  <Text style={styles.entryFeeText}>{room.entryFee} jetons</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setActiveGameMode(room.gameType)}
                  style={styles.enterTableBtn}
                >
                  <Text style={styles.enterTableBtnText}>Prendre place</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Create Room Modal */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Créer une nouvelle table</Text>

              {/* Game Type Selection */}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Jeu :</Text>
                <View style={styles.typeToggle}>
                  <TouchableOpacity
                    onPress={() => setNewRoomType('chkobba')}
                    style={[
                      styles.toggleOption,
                      newRoomType === 'chkobba' && styles.toggleOptionActive,
                    ]}
                  >
                    <Text style={styles.toggleText}>Chkobba</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setNewRoomType('rami')}
                    style={[
                      styles.toggleOption,
                      newRoomType === 'rami' && styles.toggleOptionActive,
                    ]}
                  >
                    <Text style={styles.toggleText}>Rami</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Player Count */}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Joueurs :</Text>
                <View style={styles.playerCountRow}>
                  {[2, 3, 4].map((count) => (
                    <TouchableOpacity
                      key={count}
                      onPress={() => setNewRoomMaxPlayers(count as 2 | 3 | 4)}
                      style={[
                        styles.countBtn,
                        newRoomMaxPlayers === count && styles.countBtnActive,
                      ]}
                    >
                      <Text style={styles.countBtnText}>{count}j</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Nom de la table (ex: قهوة الحومة)"
                placeholderTextColor="#688773"
                value={newRoomTitle}
                onChangeText={setNewRoomTitle}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCreateRoom}
                  style={styles.modalConfirmBtn}
                >
                  <Text style={styles.modalConfirmText}>Ouvrir la table</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A2114',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D2818',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  createBtnText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 12,
  },
  joinCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 8,
  },
  joinInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
  },
  joinBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  joinBtnDisabled: {
    backgroundColor: '#1A3F29',
  },
  joinBtnText: {
    color: '#1A1405',
    fontSize: 11,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterPillActive: {
    backgroundColor: '#1C4A2E',
    borderColor: '#D4AF37',
  },
  filterText: {
    color: '#8DA896',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FDE68A',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
    gap: 12,
  },
  roomCard: {
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomTypeTag: {
    backgroundColor: '#1A422B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roomTypeTagText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '800',
  },
  roomCode: {
    color: '#6E8B78',
    fontSize: 11,
    fontWeight: '700',
  },
  seatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  seatsPillText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
  },
  roomTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  roomHost: {
    color: '#8DA896',
    fontSize: 11,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  entryFeePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryFeeEmoji: {
    fontSize: 13,
  },
  entryFeeText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
  },
  enterTableBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  enterTableBtnText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#123321',
    borderRadius: 16,
    borderColor: '#D4AF37',
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalLabel: {
    color: '#8DA896',
    fontSize: 13,
    fontWeight: '700',
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#091E12',
    borderRadius: 8,
    padding: 2,
  },
  toggleOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleOptionActive: {
    backgroundColor: '#1A4A2D',
  },
  toggleText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
  },
  playerCountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countBtn: {
    backgroundColor: '#091E12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  countBtnActive: {
    backgroundColor: '#D4AF37',
  },
  countBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalInput: {
    backgroundColor: '#091E12',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 10,
    color: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#193E28',
  },
  modalCancelText: {
    color: '#8DA896',
    fontWeight: '700',
    fontSize: 12,
  },
  modalConfirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
  },
  modalConfirmText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 12,
  },
});
