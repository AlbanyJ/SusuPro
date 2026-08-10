// ============================================================
// FILE 22: src/navigation/AppNavigator.js
// WHAT:   Controls which screen appears when.
//         - If not logged in → show Login screen
//         - If logged in    → show the bottom tab bar
//         - Admin gets an extra "Reports" tab
// ============================================================

import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';

import LoginScreen        from '../screens/LoginScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import CustomersScreen    from '../screens/CustomersScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ReportsScreen      from '../screens/ReportsScreen';
import SettingsScreen     from '../screens/SettingsScreen';

import { Colors, Typography } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Tab icons ────────────────────────────────────────────────
const TAB_ICONS = {
  Dashboard:    { focused: 'home',              unfocused: 'home-outline' },
  Customers:    { focused: 'people',            unfocused: 'people-outline' },
  Transactions: { focused: 'swap-horizontal',   unfocused: 'swap-horizontal-outline' },
  Reports:      { focused: 'bar-chart',         unfocused: 'bar-chart-outline' },
  Account:      { focused: 'settings',          unfocused: 'settings-outline' },
};

// ── Main tab bar (shown when logged in) ───────────────────────
function MainTabs() {
  const { state } = useApp();
  const isAdmin = state.currentUser?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.gray100,
          borderTopWidth: 1,
          height: 76,
          paddingTop: 10,
          paddingBottom: 14,
        },
        tabBarIcon: ({ focused }) => (
          <View style={[
            { width: 40, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
            focused && { backgroundColor: Colors.green50 },
          ]}>
            <Ionicons
              name={focused ? TAB_ICONS[route.name].focused : TAB_ICONS[route.name].unfocused}
              size={20}
              color={focused ? Colors.green600 : Colors.gray400}
            />
          </View>
        ),
        tabBarLabel: ({ focused }) => (
          <Text style={{
            fontFamily: Typography.bold,
            fontSize: 10,
            color: focused ? Colors.green600 : Colors.gray400,
            letterSpacing: 0.4,
          }}>
            {route.name}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard"    component={DashboardScreen} />
      <Tab.Screen name="Customers"    component={CustomersScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      {/* Reports tab is only visible to admin */}
      {isAdmin && <Tab.Screen name="Reports" component={ReportsScreen} />}
      <Tab.Screen name="Account"      component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ── Root navigator ────────────────────────────────────────────
export default function AppNavigator() {
  const { state } = useApp();
  const isLoggedIn = !!state.currentUser;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}