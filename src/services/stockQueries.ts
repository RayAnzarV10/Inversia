import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';

// Interfaz mejorada para precios de acciones
// Utilizamos un índice de firma que permite cualquier número de símbolos
export interface StockPrice {
  Date: string;
  [symbol: string]: string | number; // Permite cualquier símbolo de acción como clave
}

// Cache para los datos
let stockDataCache: StockPrice[] | null = null;

/**
 * Carga los datos del CSV
 * @returns Array con todos los datos de precios
 */
export const loadAllStockData = async (): Promise<StockPrice[]> => {
  try {
    // Si ya tenemos los datos en caché, los devolvemos
    if (stockDataCache !== null) {
      return stockDataCache;
    }
    
    // En una app real, ajusta la ruta según tu estructura
    const csvPath = `${FileSystem.documentDirectory}stock_prices.csv`;
    const fileExists = await FileSystem.getInfoAsync(csvPath);
    
    if (!fileExists.exists) {
      throw new Error('El archivo CSV no se encuentra');
    }
    
    const fileContent = await FileSystem.readAsStringAsync(csvPath);
    
    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as StockPrice[];
          // Guardar en caché
          stockDataCache = data;
          resolve(data);
        },
        error: (error: any) => {
          reject(new Error(`Error al analizar CSV: ${error.message}`));
        }
      });
    });
  } catch (error: any) {
    console.error('Error al cargar datos:', error.message);
    throw error;
  }
};

/**
 * Obtiene los datos más recientes de todas las acciones
 * @returns Último registro de precios disponible
 */
export const getLatestPriceData = async (): Promise<StockPrice> => {
  const data = await loadAllStockData();
  if (data.length === 0) {
    throw new Error('No hay datos disponibles');
  }
  
  return data[data.length - 1];
};

/**
 * Obtiene todos los símbolos de acciones disponibles en el dataset
 * @returns Array con todos los símbolos de acciones disponibles
 */
export const getAvailableSymbols = async (): Promise<string[]> => {
  const data = await loadAllStockData();
  
  if (data.length === 0) {
    return [];
  }
  
  // Obtener todas las claves excepto 'Date'
  const allKeys = Object.keys(data[0]);
  return allKeys.filter(key => key !== 'Date');
};

/**
 * Obtiene el historial de precios para un símbolo específico
 * @param symbol Símbolo de la acción (ej. 'AAPL')
 * @returns Array con todos los precios históricos para ese símbolo
 */
export const getStockPriceHistory = async (symbol: string): Promise<{date: string, price: number}[]> => {
  const data = await loadAllStockData();
  
  // Verificar que el símbolo existe en los datos
  if (data.length > 0 && typeof data[0][symbol] === 'undefined') {
    throw new Error(`Símbolo no encontrado: ${symbol}`);
  }
  
  return data.map(item => ({
    date: item.Date as string,
    price: item[symbol] as number
  }));
};

/**
 * Obtiene datos para un rango de fechas específico
 * @param startDate Fecha inicial (formato YYYY-MM-DD)
 * @param endDate Fecha final (formato YYYY-MM-DD)
 * @returns Datos filtrados para el rango de fechas
 */
export const getDataByDateRange = async (startDate: string, endDate: string): Promise<StockPrice[]> => {
  const data = await loadAllStockData();
  
  return data.filter(item => {
    const itemDate = item.Date as string;
    return itemDate >= startDate && itemDate <= endDate;
  });
};

/**
 * Obtiene los precios para una fecha específica
 * @param date Fecha (formato YYYY-MM-DD)
 * @returns Datos de precios para esa fecha o el día más cercano
 */
export const getPricesByDate = async (date: string): Promise<StockPrice | null> => {
  const data = await loadAllStockData();
  
  // Buscar la fecha exacta
  const exactMatch = data.find(item => item.Date === date);
  if (exactMatch) {
    return exactMatch;
  }
  
  // Si no hay coincidencia exacta, devolver null
  return null;
};

/**
 * Obtiene los N días más recientes de datos
 * @param days Número de días a obtener
 * @returns Los últimos N días de datos
 */
export const getRecentData = async (days: number): Promise<StockPrice[]> => {
  const data = await loadAllStockData();
  
  if (data.length === 0) {
    return [];
  }
  
  // Obtener los últimos N días (o todos si hay menos)
  return data.slice(Math.max(0, data.length - days));
};

