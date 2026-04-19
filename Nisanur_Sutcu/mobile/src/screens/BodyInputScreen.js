import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

const GOALS = [
    { key: 'fat_loss', label: '🔥 Yağ Yakma', desc: 'Vücut yağını azalt' },
    { key: 'muscle_gain', label: '💪 Kas Kazanma', desc: 'Kas kütlesi kazan' },
    { key: 'maintenance', label: '⚖️ Formu Koruma', desc: 'Mevcut formu koru' },
];

export default function BodyInputScreen({ navigation, route }) {
    const { userToken } = route.params || {};
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [selectedGoal, setSelectedGoal] = useState('');

    const handleNext = async () => {
        if (!weight || !height || !selectedGoal) {
            Alert.alert("Uyarı", "Kilo, boy ve hedefini seçmeyi unutma!");
            return;
        }

        try {
            // 1. İlk ölçümü kaydet
            await axios.post(`${BASE_URL}/v1/api/measures`, {
                weight: parseFloat(weight),
                height: parseFloat(height),
                fat_rate: 0,
                target_weight: parseFloat(targetWeight) || 0,
                date: new Date().toISOString().split('T')[0],
            }, { headers: { 'Authorization': `Bearer ${userToken}` } });

            // 2. Hedef kilo ve goal'ü kullanıcıya kaydet
            await axios.put(`${BASE_URL}/v1/api/user/target`, {
                target_weight: parseFloat(targetWeight) || 0,
                goal: selectedGoal,
            }, { headers: { 'Authorization': `Bearer ${userToken}` } });

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
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="Örn: 70" placeholderTextColor="#555" value={weight} onChangeText={setWeight} />

                    <Text style={styles.label}>Boyunuz (cm)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="Örn: 170" placeholderTextColor="#555" value={height} onChangeText={setHeight} />

                    <Text style={styles.label}>Hedef Kilonuz (kg)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="Örn: 65 (opsiyonel)" placeholderTextColor="#555" value={targetWeight} onChangeText={setTargetWeight} />

                    <Text style={styles.label}>Hedefin Nedir?</Text>
                    <View style={styles.goalList}>
                        {GOALS.map((g) => (
                            <TouchableOpacity
                                key={g.key}
                                style={[styles.goalCard, selectedGoal === g.key && styles.goalCardActive]}
                                onPress={() => setSelectedGoal(g.key)}
                            >
                                <Text style={[styles.goalLabel, selectedGoal === g.key && { color: '#fff' }]}>{g.label}</Text>
                                <Text style={[styles.goalDesc, selectedGoal === g.key && { color: '#ffaaaa' }]}>{g.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleNext}>
                        <Text style={styles.buttonText}>BAŞLA 🚀</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    header: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 20 },
    subText: { color: '#aaa', textAlign: 'center', marginBottom: 25, marginTop: 8, lineHeight: 20 },
    form: { backgroundColor: '#111', padding: 20, borderRadius: 15 },
    label: { color: '#ff0000', fontWeight: 'bold', marginBottom: 8, fontSize: 13 },
    input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 10, marginBottom: 18, fontSize: 16 },
    goalList: { gap: 10, marginBottom: 24 },
    goalCard: { backgroundColor: '#1a1a1a', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
    goalCardActive: { backgroundColor: '#ff0000', borderColor: '#ff0000' },
    goalLabel: { color: '#aaa', fontWeight: 'bold', fontSize: 15 },
    goalDesc: { color: '#555', fontSize: 12, marginTop: 3 },
    button: { backgroundColor: '#ff0000', padding: 18, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});