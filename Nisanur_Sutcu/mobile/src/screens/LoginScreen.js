import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // Boş alan kontrolü
    if (!email || !password) {
      Alert.alert("Uyarı", "Lütfen email ve şifrenizi girin.");
      return;
    }

    try {
      // Backend'e giriş isteği gönderiyoruz
      const response = await axios.post('https://gym-hku6.onrender.com/auth/login', {
        email: email.trim(),
        password: password
      });

      // Giriş başarılı ve bilet (token) geldiyse
      if (response.status === 200 && response.data.token) {
        console.log("Giriş Başarılı, Token Alındı!");

        // Token'ı cebimize koyup BodyInput sayfasına gidiyoruz
        // Not: Eğer senin rotan 'Home' ise 'BodyInput' yazan yeri 'Home' yapabilirsin
        navigation.navigate('BodyInput', { userToken: response.data.token });
      }
    } catch (error) {
      console.error("Giriş Hatası:", error.response?.data);
      Alert.alert("Hata", "Giriş başarısız. Bilgilerini kontrol et!");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>GYM<Text style={{ color: '#ff0000' }}>BUDDY</Text></Text>

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

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin} // Fonksiyonu burada tetikliyoruz
      >
        <Text style={styles.buttonText}>GİRİŞ YAP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', padding: 30 },
  logo: { fontSize: 40, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 50 },
  inputContainer: { marginBottom: 20 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderBottomWidth: 2, borderBottomColor: '#333' },
  button: { backgroundColor: '#ff0000', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});