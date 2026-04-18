import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

export default function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Backend'den verileri çekiyoruz
        const fetchData = async () => {
            try {
                const response = await axios.get('https://gym-hku6.onrender.com/v1/api/stats/body');
                setData(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Veri çekilemedi:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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

            {/* Header Kısmı */}
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
                                <Text style={styles.label}>{key.toUpperCase()}</Text>
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
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    header: { marginTop: 40, alignItems: 'center', padding: 20 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
    subtitle: { fontSize: 10, color: '#ccc', marginTop: 5 },
    content: { padding: 20 },
    card: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#ff0000' },
    cardTitle: { color: '#ff0000', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
    summaryText: { color: '#fff', fontSize: 18, lineHeight: 26, fontWeight: '500' },
    table: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 50 },
    tableTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#333' },
    label: { color: '#aaa', fontSize: 13, fontWeight: '600' },
    valueContainer: { flexDirection: 'row', alignItems: 'baseline' },
    value: { fontSize: 18, fontWeight: 'bold' }
});