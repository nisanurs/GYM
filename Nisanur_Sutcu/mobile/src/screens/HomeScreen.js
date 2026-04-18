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
        const fetchData = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/v1/api/stats/body`, {
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });
                setData(response.data);
            } catch (error) {
                console.error("Veri çekilemedi:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchAIRecommendation = async () => {
        setAiLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/v1/api/ai/recommend`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            setAiTip(response.data?.recommendation || response.data?.message || "Öneri alındı!");
        } catch (error) {
            console.error("AI öneri hatası:", error);
            setAiTip("Öneri alınamadı. Daha fazla antrenman verisi gir!");
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ff0000" />
                <Text style={{ color: 'white', marginTop: 10 }}>Veriler yükleniyor...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.title}>GYM<Text style={{ color: '#ff0000' }}>BUDDY</Text></Text>
                <Text style={styles.subtitle}>YOUR DIGITAL FITNESS COMPANION</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Özet Kartı */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>GELİŞİM ÖZETİ</Text>
                    <Text style={styles.summaryText}>{data?.summary || "Henüz veri girişi yapılmamış."}</Text>
                </View>

                {/* Değişim Tablosu */}
                {data?.differences && (
                    <View style={styles.table}>
                        <Text style={styles.tableTitle}>SON ÖLÇÜM ANALİZİ</Text>
                        {Object.entries(data.differences).map(([key, value]) => (
                            <View key={key} style={styles.tableRow}>
                                <Text style={styles.tableLabel}>{key.toUpperCase()}</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={[styles.value, { color: value >= 0 ? '#ff0000' : '#00ff00' }]}>
                                        {value > 0 ? `+${value}` : value}
                                    </Text>
                                    <Text style={{ color: '#666', fontSize: 10, marginLeft: 5 }}>birim</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* AI Öneri */}
                <View style={styles.aiCard}>
                    <Text style={styles.cardTitle}>🤖 AI ANTRENMAN ÖNERİSİ</Text>
                    {aiTip ? (
                        <Text style={styles.aiText}>{aiTip}</Text>
                    ) : (
                        <Text style={styles.aiPlaceholder}>Bugün hangi kası çalıştırmalısın? Öğrenmek için butona bas!</Text>
                    )}
                    <TouchableOpacity style={styles.aiButton} onPress={fetchAIRecommendation} disabled={aiLoading}>
                        {aiLoading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>ÖNERİ AL 🧠</Text>
                        }
                    </TouchableOpacity>
                </View>

                {/* Navigasyon Butonları */}
                <View style={styles.navButtons}>
                    <TouchableOpacity
                        style={styles.navBtn}
                        onPress={() => navigation.navigate('Training', { userToken })}
                    >
                        <Text style={styles.navBtnText}>💪 ANTRENMAN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.navBtn, { backgroundColor: '#1a1a1a' }]}
                        onPress={() => navigation.navigate('BodyInput', { userToken })}
                    >
                        <Text style={styles.navBtnText}>📏 ÖLÇÜ EKLE</Text>
                    </TouchableOpacity>
                </View>
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
    summaryText: { color: '#fff', fontSize: 18, lineHeight: 26, fontWeight: '500' },
    table: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 20 },
    tableTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#333' },
    tableLabel: { color: '#aaa', fontSize: 13, fontWeight: '600' },
    valueContainer: { flexDirection: 'row', alignItems: 'baseline' },
    value: { fontSize: 18, fontWeight: 'bold' },
    aiCard: { backgroundColor: '#111', padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#ff0000' },
    aiText: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 15 },
    aiPlaceholder: { color: '#666', fontSize: 14, marginBottom: 15, fontStyle: 'italic' },
    aiButton: { backgroundColor: '#ff0000', padding: 14, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    navButtons: { flexDirection: 'row', gap: 10, marginBottom: 40 },
    navBtn: { flex: 1, backgroundColor: '#ff0000', padding: 16, borderRadius: 12, alignItems: 'center' },
    navBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});