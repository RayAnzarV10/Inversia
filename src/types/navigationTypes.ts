import { NavigatorScreenParams } from '@react-navigation/native';

// Definición de los tipos de parámetros para cada pantalla
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  ItemDetail: { itemId: number; portafolioId?: string; activoIdExterno?: string };
  EditItem: { itemId: number };
  AddItem: { portafolioId?: string };
  CreatePortfolio: undefined;
};

export type MainTabParamList = {
  Home: { refresh?: number };
  CreatePortfolio: undefined;
  Profile: undefined;
};

// Declarar el módulo para aumentar los tipos
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}