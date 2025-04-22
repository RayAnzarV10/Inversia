import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation';
import { PortfolioProvider } from 'contexts/PortfolioContext';

export default function App() {
  return (
    <PortfolioProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </SafeAreaProvider>
    </PortfolioProvider>
  );
}