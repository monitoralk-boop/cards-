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
import colors from '@/constants/colors';

interface Friend {
  id: string;
  username: string;
  avatarColor: string;
  level: number;
  isOnline: boolean;
  statusText: string;
}

interface FriendRequest {
  id: string;
  fromUsername: string;
  level: number;
  avatarColor: string;
  sentAt: string;
}

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [invitedId, setInvitedId] = useState<string | null>(null);

  // Initial friends matching Tunisian players
  const [friendsList, setFriendsList] = useState<Friend[]>([
    {
      id: 'f-1',
      username: 'CH AMINE',
      avatarColor: '#E65100',
      level: 14,
      isOnline: true,
      statusText: 'À la table Chkobba #102',
    },
    {
      id: 'f-2',
      username: 'ANIS',
      avatarColor: '#1976D2',
      level: 8,
      isOnline: true,
      statusText: 'Dans le salon principal',
    },
    {
      id: 'f-3',
      username: 'OUSSAMA',
      avatarColor: '#388E3C',
      level: 22,
      isOnline: false,
      statusText: 'Hors ligne · Il y a 2h',
    },
    {
      id: 'f-4',
      username: 'MAHDI V.',
      avatarColor: '#8E24AA',
      level: 19,
      isOnline: false,
      statusText: 'Hors ligne · Hier',
    },
    {
      id: 'f-5',
      username: 'Sami_Sousse',
      avatarColor: '#0288D1',
      level: 32,
      isOnline: true,
      statusText: 'En ligne · Prêt à jouer',
    },
  ]);

  const [requestsList, setRequestsList] = useState<FriendRequest[]>([
    {
      id: 'req-1',
      fromUsername: 'Yassine_Tunis',
      level: 5,
      avatarColor: '#00897B',
      sentAt: 'Il y a 10 min',
    },
    {
      id: 'req-2',
      fromUsername: 'Khaled_Bizerte',
      level: 12,
      avatarColor: '#D84315',
      sentAt: 'Hier',
    },
  ]);

  const filteredFriends = friendsList.filter((f) =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleInviteFriend = (friend: Friend) => {
    setInvitedId(friend.id);
    setTimeout(() => setInvitedId(null), 3000);
    Alert.alert(
      'Invitation envoyée',
      `Une invitation à rejoindre votre table a été envoyée à ${friend.username} !`,
    );
  };

  const handleAcceptRequest = (req: FriendRequest) => {
    const newFriend: Friend = {
      id: `f-${Date.now()}`,
      username: req.fromUsername,
      avatarColor: req.avatarColor,
      level: req.level,
      isOnline: true,
      statusText: 'En ligne',
    };
    setFriendsList([newFriend, ...friendsList]);
    setRequestsList(requestsList.filter((r) => r.id !== req.id));
    Alert.alert('Ami ajouté', `${req.fromUsername} fait maintenant partie de vos amis !`);
  };

  const handleRejectRequest = (id: string) => {
    setRequestsList(requestsList.filter((r) => r.id !== id));
  };

  const handleSendFriendRequest = () => {
    if (!newFriendUsername.trim()) return;
    setShowAddModal(false);
    Alert.alert(
      'Demande transmise',
      `Demande d'ami envoyée à ${newFriendUsername.trim()} avec succès !`,
    );
    setNewFriendUsername('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Amis & Rivaux</Text>
            <Text style={styles.subtitle}>
              {friendsList.filter((f) => f.isOnline).length} en ligne sur {friendsList.length} amis
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={styles.addFriendBtn}
          >
            <Feather name="user-plus" size={16} color="#1A1405" />
            <Text style={styles.addFriendBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switch */}
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('friends')}
            style={[
              styles.tabBtn,
              activeTab === 'friends' && styles.tabBtnActive,
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'friends' && styles.tabBtnTextActive,
              ]}
            >
              Mes Amis ({friendsList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('requests')}
            style={[
              styles.tabBtn,
              activeTab === 'requests' && styles.tabBtnActive,
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'requests' && styles.tabBtnTextActive,
              ]}
            >
              Demandes ({requestsList.length})
            </Text>
            {requestsList.length > 0 && (
              <View style={styles.reqBadge}>
                <Text style={styles.reqBadgeText}>{requestsList.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        {activeTab === 'friends' && (
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color="#8DA896" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un ami..."
              placeholderTextColor="#688773"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color="#8DA896" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Content list */}
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'friends' ? (
            filteredFriends.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="users" size={40} color="#456651" />
                <Text style={styles.emptyTitle}>Aucun ami trouvé</Text>
                <Text style={styles.emptyDesc}>
                  Recherchez un joueur ou ajoutez vos amis par pseudo.
                </Text>
              </View>
            ) : (
              filteredFriends.map((friend) => (
                <View key={friend.id} style={styles.friendCard}>
                  {/* Left: Avatar with online dot */}
                  <View style={styles.avatarWrapper}>
                    <View
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: friend.avatarColor },
                      ]}
                    >
                      <Text style={styles.avatarInitial}>
                        {friend.username.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.onlineDot,
                        {
                          backgroundColor: friend.isOnline
                            ? '#22C55E'
                            : '#64748B',
                        },
                      ]}
                    />
                  </View>

                  {/* Center: Info */}
                  <View style={styles.friendInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.friendName}>{friend.username}</Text>
                      <View style={styles.levelTag}>
                        <Text style={styles.levelTagText}>Niv. {friend.level}</Text>
                      </View>
                    </View>
                    <Text style={styles.statusText}>{friend.statusText}</Text>
                  </View>

                  {/* Right: Invite Button */}
                  <TouchableOpacity
                    disabled={!friend.isOnline || invitedId === friend.id}
                    onPress={() => handleInviteFriend(friend)}
                    style={[
                      styles.inviteBtn,
                      !friend.isOnline && styles.inviteBtnDisabled,
                      invitedId === friend.id && styles.inviteBtnSent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.inviteBtnText,
                        !friend.isOnline && styles.inviteBtnTextDisabled,
                      ]}
                    >
                      {invitedId === friend.id
                        ? 'Envoyé ✓'
                        : friend.isOnline
                        ? '⚡ Inviter'
                        : 'Hors ligne'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )
          ) : requestsList.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color="#456651" />
              <Text style={styles.emptyTitle}>Aucune demande en attente</Text>
              <Text style={styles.emptyDesc}>
                Vous n'avez pas de demandes d'amis pour le moment.
              </Text>
            </View>
          ) : (
            requestsList.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.avatarWrapper}>
                  <View
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: req.avatarColor },
                    ]}
                  >
                    <Text style={styles.avatarInitial}>
                      {req.fromUsername.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{req.fromUsername}</Text>
                  <Text style={styles.statusText}>
                    Niv. {req.level} · {req.sentAt}
                  </Text>
                </View>

                <View style={styles.reqActionRow}>
                  <TouchableOpacity
                    onPress={() => handleAcceptRequest(req)}
                    style={styles.acceptBtn}
                  >
                    <Feather name="check" size={16} color="#1A1405" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRejectRequest(req.id)}
                    style={styles.rejectBtn}
                  >
                    <Feather name="x" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Friend Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Ajouter un ami</Text>
              <Text style={styles.modalDesc}>
                Entrez le pseudonyme ou l'identifiant du joueur tunisien :
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Sami_Sousse"
                placeholderTextColor="#688773"
                value={newFriendUsername}
                onChangeText={setNewFriendUsername}
                autoCapitalize="none"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendFriendRequest}
                  style={styles.modalConfirmBtn}
                >
                  <Text style={styles.modalConfirmText}>Envoyer la demande</Text>
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
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  addFriendBtnText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 12,
  },
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#123321',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    borderColor: '#1D4A30',
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#1A4A2D',
  },
  tabBtnText: {
    color: '#8DA896',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FDE68A',
  },
  reqBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  reqBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    padding: 0,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 90,
    gap: 10,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123321',
    borderRadius: 12,
    borderColor: '#1D4A30',
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#123321',
  },
  friendInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  levelTag: {
    backgroundColor: '#174026',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  levelTagText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
  },
  statusText: {
    color: '#8DA896',
    fontSize: 11,
  },
  inviteBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  inviteBtnDisabled: {
    backgroundColor: '#173623',
  },
  inviteBtnSent: {
    backgroundColor: '#22C55E',
  },
  inviteBtnText: {
    color: '#1A1405',
    fontWeight: '800',
    fontSize: 11,
  },
  inviteBtnTextDisabled: {
    color: '#5A7D67',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123321',
    borderRadius: 12,
    borderColor: '#1D4A30',
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  reqActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2A171C',
    borderColor: '#7F1D1D',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#8DA896',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
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
    gap: 12,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalDesc: {
    color: '#8DA896',
    fontSize: 12,
  },
  modalInput: {
    backgroundColor: '#091E12',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 10,
    color: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
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
