import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BodyInputScreen from './src/screens/BodyInputScreen';
import HomeScreen from './src/screens/HomeScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import EditWorkoutScreen from './src/screens/EditWorkoutScreen';
import MeasureScreen from './src/screens/MeasureScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import GoalsScreen from './src/screens/GoalsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="BodyInput" component={BodyInputScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Training" component={TrainingScreen} />
        <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} />
        <Stack.Screen name="Measure" component={MeasureScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}