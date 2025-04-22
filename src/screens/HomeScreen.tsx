import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl, 
  Alert,
  StatusBar,
  ScrollView
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types/navigationTypes';
import { usePortfolioContext } from 'contexts/PortfolioContext';

// Definir interfaces basadas en la estructura de nuestra base de datos
interface Portafolio {
  id: string;
  nombre: string;
  moneda_base: string;
  descripcion?: string;
  es_portafolio_principal: boolean;
  estatus: 'Activo' | 'Archivado';
  fecha_creacion: string;
  usuario_id: string;
}

interface ActivoPortafolio {
  portafolio_id: string;
  activo_id_externo: string;
  simbolo: string;
  tipo_activo: string;
  cantidad: number;
  fecha_primera_compra: string;
  fecha_ultima_operacion: string;
  ultima_actualizacion: string;
  // Datos calculados o obtenidos del proveedor externo
  precio_actual?: number;
  cambio_valor?: number;
  cambio_porcentaje?: number;
  valor_total?: number;
}

const HomeScreen: React.FC = () => {
  const [activos, setActivos] = useState<ActivoPortafolio[]>([]);
  const [portafolios, setPortafolios] = useState<Portafolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTimeFilter, setActiveTimeFilter] = useState('1W');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [portfolioMenuVisible, setPortfolioMenuVisible] = useState(false);
  const [currentPortfolio, setCurrentPortfolio] = useState<Portafolio | null>(null);
  const { shouldRefetchPortfolios, resetPortfolioRefetch } = usePortfolioContext();

  // Cargar lista de portafolios al inicio
  useEffect(() => {
    fetchPortafolios();
  }, []);

  useEffect(() => {
    if (shouldRefetchPortfolios) {
      // Limpiar cualquier error previo
      setError(null);
      
      // Recargar los portafolios
      fetchPortafolios();
      
      // Resetear la bandera para evitar múltiples llamadas
      resetPortfolioRefetch();
    }
  }, [shouldRefetchPortfolios]);

  // Recargar datos de activos cada vez que cambie el portafolio seleccionado
  useEffect(() => {
    if (currentPortfolio) {
      fetchActivosPortafolio(currentPortfolio.id);
    }
  }, [currentPortfolio]);

  // Recargar activos cada vez que la pantalla obtiene el foco
  useFocusEffect(
    React.useCallback(() => {
      setError(null);
      // fetchPortafolios();
      if (currentPortfolio) {
        fetchActivosPortafolio(currentPortfolio.id);
      }
    }, []) // Sin dependencias para que se ejecute cada vez que la pantalla obtiene el foco
  );

  const handlePortfolioMenuOpen = () => {
    setPortfolioMenuVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentPortfolio) {
      await fetchActivosPortafolio(currentPortfolio.id);
    }
    setRefreshing(false);
  };

  const fetchPortafolios = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Si no hay usuario autenticado, usar el ID fijo para desarrollo
      const currentUserId = user?.id

      const { data, error } = await supabase
        .from('portafolios')
        .select('*')
        .eq('usuario_id', currentUserId)
        .order('es_portafolio_principal', { ascending: false });
      
      if (error) {
        throw error;
      }
            
      if (data && data.length > 0) {
        setPortafolios(data);
        // Seleccionar el primer portafolio por defecto o el principal si existe
        const portafolioPrincipal = data.find(p => p.es_portafolio_principal) || data[0];
        setCurrentPortfolio(portafolioPrincipal);
      } else {
        console.log('No se encontraron portafolios');
        setError('No hay portafolios disponibles. ¿Quieres crear uno nuevo?');
      }
    } catch (error: any) {
      console.error('Error detallado:', error);
      setError(`Error al cargar portafolios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivosPortafolio = async (portfolioId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('activos_portafolio')
        .select('*')
        .eq('portafolio_id', portfolioId);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Aquí simularemos datos que vendrían del proveedor externo
        // En una implementación real, consultarías a tu proveedor financiero
        const activosConPrecios = data.map(activo => ({
          ...activo,
          precio_actual: Math.random() * 1000 + 10,
          cambio_valor: (Math.random() * 20) - 10,
          cambio_porcentaje: (Math.random() * 10) - 5,
          valor_total: activo.cantidad * (Math.random() * 1000 + 10)
        }));
        
        setActivos(activosConPrecios);
      }
    } catch (error: any) {
      console.error('Error al cargar activos del portafolio:', error.message);
      setError('No se pudieron cargar los activos. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteActivo = (activo: ActivoPortafolio) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este activo de tu portafolio?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              // Corregido: Usar la clave primaria compuesta (portafolio_id, activo_id_externo)
              const { error } = await supabase
                .from('activos_portafolio')
                .delete()
                .eq('portafolio_id', activo.portafolio_id)
                .eq('activo_id_externo', activo.activo_id_externo);
              
              if (error) {
                throw error;
              }
              
              // Actualizar la lista
              setActivos(activos.filter(
                item => !(item.portafolio_id === activo.portafolio_id && 
                          item.activo_id_externo === activo.activo_id_externo)
              ));
              
            } catch (error: any) {
              console.error('Error al eliminar activo:', error.message);
              Alert.alert('Error', 'No se pudo eliminar el activo');
            }
          } 
        }
      ]
    );
  };

  const renderTimeFilter = (label: string) => {
    const isActive = activeTimeFilter === label;
    return (
      <TouchableOpacity 
        style={[styles.timeFilterButton, isActive && styles.timeFilterButtonActive]}
        onPress={() => setActiveTimeFilter(label)}
      >
        <Text style={[styles.timeFilterText, isActive && styles.timeFilterTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderActivoItem = (activo: ActivoPortafolio, index: number) => {
    const isPositive = activo.cambio_porcentaje! > 0;
    const changeAmount = isPositive 
      ? `+$${Math.abs(activo.cambio_valor!).toFixed(2)}` 
      : `-$${Math.abs(activo.cambio_valor!).toFixed(2)}`;
    const changePercent = isPositive 
      ? `+${activo.cambio_porcentaje!.toFixed(2)}%` 
      : `-${Math.abs(activo.cambio_porcentaje!).toFixed(2)}%`;
    const changeColor = isPositive ? '#4CD964' : '#FF3B30';
    
    return (
      <TouchableOpacity 
        key={`${activo.portafolio_id}-${activo.activo_id_externo}`}
        // onPress={() => navigation.navigate('ItemDetail', { 
        //   portafolioId: activo.portafolio_id,
        //   activoIdExterno: activo.activo_id_externo
        // })}
        style={styles.categoryItem}
      >
        <View style={styles.categoryLeft}>
          <Text style={styles.categoryTitle}>{activo.simbolo}</Text>
          <Text style={styles.categorySubtitle}>{activo.tipo_activo}</Text>
          <View style={styles.categoryBar}>
            <View style={[styles.categoryBarFill, { width: `${30 + (index * 15) % 50}%` }]} />
          </View>
          <View style={styles.miniChartContainer}>
            {/* Simple static chart representation */}
            <View style={[styles.miniChart, { backgroundColor: isPositive ? '#4CD964' : '#FF3B30' }]} />
          </View>
        </View>
        
        <View style={styles.categoryRight}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteActivo(activo);
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
          <Text style={styles.categoryValue}>${activo.valor_total!.toFixed(2)}</Text>
          <Text style={[styles.categoryChange, { color: changeColor }]}>
            {changeAmount} {changePercent}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Calcula el valor total del portafolio
  const calcularValorPortafolio = () => {
    return activos.reduce((total, activo) => total + (activo.valor_total || 0), 0);
  };

  // Calcula el cambio total del portafolio
  const calcularCambioPortafolio = () => {
    const cambioTotal = activos.reduce((total, activo) => total + (activo.cambio_valor || 0), 0);
    const valorAnterior = calcularValorPortafolio() - cambioTotal;
    const porcentajeCambio = valorAnterior > 0 ? (cambioTotal / valorAnterior) * 100 : 0;
    
    return {
      valor: cambioTotal,
      porcentaje: porcentajeCambio
    };
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#4CD964" />
      </View>
    );
  }

  if (error && error.includes('No hay portafolios disponibles')) {
    return (
      <View style={styles.emptyStateContainer}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconContainer}>
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Mi Portafolio</Text>
          
          <TouchableOpacity style={styles.headerIconContainer}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.emptyStateContent}>
          <View style={styles.emptyStateIconContainer}>
            <Ionicons name="wallet-outline" size={80} color="#333" />
          </View>
          
          <Text style={styles.emptyStateTitle}>Sin portafolios</Text>
          <Text style={styles.emptyStateDescription}>
            Aún no tienes ningún portafolio. Crea tu primer portafolio para comenzar a rastrear tus inversiones.
          </Text>
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => {
              // Aquí puedes navegar a la pantalla de creación de portafolio
              navigation.navigate('CreatePortfolio');
              console.log('Crear nuevo portafolio');
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="black" style={styles.createButtonIcon} />
            <Text style={styles.createButtonText}>Crear Portafolio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const valorPortafolio = calcularValorPortafolio();
  const cambioPortafolio = calcularCambioPortafolio();
  const isPositive = cambioPortafolio.valor >= 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconContainer}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.portfolioSelector}
          onPress={handlePortfolioMenuOpen}
          activeOpacity={0.7}
        >
          <Text 
            style={styles.headerTitle} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {currentPortfolio?.nombre || 'Seleccionar Portafolio'}
          </Text>
          <View style={styles.customUnderline} />
        </TouchableOpacity>
        
        {/* Menú de portafolios (sin cambios) */}
        {portfolioMenuVisible && (
          <>
            <TouchableOpacity 
              style={styles.backdrop}
              onPress={() => setPortfolioMenuVisible(false)}
            />
            <View style={styles.portfolioMenu}>
              <ScrollView style={styles.portfolioMenuScroll} showsVerticalScrollIndicator={false}>
                {portafolios.map((portafolio, index) => (
                  <TouchableOpacity 
                    key={portafolio.id}
                    style={[
                      styles.portfolioMenuItem, 
                      index === portafolios.length - 1 ? { borderBottomWidth: 0 } : null
                    ]}
                    onPress={() => {
                      setCurrentPortfolio(portafolio);
                      setPortfolioMenuVisible(false);
                    }}
                  >
                    <Text 
                      style={styles.portfolioMenuItemText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {portafolio.nombre}
                    </Text>
                    {currentPortfolio?.id === portafolio.id && (
                      <Ionicons name="checkmark" size={16} color="#4CD964" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}
        
        <TouchableOpacity style={styles.headerIconContainer}>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Portfolio Overview - AHORA FIJO */}
      <View style={styles.overviewSection}>
        <Text style={styles.overviewLabel}>HOLDINGS OVERVIEW</Text>
        <Text style={styles.overviewValue}>${valorPortafolio.toFixed(2)}</Text>
        <Text style={[
          styles.overviewChange, 
          { color: isPositive ? '#4CD964' : '#FF3B30' }
        ]}>
          {isPositive ? '+' : '-'}${Math.abs(cambioPortafolio.valor).toFixed(2)} {isPositive ? '+' : '-'}{Math.abs(cambioPortafolio.porcentaje).toFixed(2)}%
        </Text>
        
        {/* Chart Placeholder */}
        <View style={styles.chartPlaceholder} />
        
        {/* Time Filters */}
        <View style={styles.timeFilters}>
          {renderTimeFilter('1H')}
          {renderTimeFilter('1D')}
          {renderTimeFilter('1W')}
          {renderTimeFilter('1M')}
          {renderTimeFilter('1Y')}
          {renderTimeFilter('ALL')}
        </View>
      </View>
      
      {/* SOLO los activos son scrolleables */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CD964"
            colors={['#4CD964']}
          />
        }
      >
        {/* Activos List */}
        {activos.length === 0 && !loading && !refreshing ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay activos en este portafolio</Text>
          </View>
        ) : (
          <View style={styles.categoriesContainer}>
            {activos.map((activo, index) => renderActivoItem(activo, index))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  portfolioSelector: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioTitleWrapper: {
    alignItems: 'center',
  },
  customUnderline: {
    height: 2,
    width: '50%',
    backgroundColor: '#4CD964',
    marginTop: 5,
    borderRadius: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  portfolioMenu: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 0,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 140,
  },
  portfolioMenuScroll: {
    width: '100%',
    borderRadius: 12,
  },
  portfolioMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  portfolioMenuItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  scrollView: {
    flex: 1,
  },
  overviewSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#000',
    zIndex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  overviewChange: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 100,
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#4CD964',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  timeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeFilterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  timeFilterButtonActive: {
    backgroundColor: 'white',
  },
  timeFilterText: {
    color: '#999',
    fontSize: 14,
  },
  timeFilterTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  categoryLeft: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  categoryBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
    width: '80%',
  },
  categoryBarFill: {
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
  },
  miniChartContainer: {
    height: 20,
    width: '80%',
  },
  miniChart: {
    height: 20,
    width: '100%',
    borderRadius: 2,
    opacity: 0.2,
  },
  categoryRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  deleteButton: {
    padding: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  categoryChange: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 80,
    backgroundColor: 'white',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  // Añade estos estilos al objeto StyleSheet existente

  // Estilos para el estado vacío
  emptyStateContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  emptyStateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#4CD964',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingBottom: 30, // Ajusta según sea necesario para dispositivos con notch
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: '#999',
  },
});

export default HomeScreen;