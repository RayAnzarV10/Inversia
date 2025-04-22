import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Session } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types/navigationTypes';

// Importar las pantallas
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { supabase } from '../services/supabase';
import CreatePortfolioScreen from 'screens/CreatePortfolioScreen';

// Definir tipos para la autenticación
type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Crear los navegadores
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Navegador para usuarios no autenticados
const AuthNavigator = () => (
  <AuthStack.Navigator initialRouteName="Login">
    <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar Sesión' }} />
    <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registrarse' }} />
  </AuthStack.Navigator>
);

// Navegador de pestañas
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else if (route.name === 'CreatePortfolio') {
          iconName = focused ? 'add-circle' : 'add-circle-outline';
        }

        return <Ionicons name={iconName as any} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#FFFFFF',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        backgroundColor: '#000000', // Cambia a color negro para que coincida con tu tema
        borderTopWidth: 0,          // Elimina la línea superior si lo deseas
      },
      headerShown: false
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
    <Tab.Screen name="CreatePortfolio" component={CreatePortfolioScreen} options={{ title: 'Nuevo' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
  </Tab.Navigator>
);

// Navegador principal para usuarios autenticados
const MainNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen name='CreatePortfolio' component={CreatePortfolioScreen} options={{ headerShown: false }}/>
  </Stack.Navigator>
);

// Navegador principal que decide qué stack mostrar
export const RootNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios en la sesión
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setIsLoading(false);
      }
    );

    // Verificar si hay una sesión activa al inicio
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsLoading(false);
    });

    // Limpiar el listener cuando el componente se desmonta
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Mientras se carga, podríamos mostrar un spinner o pantalla de bienvenida
  if (isLoading) {
    return null; // O un componente de carga
  }

  return (
    <NavigationContainer>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;