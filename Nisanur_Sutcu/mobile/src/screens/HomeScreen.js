import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

export default function HomeScreen({ navigation, route }) {
    const { userToken } = route.params || {};
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiTip, setAiTip] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/v1/api/stats/body`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            setData(response.data);
        } catch (error) {
            console.error("İstatistik hatası:", error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const fetchAIRecommendation = async () => {
        setAiLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/v1/api/ai/recommend`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            setAiTip(
                response.data?.recommendation ||
                response.data?.ai_advice ||
                response.data?.message ||
                "Öneri alındı!"
            );
        } catch {
            setAiTip("Öneri alınamadı. Daha fazla antrenman verisi gir!");
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ff0000" />
                <Text style={{ color: 'white', marginTop: 10 }}>Yükleniyor...</Text>
            </View>
        );
    }

    const NAV_BUTTONS = [
        { label: 'ANTRENMAN', icon: '💪', screen: 'Training', bg: '#ff0000' },
        { label: 'ÖLÇÜ EKLE', icon: '📏', screen: 'Measure', bg: '#1a1a1a' },
        { label: 'GEÇMİŞ', icon: '📊', screen: 'History', bg: '#1a1a1a' },
        { label: 'HEDEFLER', icon: '🎯', screen: 'Goals', bg: '#1a1a1a' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.title}>GYM<Text style={{ color: '#ff0000' }}>BUDDY</Text></Text>
                <Text style={styles.subtitle}>YOUR DIGITAL FITNESS COMPANION</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>GELİŞİM ÖZETİ</Text>
                    <Text style={styles.summaryText}>{data?.summary || "Henüz yeterli veri yok."}</Text>
                </View>

                {data?.differences && (
                    <View style={styles.table}>
                        <Text style={styles.tableTitle}>SON ÖLÇÜM ANALİZİ</Text>
                        {Object.entries(data.differences).map(([key, value]) => {
                            if (value === 0) return null;
                            const labels = {
                                weight: 'Kilo', height: 'Boy', arm: 'Kol',
                                waist: 'Bel', neck: 'Boyun', leg: 'Bacak',
                                hip: 'Kalça', shoulder: 'Omuz', fat_rate: 'Yağ Oranı'
                            };
                            return (
                                <View key={key} style={styles.tableRow}>
                                    <Text style={styles.tableLabel}>{labels[key] || key}</Text>
                                    <View style={styles.valueContainer}>
                                        <Text style={[styles.value, { color: value >= 0 ? '#ff4444' : '#00cc66' }]}>
                                            {value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
                                        </Text>
                                        <Text style={styles.unit}>birim</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={styles.aiCard}>
                    <Text style={styles.cardTitle}>🤖 AI ANTRENMAN ÖNERİSİ</Text>
                    {aiTip
                        ? <Text style={styles.aiText}>{aiTip}</Text>
                        : <Text style={styles.aiPlaceholder}>Bugün hangi kası çalıştırmalısın?</Text>
                    }
                    <TouchableOpacity style={styles.aiButton} onPress={fetchAIRecommendation} disabled={aiLoading}>
                        {aiLoading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>ÖNERİ AL 🧠</Text>
                        }
                    </TouchableOpacity>
                </View>

                {/* 2×2 Navigasyon Grid */}
                <View style={styles.navGrid}>
                    {NAV_BUTTONS.map((btn) => (
                        <TouchableOpacity
                            key={btn.screen}
                            style={[styles.navBtn, { backgroundColor: btn.bg }]}
                            onPress={() => navigation.navigate(btn.screen, { userToken })}
                        >
                            <Text style={styles.navIcon}>{btn.icon}</Text>
                            <Text style={styles.navBtnText}>{btn.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    header: { alignItems: 'center', padding: 20, paddingTop: 10 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
    subtitle: { fontSize: 10, color: '#ccc', marginTop: 5 },
    content: { padding: 20 },
    card: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#ff0000' },
    cardTitle: { color: '#ff0000', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
    summaryText: { color: '#fff', fontSize: 16, lineHeight: 24 },
    table: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 20 },
    tableTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#333' },
    tableLabel: { color: '#aaa', fontSize: 13 },
    valueContainer: { flexDirection: 'row', alignItems: 'baseline' },
    value: { fontSize: 18, fontWeight: 'bold' },
    unit: { color: '#666', fontSize: 10, marginLeft: 4 },
    aiCard: { backgroundColor: '#111', padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#ff0000' },
    aiText: { color: '#fff', fontSize: 14, lineHeight: 22, marginBottom: 15 },
    aiPlaceholder: { color: '#666', fontSize: 13, marginBottom: 15, fontStyle: 'italic' },
    aiButton: { backgroundColor: '#ff0000', padding: 14, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    navBtn: { width: '47%', padding: 18, borderRadius: 14, alignItems: 'center', gap: 6 },
    navIcon: { fontSize: 24 },
    navBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
});