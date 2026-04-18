import React, { useEffect, useState } from 'react';
import {
    StyleSheet, Text, View, ScrollView, ActivityIndicator,
    StatusBar, TouchableOpacity, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

const NAV_ITEMS = [
    { label: 'Antrenman Kaydı', icon: '💪', screen: 'Training' },
    { label: 'Ölçü Ekle', icon: '📏', screen: 'Measure' },
    { label: 'Ölçüm Geçmişi', icon: '📋', screen: 'History' },
    { label: 'Gelişim Grafikleri', icon: '📈', screen: 'Stats' },
    { label: 'Hedeflerimi Güncelle', icon: '🎯', screen: 'Goals' },
];

export default function HomeScreen({ navigation, route }) {
    const { userToken } = route.params || {};
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiTip, setAiTip] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const r = await axios.get(`${BASE_URL}/v1/api/stats/body`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            setData(r.data);
        } catch (e) {
            console.error(e.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const fetchAI = async () => {
        setAiLoading(true);
        try {
            const r = await axios.get(`${BASE_URL}/v1/api/ai/recommend`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            setAiTip(r.data?.recommendation || r.data?.ai_advice || r.data?.message || "Öneri alındı!");
        } catch {
            setAiTip("Öneri alınamadı. Daha fazla antrenman verisi gir!");
        } finally {
            setAiLoading(false);
        }
    };

    const navigate = (screen) => {
        setMenuOpen(false);
        navigation.navigate(screen, { userToken });
    };


    const generateCustomSummary = () => {
        if (!data?.differences) return "Henüz yeterli veri yok. İlk ölçümlerini ekle ve değişimi izle";

        let changes = [];
        let count = 0;

        const formatDiff = (key, val) => {
            const num = Math.abs(val).toFixed(1);
            switch (key) {
                case 'weight': return val > 0 ? `${num} kg aldın` : `${num} kg verdin`;
                case 'waist': return val > 0 ? `belin ${num} cm kalınlaştı` : `belin ${num} cm inceldi`;
                case 'arm': return val > 0 ? `kolun ${num} cm büyüdü` : `kolun ${num} cm inceldi`;
                case 'hip': return val > 0 ? `kalçan ${num} cm büyüdü` : `kalçan ${num} cm küçüldü`;
                case 'leg': return val > 0 ? `bacağın ${num} cm kalınlaştı` : `bacağın ${num} cm inceldi`;
                case 'shoulder': return val > 0 ? `omzun ${num} cm genişledi` : `omzun ${num} cm daraldı`;
                case 'neck': return val > 0 ? `boynun ${num} cm kalınlaştı` : `boynun ${num} cm inceldi`;
                case 'fat_rate': return val > 0 ? `yağ oranın %${num} arttı` : `yağ oranın %${num} düştü`;
                default: return null;
            }
        };

        for (const [key, val] of Object.entries(data.differences)) {
            if (val !== 0) {
                const text = formatDiff(key, val);
                if (text) {
                    changes.push(text);
                    count++;
                }
            }
        }

        if (count === 0) return "Ölçümlerinde henüz bir değişiklik yok. Pes etmek yok, antrenmanlara tam gaz devam! 💪";

        // Değişimleri aralarına virgül koyarak güzel bir cümleye çeviriyoruz
        return `Toplam ${count} bölgede değişim var:\n${changes.join(', ')}. Harika gidiyorsun! 🔥`;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ff0000" />
                <Text style={{ color: 'white', marginTop: 10 }}>Verilerin Hazırlanıyor...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={[styles.topBar, { zIndex: menuOpen ? 20 : 1 }]}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>GYM<Text style={{ color: '#ff0000' }}>BUDDY</Text></Text>
                    <Text style={styles.subtitle}>YOUR DIGITAL FITNESS COMPANION</Text>
                </View>
                <TouchableOpacity style={styles.burgerBtn} onPress={() => setMenuOpen(!menuOpen)}>
                    <View style={[styles.burgerLine, menuOpen && styles.burgerLineTop]} />
                    <View style={[styles.burgerLine, menuOpen && styles.burgerLineHide]} />
                    <View style={[styles.burgerLine, menuOpen && styles.burgerLineBot]} />
                </TouchableOpacity>
            </View>

            {/* Dropdown Menü & Arka Plan Karartma (Focus Efekti) */}
            {menuOpen && (
                <>
                    <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)} />
                    <View style={styles.dropdown}>
                        {NAV_ITEMS.map((item, index) => (
                            <TouchableOpacity
                                key={item.screen}
                                style={[
                                    styles.dropdownItem,
                                    index !== NAV_ITEMS.length - 1 && styles.dropdownDivider // Son elemana çizgi çekme
                                ]}
                                onPress={() => navigate(item.screen)}
                            >
                                <Text style={styles.dropdownIcon}>{item.icon}</Text>
                                <Text style={styles.dropdownLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Dinamik Gelişim Özeti */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>GELİŞİM ÖZETİ</Text>
                    <Text style={styles.summaryText}>{generateCustomSummary()}</Text>
                </View>

                {/* Detaylı Tablo */}
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
                                        <Text style={styles.unit}> birim</Text>
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
                    <TouchableOpacity style={styles.aiButton} onPress={fetchAI} disabled={aiLoading}>
                        {aiLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>ÖNERİ AL 🧠</Text>}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
    subtitle: { fontSize: 9, color: '#555', marginTop: 2 },
    burgerBtn: { padding: 10, gap: 5, justifyContent: 'center' },
    burgerLine: { width: 24, height: 2.5, backgroundColor: '#fff', borderRadius: 2 },
    burgerLineHide: { opacity: 0 },
    burgerLineTop: { transform: [{ rotate: '45deg' }, { translateY: 7 }] },
    burgerLineBot: { transform: [{ rotate: '-45deg' }, { translateY: -7 }] },
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)', // Sayfayı karartan focus efekti
        zIndex: 10
    },
    dropdown: {
        position: 'absolute', top: 70, right: 20,
        backgroundColor: '#1a1a1a', borderRadius: 14,
        paddingVertical: 5, zIndex: 20,
        borderWidth: 1, borderColor: '#333',
        minWidth: 220,
        shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10,
    },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15, gap: 12 },
    dropdownDivider: { borderBottomWidth: 1, borderBottomColor: '#ff000030' }, // Kırmızı çizgiler
    dropdownIcon: { fontSize: 20 },
    dropdownLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
    content: { paddingHorizontal: 20, marginTop: 10 },
    card: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 16, borderLeftWidth: 5, borderLeftColor: '#ff0000' },
    cardTitle: { color: '#ff0000', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
    summaryText: { color: '#fff', fontSize: 15, lineHeight: 24 },
    table: { backgroundColor: '#1a1a1a', padding: 18, borderRadius: 15, marginBottom: 16 },
    tableTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: '#333' },
    tableLabel: { color: '#aaa', fontSize: 13 },
    valueContainer: { flexDirection: 'row', alignItems: 'baseline' },
    value: { fontSize: 17, fontWeight: 'bold' },
    unit: { color: '#666', fontSize: 10 },
    aiCard: { backgroundColor: '#111', padding: 18, borderRadius: 15, marginBottom: 16, borderWidth: 1, borderColor: '#ff0000' },
    aiText: { color: '#fff', fontSize: 14, lineHeight: 21, marginBottom: 14 },
    aiPlaceholder: { color: '#666', fontSize: 13, marginBottom: 14, fontStyle: 'italic' },
    aiButton: { backgroundColor: '#ff0000', padding: 13, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold' },
});