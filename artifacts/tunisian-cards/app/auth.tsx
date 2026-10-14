import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthScreen() {
  const { loginWithUsername, registerWithUsername, loginAsGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (mode === 'register' && (username.trim().length < 3 || password.length < 6)) {
      setError('Le nom doit contenir 3 caractères et le mot de passe 6 caractères minimum.');
      return;
    }
    if (!username.trim() || !password) { setError('Saisissez votre nom et votre mot de passe.'); return; }
    setBusy(true);
    try {
      const success = mode === 'register'
        ? await registerWithUsername(username, password)
        : await loginWithUsername(username, password);
      if (!success) setError(mode === 'register' ? 'Ce nom est déjà utilisé ou le compte n’a pas pu être enregistré.' : 'Nom ou mot de passe incorrect.');
    } finally { setBusy(false); }
  };

  const guestPlay = async () => { setBusy(true); try { await loginAsGuest('Joueur Tunisien'); } finally { setBusy(false); } };

  return (
    <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0), paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#081B12" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}><Text style={styles.cards}>🂡 🂱 🃑 🃁</Text><Text style={styles.title}>Chkobba & Rami</Text><Text style={styles.subtitle}>Jeux de cartes tunisiens</Text></View>
          <View style={styles.card}>
            <Text style={styles.heading}>{mode === 'login' ? 'Bienvenue !' : 'Créer un compte'}</Text>
            <Text style={styles.caption}>Connectez-vous pour retrouver votre profil et votre progression.</Text>
            <TextInput accessibilityLabel="Nom d’utilisateur" style={styles.input} placeholder="Nom d’utilisateur" placeholderTextColor="#8DA896" value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={24} returnKeyType="next" />
            <TextInput accessibilityLabel="Mot de passe" style={styles.input} placeholder="Mot de passe" placeholderTextColor="#8DA896" value={password} onChangeText={setPassword} secureTextEntry returnKeyType="done" onSubmitEditing={submit} />
            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.primary} onPress={submit}>{busy ? <ActivityIndicator color="#1A1405" /> : <Text style={styles.primaryText}>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</Text>}</TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}><Text style={styles.switch}>{mode === 'login' ? 'Nouveau ici ? Créer un compte' : 'Déjà inscrit ? Se connecter'}</Text></TouchableOpacity>
            <View style={styles.separator}><View style={styles.line}/><Text style={styles.or}>OU</Text><View style={styles.line}/></View>
            <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.guest} onPress={guestPlay}><Text style={styles.guestText}>Jouer rapidement en invité</Text></TouchableOpacity>
            <Text style={styles.note}>Compte local pour cette installation. Pour les comptes en ligne sécurisés, un serveur d’authentification est nécessaire.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: '#081B12' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 36 },
  brand: { alignItems: 'center', marginBottom: 28 }, cards: { fontSize: 34, marginBottom: 10 },
  title: { color: '#FDE68A', fontWeight: '900', fontSize: 28 }, subtitle: { color: '#A9C2B3', marginTop: 6 },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: '#0F2C1C', borderColor: '#1D4A30', borderWidth: 1, borderRadius: 18, padding: 22 },
  heading: { color: '#FFF', fontSize: 22, fontWeight: '800' }, caption: { color: '#A9C2B3', fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 20 },
  input: { backgroundColor: '#091E12', borderColor: '#28563A', borderWidth: 1, borderRadius: 10, color: '#FFF', paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12 },
  error: { color: '#FCA5A5', fontSize: 13, marginBottom: 12 }, primary: { backgroundColor: '#D4AF37', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 3 }, primaryText: { color: '#1A1405', fontWeight: '800', fontSize: 15 },
  switch: { color: '#FDE68A', textAlign: 'center', fontWeight: '700', marginTop: 16 }, separator: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 }, line: { flex: 1, height: 1, backgroundColor: '#28563A' }, or: { color: '#8DA896', fontSize: 11, fontWeight: '700' },
  guest: { borderColor: '#52735E', borderWidth: 1, borderRadius: 10, padding: 13, alignItems: 'center' }, guestText: { color: '#FFF', fontWeight: '700' }, note: { color: '#718B7B', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 18 },
});