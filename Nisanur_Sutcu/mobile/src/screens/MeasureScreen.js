import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

const FIELDS = [
    { key: 'weight', label: '⚖️  Kilo (kg)', placeholder: 'Örn: 68' },
    { key: 'height', label: '📏  Boy (cm)', placeholder: 'Örn: 170' },
    { key: 'fat_rate', label: '🔥  Yağ Oranı (%)', placeholder: 'Örn: 18' },
    { key: 'arm', label: '💪  Kol (cm)', placeholder: 'Örn: 32' },
    { key: 'waist', label: '〰️  Bel (cm)', placeholder: 'Örn: 75' },
    { key: 'hip', label: '🍑  Kalça (cm)', placeholder: 'Örn: 95' },
    { key: 'leg', label: '🦵  Bacak (cm)', placeholder: 'Örn: 55' },
    { key: 'neck', label: '🔵  Boyun (cm)', placeholder: 'Örn: 36' },
    { key: 'shoulder', label: '🏋️  Omuz Genişliği (cm)', placeholder: 'Örn: 45' },
];

export default function MeasureScreen({ navigation, route }) {
    const { userToken } = route.params || {};

    const [values, setValues] = useState({
        weight: '', height: '', fat_rate: '',
        arm: '', waist: '', hip: '',
        leg: '', neck: '', shoulder: '',
    });

    const handleChange = (key, val) => {
        setValues(prev => ({ ...prev, [key]: val }));
    };

    const handleSave = async () => {
        if (!values.weight || !values.height) {
            Alert.alert("Uyarı", "En azından kilo ve boy zorunlu!");
            return;
        }

        const payload = {
            date: new Date().toISOString().split('T')[0],
        };

        // Dolu olan alanları sayıya çevirerek gönder, boşları 0 yap
        FIELDS.forEach(f => {
            payload[f.key] = parseFloat(values[f.key]) || 0;
        });

        try {
            await axios.post(`${BASE_URL}/v1/api/measures`, payload, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });

            Alert.alert("Harika! 📏", "Ölçülerin kaydedildi. Gelişimin takip ediliyor!", [
                { text: "Tamam", onPress: () => navigation.navigate('Home', { userToken }) }
            ]);
        } catch (error) {
            console.error("Ölçü Hatası:", error.response?.data);
            Alert.alert("Hata", "Ölçüler kaydedilemedi: " + (error.response?.data?.error || "Bağlantı hatası"));
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>

                <Text style={styles.header}>VÜCUT <Text style={{ color: '#ff0000' }}>ÖLÇÜLERİ</Text></Text>
                <Text style={styles.subText}>Tüm ölçülerini gir. Kilo ve boy zorunlu, diğerleri opsiyonel.</Text>

                <View style={styles.form}>
                    {FIELDS.map((field) => (
                        <View key={field.key}>
                            <Text style={styles.label}>{field.label}</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    (field.key === 'weight' || field.key === 'height') && styles.inputRequired
                                ]}
                                keyboardType="numeric"
                                placeholder={field.placeholder}
                                placeholderTextColor="#555"
                                value={values[field.key]}
                                onChangeText={(val) => handleChange(field.key, val)}
                            />
                        </View>
                    ))}

                    <TouchableOpacity style={styles.button} onPress={handleSave}>
                        <Text style={styles.buttonText}>ÖLÇÜLERİ KAYDET 📏</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    backBtn: { marginBottom: 10 },
    backText: { color: '#ff0000', fontSize: 16, fontWeight: 'bold' },
    header: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
    subText: { color: '#aaa', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
    form: { backgroundColor: '#111', padding: 20, borderRadius: 15 },
    label: { color: '#ff0000', fontWeight: 'bold', marginBottom: 6, fontSize: 13 },
    input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 10, marginBottom: 18, fontSize: 16, borderWidth: 1, borderColor: '#2a2a2a' },
    inputRequired: { borderColor: '#ff0000' },  // Zorunlu alanlar kırmızı kenarlı
    button: { backgroundColor: '#ff0000', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});