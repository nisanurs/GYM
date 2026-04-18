import React, { useEffect, useState } from 'react';
import {
    StyleSheet, Text, View, ScrollView,
    ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

const LABELS = {
    weight: '⚖️ Kilo',
    height: '📏 Boy',
    fat_rate: '🔥 Yağ Oranı',
    arm: '💪 Kol',
    waist: '〰️ Bel',
    hip: '🍑 Kalça',
    leg: '🦵 Bacak',
    neck: '🔵 Boyun',
    shoulder: '🏋️ Omuz',
};

const UNITS = {
    weight: 'kg', height: 'cm', fat_rate: '%',
    arm: 'cm', waist: 'cm', hip: 'cm',
    leg: 'cm', neck: 'cm', shoulder: 'cm',
};

export default function HistoryScreen({ navigation, route }) {
    const { userToken } = route.params || {};
    const [measures, setMeasures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null); // Hangi kart açık

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/v1/api/stats/body`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            // stats_list tarihe göre sıralı geliyor, en yeniyi üste al
            const list = response.data?.stats_list || [];
            setMeasures([...list].reverse());
        } catch (error) {
            console.error("Geçmiş çekilemedi:", error.response?.data);
            Alert.alert("Hata", "Ölçüm geçmişi yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const deleteRecord = async (id) => {
        Alert.alert("Emin misin?", "Bu ölçüm kaydı silinecek.", [
            { text: "İptal", style: "cancel" },
            {
                text: "Sil", style: "destructive",
                onPress: async () => {
                    try {
                        await axios.delete(`${BASE_URL}/v1/api/measures/${id}`, {
                            headers: { 'Authorization': `Bearer ${userToken}` }
                        });
                        setMeasures(prev => prev.filter(m => (m.id || m.ID) !== id));
                    } catch (err) {
                        Alert.alert("Hata", "Silme işlemi başarısız.");
                    }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ff0000" />
                <Text style={{ color: '#fff', marginTop: 10 }}>Geçmiş yükleniyor...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Geri</Text>
            </TouchableOpacity>

            <Text style={styles.header}>
                ÖLÇÜM <Text style={{ color: '#ff0000' }}>GEÇMİŞİ</Text>
            </Text>
            <Text style={styles.subText}>{measures.length} kayıt bulundu</Text>

            {measures.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>Henüz hiç ölçüm yok.</Text>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('Measure', { userToken })}
                    >
                        <Text style={styles.addBtnText}>İLK ÖLÇÜMÜ EKLE 📏</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {measures.map((item, index) => {
                        const id = item.id || item.ID;
                        const date = item.date || item.Date || '—';
                        const isOpen = expanded === index;

                        return (
                            <View key={id || index} style={styles.card}>
                                {/* Kart Başlığı - tıklanınca açılır/kapanır */}
                                <TouchableOpacity
                                    style={styles.cardHeader}
                                    onPress={() => setExpanded(isOpen ? null : index)}
                                >
                                    <View>
                                        <Text style={styles.dateText}>{date}</Text>
                                        <Text style={styles.previewText}>
                                            {item.weight || item.Weight} kg
                                            {(item.fat_rate || item.FatRate) > 0
                                                ? `  •  %${item.fat_rate || item.FatRate} yağ`
                                                : ''}
                                        </Text>
                                    </View>
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity onPress={() => deleteRecord(id)} style={styles.deleteBtn}>
                                            <Text style={{ fontSize: 18 }}>🗑️</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Detaylar - sadece açıkken göster */}
                                {isOpen && (
                                    <View style={styles.details}>
                                        {Object.keys(LABELS).map((key) => {
                                            const val = item[key] ?? item[key.charAt(0).toUpperCase() + key.slice(1)];
                                            if (!val || val === 0) return null;
                                            return (
                                                <View key={key} style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>{LABELS[key]}</Text>
                                                    <Text style={styles.detailValue}>
                                                        {typeof val === 'number' ? val.toFixed(1) : val} {UNITS[key]}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    backBtn: { marginBottom: 10 },
    backText: { color: '#ff0000', fontSize: 16, fontWeight: 'bold' },
    header: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
    subText: { color: '#666', textAlign: 'center', marginBottom: 20, fontSize: 13 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#555', fontSize: 16, marginBottom: 20 },
    addBtn: { backgroundColor: '#ff0000', padding: 16, borderRadius: 10 },
    addBtnText: { color: '#fff', fontWeight: 'bold' },
    card: { backgroundColor: '#111', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    dateText: { color: '#ff0000', fontWeight: 'bold', fontSize: 15, marginBottom: 3 },
    previewText: { color: '#aaa', fontSize: 13 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    deleteBtn: { padding: 4 },
    chevron: { color: '#555', fontSize: 12 },
    details: { borderTopWidth: 1, borderTopColor: '#222', padding: 16, gap: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { color: '#aaa', fontSize: 14 },
    detailValue: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});