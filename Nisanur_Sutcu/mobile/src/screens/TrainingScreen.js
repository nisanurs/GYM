import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

export default function TrainingScreen({ route }) {
    const { userToken } = route.params || {};
    const [exercise, setExercise] = useState('');
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [logs, setLogs] = useState([]);

    // Sayfa açılınca geçmiş antrenmanları çek (GET)
    useEffect(() => {
        fetchWorkouts();
    }, []);

    const fetchWorkouts = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/v1/api/workouts`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            setLogs(response.data || []);
        } catch (err) {
            console.error("Antrenmanlar çekilemedi:", err.response?.data);
        }
    };

    // Antrenman Kaydetme (POST)
    const handleSave = async () => {
        if (!exercise || !sets || !reps || !weight) {
            Alert.alert("Hata", "Lütfen tüm alanları doldur!");
            return;
        }

        const payload = {
            exercise,
            sets: parseInt(sets),
            reps: parseInt(reps),
            weight: parseFloat(weight),
            date: new Date().toISOString().split('T')[0]
        };

        try {
            await axios.post(`${BASE_URL}/v1/api/workouts`, payload, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });

            Alert.alert("Başarılı", "Antrenman kaydedildi! 💪");

            // Alanları temizle
            setExercise('');
            setSets('');
            setReps('');
            setWeight('');

            // Listeyi güncelle
            fetchWorkouts();
        } catch (err) {
            console.error("Kayıt Hatası:", err.response?.data);
            Alert.alert("Hata", "Yetki sorunu veya bağlantı hatası.");
        }
    };

    // Antrenman Silme (DELETE)
    const deleteLog = async (id) => {
        Alert.alert(
            "Emin misin?",
            "Bu antrenman kaydı silinecek.",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sil", style: "destructive",
                    onPress: async () => {
                        try {
                            await axios.delete(`${BASE_URL}/v1/api/workouts/${id}`, {
                                headers: { 'Authorization': `Bearer ${userToken}` }
                            });
                            setLogs(logs.filter(log => log.id !== id));
                        } catch (err) {
                            Alert.alert("Hata", "Silme işlemi başarısız.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>ANTRENMAN <Text style={{ color: '#ff0000' }}>KAYDI</Text></Text>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Egzersiz Adı (Örn: Bench Press)"
                    placeholderTextColor="#666"
                    value={exercise}
                    onChangeText={setExercise}
                />
                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, { flex: 1, marginRight: 10 }]}
                        placeholder="Set"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={sets}
                        onChangeText={setSets}
                    />
                    <TextInput
                        style={[styles.input, { flex: 1, marginRight: 10 }]}
                        placeholder="Tekrar"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={reps}
                        onChangeText={setReps}
                    />
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Kg"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={weight}
                        onChangeText={setWeight}
                    />
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.buttonText}>LİSTEYE EKLE 💪</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.listTitle}>BUGÜNKÜ ÇALIŞMALARIN</Text>
            <FlatList
                data={logs}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                    <View style={styles.logItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.logText}>{item.exercise}</Text>
                            <Text style={styles.logDetail}>{item.sets} Set x {item.reps} Tekrar - {item.weight}kg</Text>
                            <Text style={styles.logDate}>{item.date}</Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteLog(item.id)} style={styles.deleteBtn}>
                            <Text style={{ color: '#ff0000', fontSize: 18 }}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={{ color: '#555', textAlign: 'center', marginTop: 20 }}>
                        Henüz antrenman kaydı yok. Hadi başla! 💪
                    </Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
    form: { backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 20 },
    input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
    row: { flexDirection: 'row' },
    saveButton: { backgroundColor: '#ff0000', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    listTitle: { color: '#ff0000', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
    logItem: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#ff0000', flexDirection: 'row', alignItems: 'center' },
    logText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    logDetail: { color: '#aaa', fontSize: 12, marginTop: 3 },
    logDate: { color: '#555', fontSize: 11, marginTop: 3 },
    deleteBtn: { padding: 8 },
});