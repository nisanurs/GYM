import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

export default function EditWorkoutScreen({ navigation, route }) {
    const { userToken, workout } = route.params || {};

    // Mevcut değerlerle başlat
    const [exercise, setExercise] = useState(workout?.exercise || workout?.Exercise || '');
    const [sets, setSets] = useState(String(workout?.sets ?? workout?.Sets ?? ''));
    const [reps, setReps] = useState(String(workout?.reps ?? workout?.Reps ?? ''));
    const [weight, setWeight] = useState(String(workout?.weight ?? workout?.Weight ?? ''));

    const workoutId = workout?.id || workout?.ID;

    const handleUpdate = async () => {
        if (!exercise || !sets || !reps || !weight) {
            Alert.alert("Uyarı", "Tüm alanları doldur!");
            return;
        }

        try {
            await axios.put(`${BASE_URL}/v1/api/workouts/${workoutId}`, {
                exercise,
                sets: parseInt(sets),
                reps: parseInt(reps),
                weight: parseFloat(weight),
                date: workout?.date || workout?.Date || new Date().toISOString().split('T')[0],
            }, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });

            Alert.alert("Güncellendi! ✅", "Antrenman kaydı başarıyla güncellendi.", [
                { text: "Tamam", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error("Güncelleme hatası:", error.response?.data);
            Alert.alert("Hata", "Güncelleme başarısız: " + (error.response?.data?.error || "Bağlantı hatası"));
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>

                <Text style={styles.header}>ANTRENMAN <Text style={{ color: '#ff0000' }}>DÜZENLE</Text></Text>
                <Text style={styles.subText}>Yanlış girdiğin değerleri düzelt.</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Egzersiz Adı</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: Bench Press"
                        placeholderTextColor="#555"
                        value={exercise}
                        onChangeText={setExercise}
                    />

                    <Text style={styles.label}>Set Sayısı</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: 4"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={sets}
                        onChangeText={setSets}
                    />

                    <Text style={styles.label}>Tekrar Sayısı</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: 12"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={reps}
                        onChangeText={setReps}
                    />

                    <Text style={styles.label}>Ağırlık (kg)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: 80"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={weight}
                        onChangeText={setWeight}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                        <Text style={styles.buttonText}>KAYDET ✅</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    backBtn: { marginBottom: 10 },
    backText: { color: '#ff0000', fontSize: 16, fontWeight: 'bold' },
    header: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
    subText: { color: '#aaa', textAlign: 'center', marginBottom: 25 },
    form: { backgroundColor: '#111', padding: 20, borderRadius: 15 },
    label: { color: '#ff0000', fontWeight: 'bold', marginBottom: 6, fontSize: 13 },
    input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 10, marginBottom: 18, fontSize: 16, borderWidth: 1, borderColor: '#333' },
    button: { backgroundColor: '#ff0000', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 5 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});