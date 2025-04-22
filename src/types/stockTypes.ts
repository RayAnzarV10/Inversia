// Interfaz para la información básica de una acción
export interface Stock {
  id: string;        // Identificador único
  symbol: string;    // Símbolo de la acción (ej. AAPL)
  name: string;      // Nombre completo (ej. Apple Inc.)
  price: number;     // Precio actual
  previousClose: number; // Precio de cierre del día anterior
  change: number;    // Cambio en valor
  changePercent: number; // Cambio porcentual
  market: string;    // Mercado (ej. NASDAQ, NYSE)
  currency: string;  // Moneda (ej. USD, MXN)
  sector: string;    // Sector (ej. Technology, Healthcare)
}

// Interfaz para el historial de precios
export interface PricePoint {
  date: string;      // Fecha en formato ISO
  open: number;      // Precio de apertura
  high: number;      // Precio más alto
  low: number;       // Precio más bajo
  close: number;     // Precio de cierre
  volume: number;    // Volumen de transacciones
}

// Interfaz para posición de una acción en el portafolio
export interface Position {
  stockId: string;   // ID de la acción
  shares: number;    // Número de acciones
  averagePrice: number; // Precio promedio de compra
  initialInvestment: number; // Inversión inicial
  currentValue: number; // Valor actual
  profitLoss: number; // Ganancia/pérdida
  profitLossPercent: number; // Ganancia/pérdida porcentual
  allocationPercent?: number; // Porcentaje del portafolio
}

// Interfaz para datos del portafolio completo
export interface Portfolio {
  id: string;        // ID del portafolio
  name: string;      // Nombre del portafolio
  totalValue: number; // Valor total actual
  initialInvestment: number; // Inversión inicial total
  profitLoss: number; // Ganancia/pérdida total
  profitLossPercent: number; // Ganancia/pérdida porcentual
  positions: Position[]; // Posiciones en el portafolio
}