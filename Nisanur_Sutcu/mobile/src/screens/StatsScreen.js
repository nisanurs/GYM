import React, { useEffect, useState } from 'react';
import {
    StyleSheet, Text, View, ScrollView,
    ActivityIndicator, TouchableOpacity, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline, Line, Circle, Text as SvgText, Rect } from 'react-native-svg';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';
const CHART_W = Dimensions.get('window').width - 60;
const CHART_H = 180;
const PAD = { top: 24, right: 24, bottom: 36, left: 44 };

// TÜM ölçütler
const METRICS = [
    { key: 'weight', label: 'Kilo', unit: 'kg', color: '#ff0000', icon: '⚖️' },
    { key: 'fat_rate', label: 'Yağ Oranı', unit: '%', color: '#ff8800', icon: '🔥' },
    { key: 'arm', label: 'Kol', unit: 'cm', color: '#00aaff', icon: '💪' },
    { key: 'waist', label: 'Bel', unit: 'cm', color: '#aa00ff', icon: '〰️' },
    { key: 'hip', label: 'Kalça', unit: 'cm', color: '#ff00aa', icon: '🍑' },
    { key: 'leg', label: 'Bacak', unit: 'cm', color: '#00cc88', icon: '🦵' },
    { key: 'neck', label: 'Boyun', unit: 'cm', color: '#ffdd00', icon: '🔵' },
    { key: 'shoulder', label: 'Omuz Genişliği', unit: 'cm', color: '#ff6644', icon: '🏋️' },
    { key: 'height', label: 'Boy', unit: 'cm', color: '#aaaaaa', icon: '📏' },
];

function LineChart({ data, dates, color, unit }) {
    if (!data || data.length < 2) {
        return (
            <View style={styles.noData}>
                <Text style={styles.noDataText}>En az 2 ölçüm gerekli</Text>
            </View>
        );
    }

    const innerW = CHART_W - PAD.left - PAD.right;
    const innerH = CHART_H - PAD.top - PAD.bottom;
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;

    const toX = (i) => PAD.left + (i / (data.length - 1)) * innerW;
    const toY = (v) => PAD.top + innerH - ((v - minVal) / range) * innerH;
    const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

    const ticks = [0, 0.5, 1].map(t => minVal + t * range);
    const xLabels = data.length <= 6
        ? data.map((_, i) => i)
        : [0, Math.floor((data.length - 1) / 2), data.length - 1];

    const trend = data[data.length - 1] - data[0];
    const trendColor = trend > 0 ? '#ff4444' : trend < 0 ? '#00cc66' : '#888';
    const trendText = trend > 0 ? `▲ +${trend.toFixed(1)} ${unit}` : trend < 0 ? `▼ ${trend.toFixed(1)} ${unit}` : '— Değişim yok';

    return (
        <View>
            <Svg width={CHART_W} height={CHART_H}>
                {/* Izgara */}
                {ticks.map((t, i) => (
                    <Line key={i} x1={PAD.left} y1={toY(t)} x2={PAD.left + innerW} y2={toY(t)} stroke="#222" strokeWidth="1" />
                ))}
                {/* Y etiketleri */}
                {ticks.map((t, i) => (
                    <SvgText key={i} x={PAD.left - 6} y={toY(t) + 4} fontSize="9" fill="#555" textAnchor="end">
                        {t.toFixed(1)}
                    </SvgText>
                ))}
                {/* X etiketleri */}
                {xLabels.map((idx) => (
                    <SvgText key={idx} x={toX(idx)} y={CHART_H - 4} fontSize="8" fill="#555" textAnchor="middle">
                        {String(dates[idx] || '').slice(5)}
                    </SvgText>
                ))}
                {/* Çizgi */}
                <Polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {/* Noktalar */}
                {data.map((v, i) => (
                    <Circle key={i} cx={toX(i)} cy={toY(v)} r="4" fill={color} stroke="#000" strokeWidth="1.5" />
                ))}
                {/* Son değer etiketi */}
                <Rect x={toX(data.length - 1) - 24} y={toY(data[data.length - 1]) - 22} width="48" height="18" rx="4" fill="#111" stroke={color} strokeWidth="1" />
                <SvgText x={toX(data.length - 1)} y={toY(data[data.length - 1]) - 9} fontSize="10" fill={color} textAnchor="middle" fontWeight="bold">
                    {data[data.length - 1].toFixed(1)} {unit}
                </SvgText>
            </Svg>
            <View style={styles.trendRow}>
                <Text style={styles.trendDate}>{String(dates[0] || '').slice(5)} → {String(dates[dates.length - 1] || '').slice(5)}</Text>
                <Text style={[styles.trendValue, { color: trendColor }]}>{trendText}</Text>
            </View>
        </View>
    );
}

