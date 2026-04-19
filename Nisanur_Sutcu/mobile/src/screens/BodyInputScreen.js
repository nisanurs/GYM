
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';// HTTP istekleri için axios kütüphanesini kullanıyoruz


const BASE_URL = 'https://gym-hku6.onrender.com'; // Backend API URL'si

const GOALS = [
    { key: 'fat_loss', label: '🔥 Yağ Yakma' },
    { key: 'muscle_gain', label: '💪 Kas Kazanma' },
    { key: 'maintenance', label: '⚖️ Formu Koruma' },
];

export default function BodyInputScreen({ navigation, route }) {
    // route.params ile önceki ekrandan gelen parametreleri alıyoruz
    const { userToken } = route.params || {};// Kullanıcı token'ını alıyoruz
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [selectedGoal, setSelectedGoal] = useState('');

    const handleNext = async () => {// Kullanıcı bilgilerini kaydetmeden önce doğrulama yapıyoruz
        if (!weight || !height || !selectedGoal) {
            Alert.alert("Uyarı", "Lütfen kilo, boy ve hedefini seç!");
            return;
        }

        try {// 1. Kullanıcının ölçümlerini backend'e kaydet
            await axios.post(`${BASE_URL}/v1/api/measures`, {
                weight: parseFloat(weight),
                height: parseFloat(height),
                fat_rate: 0,
                target_weight: parseFloat(targetWeight) || 0,
                date: new Date().toISOString().split('T')[0],// Bugünün tarihini YYYY-MM-DD formatında gönderiyoruz
            }, {
                headers: { 'Authorization': `Bearer ${userToken}` }// Authorization header'ına Bearer token'ı ekliyoruz
            });


            if (targetWeight) {
                await axios.put(`${BASE_URL}/v1/api/user/target`, {
                    target_weight: parseFloat(targetWeight)
                }, {
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });
            }

            navigation.navigate('Home', { userToken });

        } catch (error) {
            console.error("Kayıt Hatası:", error.response?.data);
            Alert.alert("Hata", "Bilgiler kaydedilemedi.", [
                { text: "Tekrar Dene" },
                { text: "Devam Et", onPress: () => navigation.navigate('Home', { userToken }) }
            ]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.header}>HEDEF <Text style={{ color: '#ff0000' }}>BELİRLE</Text></Text>
                <Text style={styles.subText}>Sana özel plan oluşturabilmemiz için başlangıç bilgilerini gir.</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Mevcut Kilonuz (kg)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Örn: 70"
                        placeholderTextColor="#555"
                        value={weight}
                        onChangeText={setWeight}
                    />

                    <Text style={styles.label}>Boyunuz (cm)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Örn: 170"
                        placeholderTextColor="#555"
                        value={height}
                        onChangeText={setHeight}
                    />

                    <Text style={styles.label}>Hedef Kilonuz (kg) — Opsiyonel</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Örn: 65"
                        placeholderTextColor="#555"
                        value={targetWeight}
                        onChangeText={setTargetWeight}
                    />

                    <Text style={styles.label}>Hedefin Nedir?</Text>
                    <View style={styles.goalRow}>
                        {GOALS.map((g) => (
                            <TouchableOpacity
                                key={g.key}
                                style={[styles.goalBtn, selectedGoal === g.key && styles.goalBtnActive]}
                                onPress={() => setSelectedGoal(g.key)}
                            >
                                <Text style={[styles.goalText, selectedGoal === g.key && styles.goalTextActive]}>
                                    {g.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleNext}>
                        <Text style={styles.buttonText}>HADİ BAŞLAYALIM!</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    header: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 20 },
    subText: { color: '#aaa', textAlign: 'center', marginBottom: 30, marginTop: 10, lineHeight: 20 },
    form: { backgroundColor: '#111', padding: 20, borderRadius: 15 },
    label: { color: '#ff0000', fontWeight: 'bold', marginBottom: 8, fontSize: 13 },
    input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16 },
    goalRow: { flexDirection: 'column', gap: 10, marginBottom: 25 },
    goalBtn: { backgroundColor: '#1a1a1a', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
    goalBtnActive: { backgroundColor: '#ff0000', borderColor: '#ff0000' },
    goalText: { color: '#aaa', fontWeight: 'bold', textAlign: 'center' },
    goalTextActive: { color: '#fff' },
    button: { backgroundColor: '#ff0000', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 5 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});