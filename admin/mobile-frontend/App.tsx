import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import Colors from './src/constants/colors';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { AdminBooksScreen } from './src/screens/AdminBooksScreen';
import { AdminAlertsScreen } from './src/screens/AdminAlertsScreen';
import { AdminStudentsScreen } from './src/screens/AdminStudentsScreen';
import { AdminSettingsScreen } from './src/screens/AdminSettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textMuted,
            tabBarStyle: {
              backgroundColor: Colors.white,
              borderTopColor: Colors.border,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '700',
            },
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomColor: Colors.border,
              borderBottomWidth: 1,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTitleStyle: {
              fontSize: 17,
              fontWeight: '800',
              color: Colors.textPrimary,
            },
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={AdminDashboardScreen}
            options={{
              title: 'Vidya Admin',
              tabBarLabel: 'Overview',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="dashboard" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Books"
            component={AdminBooksScreen}
            options={{
              title: 'Study Materials & Books',
              tabBarLabel: 'Books',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="menu-book" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Alerts"
            component={AdminAlertsScreen}
            options={{
              title: 'Student Alerts & Broadcasts',
              tabBarLabel: 'Alerts',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="campaign" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Students"
            component={AdminStudentsScreen}
            options={{
              title: 'Enrolled Students',
              tabBarLabel: 'Students',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="people" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={AdminSettingsScreen}
            options={{
              title: 'Admin Settings',
              tabBarLabel: 'Settings',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="settings" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceSoft,
  },
});