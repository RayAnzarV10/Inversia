import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Switch,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types/navigationTypes';
import { usePortfolioContext } from 'contexts/PortfolioContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definir las monedas disponibles
const MONEDAS_DISPONIBLES = [
  { id: 'MXN', nombre: 'Peso Mexicano (MXN)' },
  { id: 'USD', nombre: 'Dólar Estadounidense (USD)' },
  { id: 'EUR', nombre: 'Euro (EUR)' },
];

const CreatePortfolioScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Estados para los campos del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monedaBase, setMonedaBase] = useState('USD');
  const [monedasMenuVisible, setMonedasMenuVisible] = useState(false);
  const [esPortafolioPrincipal, setEsPortafolioPrincipal] = useState(false);
  const [isFirstPortfolio, setIsFirstPortfolio] = useState(false);
  
  // Estado para el botón principal
  const [isLoading, setIsLoading] = useState(false);
  
  const { triggerPortfolioRefetch, setNewPortfolioId } = usePortfolioContext();

  useFocusEffect(
    React.useCallback(() => {
      // Limpiar el formulario cada vez que la pantalla recibe el foco
      setNombre('');
      setDescripcion('');
      setMonedaBase('USD'); // O el valor predeterminado que prefieras
      setMonedasMenuVisible(false);
      setIsLoading(false);
      setEsPortafolioPrincipal(false);
      
      // Verificar si es el primer portafolio del usuario
      checkIfFirstPortfolio();
      
      return () => {
        // Si necesitas realizar alguna limpieza cuando la pantalla pierde el foco
      };
    }, [])
  );

  // Verificar si el usuario ya tiene portafolios
  const checkIfFirstPortfolio = async () => {
    try {
      // Obtener el usuario actual de Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      // Si no hay usuario autenticado, usar el ID fijo para desarrollo
      const currentUserId = user?.id || '911ff320-828d-4e2e-a01c-c8216aa0b5a3';
      
      // Consultar los portafolios existentes del usuario
      const { data, error, count } = await supabase
        .from('portafolios')
        .select('*', { count: 'exact' })
        .eq('usuario_id', currentUserId);
      
      if (error) {
        throw error;
      }
      
      // Si no hay portafolios, este será el primero
      if (count === 0) {
        setIsFirstPortfolio(true);
        setEsPortafolioPrincipal(true); // El primer portafolio debe ser principal
      } else {
        setIsFirstPortfolio(false);
      }
      
    } catch (error: any) {
      console.error('Error al verificar portafolios:', error.message);
    }
  };

  // Generar ID para el usuario (temporal, en un caso real deberías usar auth)
  const handleMonedasMenuToggle = () => {
    setMonedasMenuVisible(!monedasMenuVisible);
  };
  
  const handleSelectMoneda = (monedaId: string) => {
    setMonedaBase(monedaId);
    setMonedasMenuVisible(false);
  };
  
  const handleCreatePortfolio = async () => {
    // Validación básica
    if (!nombre.trim()) {
      Alert.alert('Error', 'Por favor, ingresa un nombre para tu portafolio');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Obtener el usuario actual de Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      // Si no hay usuario autenticado, usar el ID fijo para desarrollo
      const currentUserId = user?.id || '911ff320-828d-4e2e-a01c-c8216aa0b5a3';
      
      // Si este portafolio será el principal, actualizar todos los existentes a false
      if (esPortafolioPrincipal && !isFirstPortfolio) {
        const { error: updateError } = await supabase
          .from('portafolios')
          .update({ es_portafolio_principal: false })
          .eq('usuario_id', currentUserId);
          
        if (updateError) {
          console.error('Error al actualizar portafolios existentes:', updateError);
          // Continuar aunque haya error, pero registrarlo
        }
      }
      
      // Crear el nuevo portafolio
      const { data, error } = await supabase
        .from('portafolios')
        .insert([
          {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            moneda_base: monedaBase,
            es_portafolio_principal: isFirstPortfolio ? true : esPortafolioPrincipal,
            estatus: 'Activo',
            usuario_id: currentUserId
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      // NUEVO: Guardar el ID del portafolio recién creado en AsyncStorage
      if (data && data.length > 0) {
        const newPortfolioId = data[0].id;
        await AsyncStorage.setItem('lastCreatedPortfolioId', newPortfolioId);
        console.log('Portfolio ID guardado en AsyncStorage:', newPortfolioId);
      }
      
      // Mostramos un mensaje de éxito
      Alert.alert(
        'Portafolio Creado',
        'Tu portafolio ha sido creado exitosamente',
        [{ 
          text: 'OK',
          onPress: () => {
            // Simplemente regresamos a la pantalla anterior
            navigation.goBack();
          }
        }]
      );
      
    } catch (error: any) {
      console.error('Error al crear portafolio:', error.message);
      Alert.alert('Error', `No se pudo crear el portafolio: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para renderizar el nombre de la moneda seleccionada
  const getMonedaSeleccionada = () => {
    const moneda = MONEDAS_DISPONIBLES.find(m => m.id === monedaBase);
    return moneda ? moneda.nombre : 'Seleccionar moneda';
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Crear Portafolio</Text>
        
        <View style={styles.placeholderButton} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Ícono decorativo */}
          <View style={styles.iconContainer}>
            <Ionicons name="wallet-outline" size={50} color="#4CD964" />
          </View>
          
          {/* Texto instructivo */}
          <Text style={styles.instructionText}>
            Crea tu {isFirstPortfolio ? 'primer' : 'nuevo'} portafolio para comenzar a rastrear tus inversiones. Puedes añadir activos una vez creado.
          </Text>
          
          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Campo: Nombre */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del Portafolio *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Mi Portafolio Principal"
                placeholderTextColor="#666"
                value={nombre}
                onChangeText={setNombre}
                maxLength={50}
              />
            </View>
            
            {/* Campo: Descripción */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe el propósito de este portafolio"
                placeholderTextColor="#666"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
            
            {/* Campo: Moneda Base */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Moneda Base *</Text>
              <TouchableOpacity 
                style={styles.selectContainer}
                onPress={handleMonedasMenuToggle}
              >
                <Text style={styles.selectText}>
                  {getMonedaSeleccionada()}
                </Text>
                <Ionicons 
                  name={monedasMenuVisible ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#999"
                />
              </TouchableOpacity>
              
              {/* Menú desplegable de monedas */}
              {monedasMenuVisible && (
                <View style={styles.dropdownMenu}>
                  {MONEDAS_DISPONIBLES.map((moneda) => (
                    <TouchableOpacity
                      key={moneda.id}
                      style={[
                        styles.dropdownItem,
                        moneda.id === monedaBase && styles.dropdownItemSelected
                      ]}
                      onPress={() => handleSelectMoneda(moneda.id)}
                    >
                      <Text 
                        style={[
                          styles.dropdownItemText,
                          moneda.id === monedaBase && styles.dropdownItemTextSelected
                        ]}
                      >
                        {moneda.nombre}
                      </Text>
                      {moneda.id === monedaBase && (
                        <Ionicons name="checkmark" size={20} color="#4CD964" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Opción: Portafolio Principal */}
            {!isFirstPortfolio && (
              <View style={styles.switchContainer}>
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchTitle}>Establecer como portafolio principal</Text>
                  <Text style={styles.switchDescription}>
                    Si activas esta opción, este portafolio se convertirá en tu portafolio principal
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: "#333", true: "#4CD964" }}
                  thumbColor={esPortafolioPrincipal ? "#fff" : "#f4f3f4"}
                  ios_backgroundColor="#333"
                  onValueChange={setEsPortafolioPrincipal}
                  value={esPortafolioPrincipal}
                />
              </View>
            )}
            
            {/* Mensaje para primer portafolio */}
            {isFirstPortfolio && (
              <View style={styles.firstPortfolioMessage}>
                <Ionicons name="information-circle-outline" size={20} color="#4CD964" style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  Este será tu portafolio principal ya que es el primero que creas.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Botón de creación */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.createButton,
            !nombre.trim() && styles.buttonDisabled
          ]}
          onPress={handleCreatePortfolio}
          disabled={!nombre.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="black" size="small" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="black" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Crear Portafolio</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholderButton: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: 'white',
    fontSize: 16,
  },
  dropdownMenu: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },
  dropdownItemText: {
    color: 'white',
    fontSize: 14,
  },
  dropdownItemTextSelected: {
    color: '#4CD964',
    fontWeight: 'bold',
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  createButton: {
    backgroundColor: '#4CD964',
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#333',
    shadowColor: 'transparent',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16
  },
  switchTitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#999',
  },
  firstPortfolioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.3)',
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4CD964',
  }
});

export default CreatePortfolioScreen;