export default function StatsScreen({ navigation, route }) {
    const { userToken } = route.params || {};
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeMetric, setActiveMetric] = useState('weight');

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const r = await axios.get(`${BASE_URL}/v1/api/stats/body`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            setStats(r.data?.stats_list || []);
        } catch (e) {
            console.error("Stats hatası:", e.response?.data);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ff0000" />
                <Text style={{ color: '#fff', marginTop: 10 }}>Veriler yükleniyor...</Text>
            </View>
        );
    }

    const active = METRICS.find(m => m.key === activeMetric);
    const filtered = stats.filter(s => parseFloat(s[activeMetric]) > 0);
    const chartData = filtered.map(s => parseFloat(s[activeMetric]));
    const chartDates = filtered.map(s => s.date || s.Date || '');

    const latest = stats[stats.length - 1];
    const first = stats[0];

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Geri</Text>
            </TouchableOpacity>
            <Text style={styles.header}>GELİŞİM <Text style={{ color: '#ff0000' }}>GRAFİKLERİ</Text></Text>

            {stats.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📊</Text>
                    <Text style={styles.emptyTitle}>Henüz veri yok</Text>
                    <Text style={styles.emptyDesc}>Grafik görmek için en az 2 ölçüm girmen gerekiyor.</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Measure', { userToken })}>
                        <Text style={styles.addBtnText}>ÖLÇÜM EKLE 📏</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* Özet kartları */}
                    {latest && (
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Son Kilo</Text>
                                <Text style={styles.summaryValue}>{latest.weight} kg</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Yağ Oranı</Text>
                                <Text style={styles.summaryValue}>{latest.fat_rate > 0 ? `%${latest.fat_rate}` : '—'}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Ölçüm Sayısı</Text>
                                <Text style={styles.summaryValue}>{stats.length}</Text>
                            </View>
                        </View>
                    )}

                    {/* Metrik seçici — yatay scroll */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ paddingRight: 10 }}>
                        {METRICS.map(m => (
                            <TouchableOpacity
                                key={m.key}
                                style={[styles.tab, activeMetric === m.key && { borderColor: m.color, backgroundColor: m.color + '25' }]}
                                onPress={() => setActiveMetric(m.key)}
                            >
                                <Text style={{ fontSize: 14 }}>{m.icon}</Text>
                                <Text style={[styles.tabText, activeMetric === m.key && { color: m.color }]}>{m.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Grafik */}
                    <View style={[styles.chartCard, { borderColor: active.color + '55' }]}>
                        <Text style={[styles.chartTitle, { color: active.color }]}>
                            {active.icon} {active.label} Değişimi
                        </Text>
                        <LineChart data={chartData} dates={chartDates} color={active.color} unit={active.unit} />
                    </View>

                    {/* Okuma kılavuzu */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>📖 Nasıl Okunur?</Text>
                        <Text style={styles.infoText}>
                            • Her nokta bir ölçüm tarihini gösterir.{'\n'}
                            • <Text style={{ color: '#ff4444' }}>▲ Kırmızı</Text> = artış &nbsp;|&nbsp; <Text style={{ color: '#00cc66' }}>▼ Yeşil</Text> = azalış{'\n'}
                            • Kilo ve yağ oranında azalış olumludur.{'\n'}
                            • Kas ölçülerinde artış ilerleme göstergesidir.
                        </Text>
                    </View>

                    {/* Tümü başlangıçtan bugüne tablosu */}
                    {first && latest && stats.length >= 2 && (
                        <View style={styles.timelineCard}>
                            <Text style={styles.chartTitle}>📅 Başlangıçtan Bugüne</Text>
                            {METRICS.map(m => {
                                const s = parseFloat(first[m.key] || 0);
                                const e = parseFloat(latest[m.key] || 0);
                                if (!s || !e) return null;
                                const diff = e - s;
                                return (
                                    <View key={m.key} style={styles.timelineRow}>
                                        <Text style={styles.timelineLabel}>{m.icon} {m.label}</Text>
                                        <View style={styles.timelineRight}>
                                            <Text style={styles.timelineRange}>{s.toFixed(1)} → {e.toFixed(1)} {m.unit}</Text>
                                            <Text style={[styles.timelineDiff, { color: diff > 0 ? '#ff4444' : '#00cc66' }]}>
                                                {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

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
    header: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: '#111', padding: 12, borderRadius: 12, alignItems: 'center' },
    summaryLabel: { color: '#666', fontSize: 10, marginBottom: 4 },
    summaryValue: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    tabScroll: { marginBottom: 14 },
    tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginRight: 8, backgroundColor: '#111', flexDirection: 'row', alignItems: 'center', gap: 5 },
    tabText: { color: '#666', fontSize: 11, fontWeight: 'bold' },
    chartCard: { backgroundColor: '#111', padding: 16, borderRadius: 14, marginBottom: 16, borderWidth: 1 },
    chartTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 12, color: '#fff' },
    noData: { height: 80, justifyContent: 'center', alignItems: 'center' },
    noDataText: { color: '#555', fontSize: 13 },
    trendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    trendDate: { color: '#555', fontSize: 11 },
    trendValue: { fontWeight: 'bold', fontSize: 12 },
    infoCard: { backgroundColor: '#111', padding: 16, borderRadius: 14, marginBottom: 16 },
    infoTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 10 },
    infoText: { color: '#aaa', fontSize: 13, lineHeight: 22 },
    timelineCard: { backgroundColor: '#111', padding: 16, borderRadius: 14, marginBottom: 16 },
    timelineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#222' },
    timelineLabel: { color: '#aaa', fontSize: 13 },
    timelineRight: { alignItems: 'flex-end' },
    timelineRange: { color: '#666', fontSize: 11 },
    timelineDiff: { fontWeight: 'bold', fontSize: 14 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 50, marginBottom: 16 },
    emptyTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    emptyDesc: { color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    addBtn: { backgroundColor: '#ff0000', padding: 16, borderRadius: 10 },
    addBtnText: { color: '#fff', fontWeight: 'bold' },
});