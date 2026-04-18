import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

export default function TrainingScreen() {
    const [exercise, setExercise] = useState('');
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [logs, setLogs] = useState([]);

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
            date: new Date().toISOString().split('T')[0] // Bugünün tarihi
        };

        try {
            // SENİN GO BACKEND'İNE GÖRE GÜNCELLEMELİYİZ
            // const res = await axios.post('https://gym-hku6.onrender.com/v1/api/workouts', payload);
            Alert.alert("Başarılı", "Antrenman kaydedildi! 💪");
            setLogs([payload, ...logs]); // Listeye geçici olarak ekle
            setExercise(''); setSets(''); setReps(''); setWeight('');
        } catch (err) {
            Alert.alert("Hata", "Backend'e bağlanılamadı.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>ANTRENMAN <Text style={{ color: '#ff0000' }}>KAYDI</Text></Text>

            {/* Giriş Formu */}
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

            {/* Kayıt Listesi */}
            <Text style={styles.listTitle}>BUGÜNKÜ ÇALIŞMALARIN</Text>
            <FlatList
                data={logs}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.logItem}>
                        <Text style={styles.logText}>{item.exercise}</Text>
                        <Text style={styles.logDetail}>{item.sets} Set x {item.reps} Tekrar - {item.weight}kg</Text>
                    </View>
                )}
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
    logItem: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#ff0000' },
    logText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    logDetail: { color: '#aaa', fontSize: 12, marginTop: 5 }
});