import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FlashMessage from 'react-native-flash-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NetworkProvider } from 'react-native-offline';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import store
import { store } from './src/store/store';

// Import screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import AssignmentsScreen from './src/screens/Assignments/AssignmentsScreen';
import GradingScreen from './src/screens/Grading/GradingScreen';
import CameraGradingScreen from './src/screens/Grading/CameraGradingScreen';
import StudentsScreen from './src/screens/Students/StudentsScreen';
import AnalyticsScreen from './src/screens/Analytics/AnalyticsScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import AssignmentDetailScreen from './src/screens/Assignments/AssignmentDetailScreen';
import SubmissionDetailScreen from './src/screens/Grading/SubmissionDetailScreen';

// Import auth context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Custom theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976d2',
    primaryContainer: '#e3f2fd',
    secondary: '#dc004e',
    secondaryContainer: '#fce4ec',
    tertiary: '#2e7d32',
    tertiaryContainer: '#e8f5e8',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    background: '#fafafa',
    error: '#d32f2f',
    errorContainer: '#ffebee',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onTertiary: '#ffffff',
    onSurface: '#212121',
    onBackground: '#212121',
    outline: '#e0e0e0',
  },
};

// Assignment Stack Navigator
function AssignmentStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="AssignmentsList" 
        component={AssignmentsScreen}
        options={{ title: 'Assignments' }}
      />
      <Stack.Screen 
        name="AssignmentDetail" 
        component={AssignmentDetailScreen}
        options={{ title: 'Assignment Details' }}
      />
      <Stack.Screen 
        name="GradingScreen" 
        component={GradingScreen}
        options={{ title: 'Grade Submissions' }}
      />
      <Stack.Screen 
        name="SubmissionDetail" 
        component={SubmissionDetailScreen}
        options={{ title: 'Grade Submission' }}
      />
      <Stack.Screen 
        name="CameraGrading" 
        component={CameraGradingScreen}
        options={{ title: 'Camera Grading' }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Assignments') {
            iconName = 'assignment';
          } else if (route.name === 'Students') {
            iconName = 'people';
          } else if (route.name === 'Analytics') {
            iconName = 'analytics';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          paddingVertical: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Assignments" 
        component={AssignmentStackNavigator}
        options={{ tabBarLabel: 'Assignments' }}
      />
      <Tab.Screen 
        name="Students" 
        component={StudentsScreen}
        options={{ tabBarLabel: 'Students' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ tabBarLabel: 'Analytics' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator
function AuthStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Main App Component
function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <NetworkProvider>
            <AuthProvider>
              <PaperProvider theme={theme}>
                <StatusBar style="auto" />
                <AppNavigator />
                <FlashMessage position="top" />
              </PaperProvider>
            </AuthProvider>
          </NetworkProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}