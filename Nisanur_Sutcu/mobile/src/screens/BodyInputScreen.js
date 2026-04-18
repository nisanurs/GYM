import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

export default function BodyInputScreen({ navigation, route }) {
    const { userToken } = route.params || {};
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [fatRate, setFatRate] = useState('');
    const [targetWeight, setTargetWeight] = useState('');

    const handleNext = async () => {
        if (!weight || !height) {
            Alert.alert("Uyarı", "Lütfen en azından kilo ve boyunu gir!");
            return;
        }

        try {
            await axios.post(`${BASE_URL}/v1/api/measures`, {
                weight: parseFloat(weight),
                height: parseFloat(height),
                fat_rate: parseFloat(fatRate) || 0,
                target_weight: parseFloat(targetWeight) || 0
            }, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });

            navigation.navigate('Home', { userToken });

        } catch (error) {
            console.error("Ölçü Kayıt Hatası:", error.response?.data);
            Alert.alert(
                "Hata",
                "Ölçülerin kaydedilemedi.",
                [
                    { text: "Tekrar Dene" },
                    {
                        text: "Yine de Devam Et",
                        onPress: () => navigation.navigate('Home', { userToken })
                    }
                ]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Text style={styles.header}>GÜNCEL <Text style={{ color: '#ff0000' }}>DURUMUN</Text></Text>
                <Text style={styles.subText}>Analizini yapabilmemiz için lütfen güncel ölçülerini gir.</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Kilon (kg)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Örn: 65"
                        placeholderTextColor="#555"
                        value={weight}
                        onChangeText={setWeight}
                    />

                    <Text style={styles.label}>Boyun (cm)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Örn: 170"
                        placeholderTextColor="#555"
                        value={height}
                        onChangeText={setHeight}
                    />

                    <Text style={styles.label}>Yağ Oranın (%)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Örn: 20"
                        placeholderTextColor="#555"
                        value={fatRate}
                        onChangeText={setFatRate}
                    />

                    <Text style={styles.label}>Hedef Kilon (kg)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Örn: 60"
                        placeholderTextColor="#555"
                        value={targetWeight}
                        onChangeText={setTargetWeight}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleNext}>
                        <Text style={styles.buttonText}>ANALİZİ GÖR 🚀</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    header: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 20 },
    subText: { color: '#aaa', textAlign: 'center', marginBottom: 30, marginTop: 10 },
    form: { backgroundColor: '#111', padding: 20, borderRadius: 15 },
    label: { color: '#ff0000', fontWeight: 'bold', marginBottom: 5, fontSize: 14 },
    input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16 },
    button: { backgroundColor: '#ff0000', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});