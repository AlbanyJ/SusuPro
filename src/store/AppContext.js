// ============================================================
// FILE 2: src/store/AppContext.js
// WHAT:   Global state for the entire app.
//         Think of this as the app's "memory".
//         Every screen can read AND update data from here.
// HOW:    Wrap your app in <AppProvider> (done in App.js).
//         Then use: const { state, dispatch } = useApp();
// ============================================================

import React, { createContext, useContext, useReducer } from 'react';

// ── Initial data (replace with real Firebase data later) ──
const initialState = {
  // Logged-in user (null = not logged in)
  currentUser: null,

  // All system users (admin + collectors)
  users: [
    {
      id: 'u1',
      name: 'Kwame Asante',
      email: 'admin@susu.gh',
      password: 'admin123',   // In production: bcrypt hash stored in Firebase Auth
      role: 'admin',
      avatar: 'KA',
    },
    {
      id: 'u2',
      name: 'Ama Boateng',
      email: 'ama@susu.gh',
      password: 'collector1',
      role: 'collector',
      avatar: 'AB',
    },
  ],

  // Customer list
  customers: [
    { id: 'c1', name: 'Akosua Mensah',   phone: '0244123456', idNo: 'GHA-2341', balance: 4200,  active: true,  joinDate: '2024-01-15', avatar: 'AM' },
    { id: 'c2', name: 'Kofi Owusu',      phone: '0551987654', idNo: 'GHA-8821', balance: 7800,  active: true,  joinDate: '2024-02-03', avatar: 'KO' },
    { id: 'c3', name: 'Efua Darko',      phone: '0208765432', idNo: '',         balance: 1500,  active: true,  joinDate: '2024-03-10', avatar: 'ED' },
    { id: 'c4', name: 'Yaw Asiedu',      phone: '0277654321', idNo: 'GHA-4490', balance: 12300, active: true,  joinDate: '2023-11-20', avatar: 'YA' },
    { id: 'c5', name: 'Adwoa Frimpong',  phone: '0244000111', idNo: '',         balance: 0,     active: false, joinDate: '2024-01-05', avatar: 'AF' },
  ],

  // All transactions
  transactions: [
    { id: 't1', customerId: 'c1', type: 'contribution', amount: 200,  date: '2025-03-28', time: '08:42', collectorId: 'u2', notes: 'Daily savings', status: 'completed' },
    { id: 't2', customerId: 'c2', type: 'contribution', amount: 500,  date: '2025-03-28', time: '09:10', collectorId: 'u2', notes: '',             status: 'completed' },
    { id: 't3', customerId: 'c4', type: 'withdrawal',   amount: 3000, date: '2025-03-27', time: '14:30', collectorId: 'u1', notes: 'Admin approved',status: 'completed' },
    { id: 't4', customerId: 'c3', type: 'contribution', amount: 100,  date: '2025-03-28', time: '10:15', collectorId: 'u2', notes: '',             status: 'completed' },
    { id: 't5', customerId: 'c1', type: 'contribution', amount: 200,  date: '2025-03-27', time: '08:55', collectorId: 'u2', notes: 'Daily savings', status: 'completed' },
    { id: 't6', customerId: 'c2', type: 'contribution', amount: 500,  date: '2025-03-26', time: '09:05', collectorId: 'u2', notes: '',             status: 'completed' },
    { id: 't7', customerId: 'c4', type: 'contribution', amount: 1000, date: '2025-03-26', time: '11:20', collectorId: 'u1', notes: 'Weekly bulk',  status: 'completed' },
  ],

  // Audit log — every action is recorded here
  auditLog: [],

  // Offline queue — transactions saved when no internet
  offlineQueue: [],

  // Network status
  isOnline: true,
};

// ── Action types (what can change in state) ──
export const ACTIONS = {
  LOGIN:              'LOGIN',
  LOGOUT:             'LOGOUT',
  ADD_CUSTOMER:       'ADD_CUSTOMER',
  UPDATE_CUSTOMER:    'UPDATE_CUSTOMER',
  DELETE_CUSTOMER:    'DELETE_CUSTOMER',
  ADD_TRANSACTION:    'ADD_TRANSACTION',
  ADD_TO_AUDIT:       'ADD_TO_AUDIT',
  ADD_TO_QUEUE:       'ADD_TO_QUEUE',
  CLEAR_QUEUE:        'CLEAR_QUEUE',
  SET_ONLINE:         'SET_ONLINE',
};

// ── Reducer — handles every state change ──
function reducer(state, action) {
  switch (action.type) {

    case ACTIONS.LOGIN:
      return { ...state, currentUser: action.payload };

    case ACTIONS.LOGOUT:
      return { ...state, currentUser: null };

    case ACTIONS.ADD_CUSTOMER:
      return { ...state, customers: [...state.customers, action.payload] };

    case ACTIONS.UPDATE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };

    case ACTIONS.DELETE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload),
      };

    case ACTIONS.ADD_TRANSACTION: {
      const { transaction, balanceChange } = action.payload;
      return {
        ...state,
        transactions: [transaction, ...state.transactions],
        // Update the customer's balance at the same time
        customers: state.customers.map(c =>
          c.id === transaction.customerId
            ? { ...c, balance: c.balance + balanceChange }
            : c
        ),
      };
    }

    case ACTIONS.ADD_TO_AUDIT:
      return { ...state, auditLog: [...state.auditLog, action.payload] };

    case ACTIONS.ADD_TO_QUEUE:
      return { ...state, offlineQueue: [...state.offlineQueue, action.payload] };

    case ACTIONS.CLEAR_QUEUE:
      return { ...state, offlineQueue: [] };

    case ACTIONS.SET_ONLINE:
      return { ...state, isOnline: action.payload };

    default:
      return state;
  }
}

// ── Create context ──
const AppContext = createContext(null);

// ── Provider component — wrap App.js with this ──
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Custom hook — use this in every screen ──
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
}