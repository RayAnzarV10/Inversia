import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reemplaza con tus propias credenciales de Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY as string;

// Crear un cliente de Supabase personalizado para React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Funciones de ayuda para interactuar con Supabase
export const getUser = async () => {
  return await supabase.auth.getUser();
};


export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {} // Mantener los datos vacíos
      }
    });
    
    console.log("Respuesta de registro:", data);
    
    return { data, error };
  } catch (err) {
    console.error("Error en el registro:", err);
    return { data: null, error: err };
  }
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};