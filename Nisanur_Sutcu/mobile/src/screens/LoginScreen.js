import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ImageBackground } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>GYM<Text style={{color: '#ff0000'}}>BUDDY</Text></Text>
      
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          onChangeText={setEmail}
        />
        <TextInput 
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor="#666"
          secureTextEntry
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Home')} // Şimdilik direkt ana sayfaya atsın
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