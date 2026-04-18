import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Uyarı", "Lütfen email ve şifrenizi girin.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: email.trim(),
        password,
      });

      if (response.status === 200 && response.data.token) {
        // Var olan kullanıcı → direkt Home
        navigation.navigate('Home', { userToken: response.data.token });
      }
    } catch (error) {
      console.error("Giriş Hatası:", error.response?.data);
      Alert.alert("Hata", "Giriş başarısız. Bilgilerini kontrol et!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>GYM<Text style={{ color: '#ff0000' }}>BUDDY</Text></Text>
      <Text style={styles.tagline}>Dijital Spor Arkadaşın</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          value={email}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor="#666"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />
      </View>

      <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>GİRİŞ YAP</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>Hesabın yok mu? <Text style={{ color: '#ff0000' }}>Kayıt Ol</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', padding: 30 },
  logo: { fontSize: 40, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  tagline: { color: '#555', textAlign: 'center', marginBottom: 50, fontSize: 13 },
  inputContainer: { marginBottom: 20 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderBottomWidth: 2, borderBottomColor: '#333' },
  button: { backgroundColor: '#ff0000', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#aaa', textAlign: 'center', fontSize: 14 },
});