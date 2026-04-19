import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert("Uyarı", "Lütfen tüm alanları doldur.");
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/auth/register`, {
                name: name.trim(),
                email: email.trim(),
                password,
            });

            if (response.status === 201 || response.status === 200) {
                // Kayıt sonrası otomatik giriş yap, token al
                const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                    email: email.trim(),
                    password,
                });

                if (loginRes.data.token) {
                    // YENİ kullanıcı → BodyInput (hedef belirleme)
                    navigation.navigate('BodyInput', { userToken: loginRes.data.token });
                } else {
                    Alert.alert("Başarılı!", "Kayıt oluşturuldu. Giriş yapabilirsin.");
                    navigation.navigate('Login');
                }
            }
        } catch (error) {
            console.error("Kayıt Hatası:", error.response?.data);
            Alert.alert("Hata", "Kayıt olunamadı. Bu email zaten kullanılıyor olabilir.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.logo}>YENİ <Text style={{ color: '#ff0000' }}>HESAP</Text></Text>
            <Text style={styles.tagline}>Aramıza katıl 🫂</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Ad Soyad"
                    placeholderTextColor="#666"
                    onChangeText={setName}
                    value={name}
                />
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

            <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>KAYIT OL 🧾</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }}>
                <Text style={styles.linkText}>Zaten hesabın var mı? <Text style={{ color: '#ff0000' }}>Giriş Yap</Text></Text>
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