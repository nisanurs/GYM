import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

const getField = (item, ...keys) => {
    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null && item[key] !== '') return item[key];
    }
    return null;
};

export default function TrainingScreen({ navigation, route }) {
    const { userToken } = route.params || {};
    const [exercise, setExercise] = useState('');
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetchWorkouts();
        const unsubscribe = navigation.addListener('focus', fetchWorkouts);
        return unsubscribe;
    }, [navigation]);

    const fetchWorkouts = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/v1/api/workouts`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const data = response.data;
            setLogs(Array.isArray(data) ? data : (data?.workouts || []));
        } catch (err) {
            console.error("Antrenmanlar çekilemedi:", err.response?.data);
        }
    };

    const handleSave = async () => {
        if (!exercise || !sets || !reps || !weight) {
            Alert.alert("Hata", "Lütfen tüm alanları doldur!");
            return;
        }
        try {
            await axios.post(`${BASE_URL}/v1/api/workouts`, {
                exercise,
                sets: parseInt(sets),
                reps: parseInt(reps),
                weight: parseFloat(weight),
                date: new Date().toISOString().split('T')[0],
            }, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            Alert.alert("Başarılı", "Antrenman kaydedildi! 💪");
            setExercise(''); setSets(''); setReps(''); setWeight('');
            fetchWorkouts();
        } catch (err) {
            Alert.alert("Hata", "Kayıt başarısız: " + (err.response?.data?.error || "Bağlantı hatası"));
        }
    };

    const deleteLog = async (id) => {
        Alert.alert("Emin misin?", "Bu antrenman kaydı silinecek.", [
            { text: "İptal", style: "cancel" },
            {
                text: "Sil", style: "destructive",
                onPress: async () => {
                    try {
                        await axios.delete(`${BASE_URL}/v1/api/workouts/${id}`, {
                            headers: { 'Authorization': `Bearer ${userToken}` }
                        });
                        setLogs(prev => prev.filter(log => (log.id || log.ID) !== id));
                    } catch {
                        Alert.alert("Hata", "Silme işlemi başarısız.");
                    }
                }
            }
        ]);
    };

    // Kayıtları tarihe göre grupla
    const groupByDate = (items) => {
        const groups = {};
        items.forEach(item => {
            const date = getField(item, 'date', 'Date') || 'Tarihsiz';
            const key = String(date).split('T')[0];
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    };

    const grouped = groupByDate(logs);

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Geri</Text>
            </TouchableOpacity>

            <Text style={styles.header}>ANTRENMAN <Text style={{ color: '#ff0000' }}>KAYDI</Text></Text>

            {/* Form */}
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Egzersiz Adı (Örn: Bench Press)"
                    placeholderTextColor="#666"
                    value={exercise}
                    onChangeText={setExercise}
                />
                <View style={styles.row}>
                    <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Set" placeholderTextColor="#666" keyboardType="numeric" value={sets} onChangeText={setSets} />
                    <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Tekrar" placeholderTextColor="#666" keyboardType="numeric" value={reps} onChangeText={setReps} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Kg" placeholderTextColor="#666" keyboardType="numeric" value={weight} onChangeText={setWeight} />
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.buttonText}>KAYDET ✨</Text>
                </TouchableOpacity>
            </View>

            {/* Tüm geçmiş — tarihe göre gruplanmış */}
            <Text style={styles.listTitle}>TÜM ANTRENMAN GEÇMİŞİ ({logs.length} kayıt)</Text>
            <FlatList
                data={grouped}
                keyExtractor={([date]) => date}
                renderItem={({ item: [date, items] }) => (
                    <View style={styles.dateGroup}>
                        <Text style={styles.dateHeader}>{date}</Text>
                        {items.map((item, idx) => {
                            const exerciseName = getField(item, 'exercise', 'Exercise');
                            const setsVal = getField(item, 'sets', 'Sets');
                            const repsVal = getField(item, 'reps', 'Reps');
                            const weightVal = getField(item, 'weight', 'Weight');
                            const itemId = getField(item, 'id', 'ID');
                            return (
                                <View key={idx} style={styles.logItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.logText}>{exerciseName || '—'}</Text>
                                        <Text style={styles.logDetail}>
                                            {setsVal ?? '?'} Set × {repsVal ?? '?'} Tekrar — {weightVal ?? '?'} kg
                                        </Text>
                                    </View>
                                    <View style={styles.actions}>
                                        <TouchableOpacity onPress={() => navigation.navigate('EditWorkout', { userToken, workout: item })}>
                                            <Text style={{ fontSize: 16 }}>✏️</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteLog(itemId)}>
                                            <Text style={{ fontSize: 16 }}>🗑️</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Henüz antrenman yok. Hadi başla! 💪</Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    backBtn: { marginBottom: 8 },
    backText: { color: '#ff0000', fontSize: 16, fontWeight: 'bold' },
    header: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
    form: { backgroundColor: '#111', padding: 14, borderRadius: 14, marginBottom: 16 },
    input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 11, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
    row: { flexDirection: 'row' },
    saveButton: { backgroundColor: '#ff0000', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    listTitle: { color: '#ff0000', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
    dateGroup: { marginBottom: 14 },
    dateHeader: { color: '#ff0000', fontWeight: 'bold', fontSize: 13, marginBottom: 6, paddingLeft: 4 },
    logItem: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: '#ff0000', flexDirection: 'row', alignItems: 'center' },
    logText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    logDetail: { color: '#aaa', fontSize: 12, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 10 },
    emptyText: { color: '#555', textAlign: 'center', marginTop: 20 },
});