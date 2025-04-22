import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reemplaza con tus propias credenciales de Supabase
const supabaseUrl = 'https://peernqjreiudkjyypuzm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZXJucWpyZWl1ZGtqeXlwdXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MjQ1MDYsImV4cCI6MjA2MDAwMDUwNn0.Kxxrvsnf3GkeyidAgonu6tui7X0LfzUxaiQ-6bTxbbE';

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