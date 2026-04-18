import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BodyInputScreen({ navigation }) {
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [fatRate, setFatRate] = useState('');
    const [targetWeight, setTargetWeight] = useState('');

    const handleNext = () => {

        navigation.navigate('Main');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Text style={styles.header}>GÜNCEL <Text style={{ color: '#ff0000' }}>DURUMUN</Text></Text>
                <Text style={styles.subText}>Analizini yapabilmemiz için lütfen güncel ölçülerini gir Nisa.</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Kilon (kg)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="Örn: 65" placeholderTextColor="#555" onChangeText={setWeight} />

                    <Text style={styles.label}>Boyun (cm)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="Örn: 170" placeholderTextColor="#555" onChangeText={setHeight} />

                    <Text style={styles.label}>Yağ Oranın (%)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="Örn: 20" placeholderTextColor="#555" onChangeText={setFatRate} />

                    <Text style={styles.label}>Hedef Kilon (kg)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="Örn: 60" placeholderTextColor="#555" onChangeText={setTargetWeight} />

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