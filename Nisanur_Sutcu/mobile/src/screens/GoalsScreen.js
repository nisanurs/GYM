import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://gym-hku6.onrender.com';

const GOALS = [
  { key: 'fat_loss', label: '🔥 Yağ Yakma', desc: 'Vücut yağını azalt, formunu ortaya çıkar' },
  { key: 'muscle_gain', label: '💪 Kas Kazanma', desc: 'Kas kütlesi kazan, güç artır' },
  { key: 'maintenance', label: '⚖️ Formu Koruma', desc: 'Mevcut kilonu ve formunu koru' },
];

export default function GoalsScreen({ navigation, route }) {
  const { userToken } = route.params || {};
  const [targetWeight, setTargetWeight] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!targetWeight && !selectedGoal) {
      Alert.alert("Uyarı", "En az bir değeri güncelle.");
      return;
    }

    setLoading(true);
    try {
      if (targetWeight) {
        await axios.put(`${BASE_URL}/v1/api/user/target`, {
          target_weight: parseFloat(targetWeight)
        }, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
      }

      Alert.alert("Yeni hedeflerin kaydedildi.", [
        { text: "Tamam", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Hedef güncellenemedi:", error.response?.data);
      Alert.alert("Hata", "Güncelleme başarısız: " + (error.response?.data?.error || "Bağlantı hatası"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <Text style={styles.header}>HEDEFLERİMİ <Text style={{ color: '#ff0000' }}>GÜNCELLE</Text></Text>
        <Text style={styles.subText}>Hedeflerin değiştiyse buradan güncelleyebilirsin.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Yeni Hedef Kilo (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 65"
            placeholderTextColor="#555"
            keyboardType="numeric"
            value={targetWeight}
            onChangeText={setTargetWeight}
          />

          <Text style={styles.label}>Antrenman Hedefin</Text>
          <View style={styles.goalList}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.goalCard, selectedGoal === g.key && styles.goalCardActive]}
                onPress={() => setSelectedGoal(g.key)}
              >
                <Text style={[styles.goalLabel, selectedGoal === g.key && { color: '#fff' }]}>
                  {g.label}
                </Text>
                <Text style={[styles.goalDesc, selectedGoal === g.key && { color: '#ffaaaa' }]}>
                  {g.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Kaydediliyor..." : "HEDEFLERİ KAYDET 🎯"}</Text>
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
  header: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subText: { color: '#aaa', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  form: { backgroundColor: '#111', padding: 20, borderRadius: 15 },
  label: { color: '#ff0000', fontWeight: 'bold', marginBottom: 8, fontSize: 13 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  goalList: { gap: 10, marginBottom: 25 },
  goalCard: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  goalCardActive: { backgroundColor: '#ff0000', borderColor: '#ff0000' },
  goalLabel: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  goalDesc: { color: '#666', fontSize: 12 },
  button: { backgroundColor: '#ff0000', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});