import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const stats = [
    { label: 'Parties Jouées', value: '18', icon: 'gamepad-variant-outline' },
    { label: 'Victoires', value: '12', icon: 'trophy-outline' },
    { label: 'Taux de Victoire', value: '66.7%', icon: 'chart-line' },
    { label: 'Total Chkobba 🔥', value: '34', icon: 'cards-playing-outline' },
    { label: '7 الحيّة Capturés', value: '14', icon: 'star-outline' },
    { label: 'Points Totaux', value: '246', icon: 'counter' },
  ];

  const matchHistory = [
    { id: 'm-1', type: 'Chkobba 2v2', result: 'Victoire', score: '21 - 18', date: 'Aujourd’hui', gain: '+200 🪙' },
    { id: 'm-2', type: 'Chkobba 1v1', result: 'Victoire', score: '22 - 14', date: 'Hier', gain: '+500 🪙' },
    { id: 'm-3', type: 'Rami 4j', result: 'Défaite', score: '38 - 51', date: 'Il y a 2j', gain: '-100 🪙' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={42} color="#D4AF37" />
            <View style={styles.levelTag}>
              <Text style={styles.levelTagText}>1</Text>
            </View>
          </View>

          <Text style={styles.username}>monitoralk</Text>
          <Text style={styles.playerTitle}>Joueur Passionné · Chkobba & Rami</Text>

          <View style={styles.xpBox}>
            <View style={styles.xpTextRow}>
              <Text style={styles.xpLabel}>Niveau 1</Text>
              <Text style={styles.xpValue}>300 / 2000 XP</Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: '15%' }]} />
            </View>
          </View>
        </View>

        {/* Statistics Grid */}
        <Text style={styles.sectionTitle}>📊 Statistiques de Jeu</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Match History */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          📜 Historique des Parties
        </Text>
        <View style={styles.historyList}>
          {matchHistory.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyType}>{item.type}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>

              <View style={styles.historyCenter}>
                <Text
                  style={[
                    styles.historyResult,
                    item.result === 'Victoire'
                      ? styles.victoryText
                      : styles.defeatText,
                  ]}
                >
                  {item.result}
                </Text>
                <Text style={styles.historyScore}>{item.score}</Text>
              </View>

              <Text
                style={[
                  styles.historyGain,
                  item.gain.startsWith('+') ? styles.gainPositive : styles.gainNegative,
                ]}
              >
                {item.gain}
              </Text>
            </View>
          ))}
        </View>

        {/* Settings Links */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          ⚙️ Paramètres
        </Text>
        <View style={styles.settingsList}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="globe" size={18} color="#D4AF37" />
              <Text style={styles.settingText}>Langue (العربية / Français)</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#8DA896" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="volume-2" size={18} color="#D4AF37" />
              <Text style={styles.settingText}>Effets Sonores & Musique</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#8DA896" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="shield" size={18} color="#D4AF37" />
              <Text style={styles.settingText}>Règles Officielles Chkobba</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#8DA896" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  profileCard: {
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
    gap: 6,
  },
  avatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#173E28',
    borderColor: '#D4AF37',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  levelTag: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#D4AF37',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#123321',
  },
  levelTagText: {
    color: '#1A1405',
    fontSize: 12,
    fontWeight: '800',
  },
  username: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  playerTitle: {
    color: '#8DA896',
    fontSize: 12,
    marginBottom: 6,
  },
  xpBox: {
    width: '100%',
    gap: 4,
  },
  xpTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpLabel: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
  },
  xpValue: {
    color: '#8DA896',
    fontSize: 11,
  },
  xpTrack: {
    height: 6,
    backgroundColor: '#091E12',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 3,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    width: '31.5%',
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    color: '#FDE68A',
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8DA896',
    fontSize: 10,
    textAlign: 'center',
  },
  historyList: {
    gap: 8,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  historyLeft: {
    gap: 2,
  },
  historyType: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyDate: {
    color: '#688773',
    fontSize: 11,
  },
  historyCenter: {
    alignItems: 'center',
    gap: 2,
  },
  historyResult: {
    fontSize: 12,
    fontWeight: '800',
  },
  victoryText: {
    color: '#22C55E',
  },
  defeatText: {
    color: '#EF4444',
  },
  historyScore: {
    color: '#8DA896',
    fontSize: 11,
  },
  historyGain: {
    fontSize: 12,
    fontWeight: '800',
  },
  gainPositive: {
    color: '#FDE68A',
  },
  gainNegative: {
    color: '#EF4444',
  },
  settingsList: {
    backgroundColor: '#123321',
    borderColor: '#1D4A30',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#174026',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
});