/**
 * Obtiene precios para varios símbolos en la fecha más reciente
 * @param symbols Lista de símbolos (opcional, si no se proporciona devuelve todos)
 * @returns Objeto con los precios más recientes de los símbolos solicitados
 */
export const getLatestPricesForSymbols = async (symbols?: string[]): Promise<{[symbol: string]: number}> => {
  const latestData = await getLatestPriceData();
  
  // Si no se proporcionan símbolos, obtener todos los disponibles
  if (!symbols || symbols.length === 0) {
    const allSymbols = await getAvailableSymbols();
    symbols = allSymbols;
  }
  
  const result: {[symbol: string]: number} = {};
  
  symbols.forEach(symbol => {
    if (latestData[symbol] !== undefined) {
      result[symbol] = latestData[symbol] as number;
    }
  });
  
  return result;
};

/**
 * Obtiene el precio más alto para un símbolo en todo el dataset
 * @param symbol Símbolo de la acción
 * @returns El precio más alto registrado
 */
export const getHighestPrice = async (symbol: string): Promise<{date: string, price: number}> => {
  const data = await loadAllStockData();
  
  // Verificar que el símbolo existe
  if (data.length > 0 && typeof data[0][symbol] === 'undefined') {
    throw new Error(`Símbolo no encontrado: ${symbol}`);
  }
  
  let highestPrice = 0;
  let dateOfHighest = '';
  
  data.forEach(item => {
    const price = item[symbol] as number;
    if (price > highestPrice) {
      highestPrice = price;
      dateOfHighest = item.Date as string;
    }
  });
  
  return {
    date: dateOfHighest,
    price: highestPrice
  };
};

/**
 * Obtiene el precio más bajo para un símbolo en todo el dataset
 * @param symbol Símbolo de la acción
 * @returns El precio más bajo registrado
 */
export const getLowestPrice = async (symbol: string): Promise<{date: string, price: number}> => {
  const data = await loadAllStockData();
  
  // Verificar que el símbolo existe
  if (data.length > 0 && typeof data[0][symbol] === 'undefined') {
    throw new Error(`Símbolo no encontrado: ${symbol}`);
  }
  
  let lowestPrice = Number.MAX_VALUE;
  let dateOfLowest = '';
  
  data.forEach(item => {
    const price = item[symbol] as number;
    if (price < lowestPrice) {
      lowestPrice = price;
      dateOfLowest = item.Date as string;
    }
  });
  
  return {
    date: dateOfLowest,
    price: lowestPrice
  };
};

/**
 * Obtiene todas las fechas disponibles en el dataset
 * @returns Array con todas las fechas
 */
export const getAllDates = async (): Promise<string[]> => {
  const data = await loadAllStockData();
  return data.map(item => item.Date as string);
};

/**
 * Busca acciones que contienen cierto texto en su símbolo
 * @param query Texto a buscar
 * @returns Lista de símbolos que coinciden
 */
export const searchSymbols = async (query: string): Promise<string[]> => {
  const symbols = await getAvailableSymbols();
  
  if (!query) {
    return symbols;
  }
  
  const upperQuery = query.toUpperCase();
  return symbols.filter(symbol => symbol.includes(upperQuery));
};

/**
 * Limpia la caché de datos
 * Útil para forzar una recarga desde el archivo CSV
 */
export const clearCache = (): void => {
  stockDataCache = null;
};

/**
 * Obtiene datos para un gráfico (valores y fechas)
 * @param symbol Símbolo de la acción
 * @param days Número de días a incluir
 * @returns Datos formateados para un gráfico
 */
export const getChartData = async (symbol: string, days: number = 30): Promise<{
  labels: string[],
  values: number[]
}> => {
  const history = await getStockPriceHistory(symbol);
  
  // Obtener solo los últimos N días
  const recentHistory = history.slice(Math.max(0, history.length - days));
  
  // Extraer fechas y precios
  const labels = recentHistory.map(item => {
    const date = new Date(item.date);
    return `${date.getMonth()+1}/${date.getDate()}`;
  });
  
  const values = recentHistory.map(item => item.price);
  
  return {
    labels,
    values
  };
};