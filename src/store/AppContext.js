// ============================================================
// FILE 2: src/store/AppContext.js
// WHAT:   Global state for the entire app.
//         Think of this as the app's "memory".
//         Every screen can read AND update data from here.
// HOW:    Wrap your app in <AppProvider> (done in App.js).
//         Then use: const { state, dispatch } = useApp();
//
// Data lives in Firestore. This file holds no seed/mock data —
// customers and transactions are loaded via loadAppData() once
// a user is authenticated (see App.js), and every write goes
// through src/services/*.js so Firestore stays the source of
// truth.
// ============================================================

import React, { createContext, useContext, useReducer } from 'react';
import { fetchCustomers } from '../services/customerService';
import { fetchTransactions } from '../services/transactionService';

const initialState = {
  // Logged-in user profile (null = not logged in)
  currentUser: null,

  // True while we're checking for an existing Firebase session
  // on app launch. Prevents flashing the login screen before we
  // know whether the user is already signed in.
  authLoading: true,

  // Customer list (loaded from Firestore)
  customers: [],

  // All transactions (loaded from Firestore)
  transactions: [],

  // True while customers/transactions are being fetched
  dataLoading: false,
  dataError: null,

  // Audit log — every action is recorded here
  auditLog: [],

  // Offline queue mirror — transactions saved locally when there's
  // no internet (source of truth is the SQLite table; this is
  // just what the UI shows, e.g. "3 pending sync").
  offlineQueue: [],

  // Network status
  isOnline: true,
};

// ── Action types (what can change in state) ──
export const ACTIONS = {
  SET_AUTH_LOADING:   'SET_AUTH_LOADING',
  LOGIN:              'LOGIN',
  LOGOUT:             'LOGOUT',

  SET_DATA_LOADING:   'SET_DATA_LOADING',
  SET_DATA_ERROR:     'SET_DATA_ERROR',
  SET_CUSTOMERS:      'SET_CUSTOMERS',
  SET_TRANSACTIONS:   'SET_TRANSACTIONS',

  ADD_CUSTOMER:       'ADD_CUSTOMER',
  UPDATE_CUSTOMER:    'UPDATE_CUSTOMER',
  DELETE_CUSTOMER:    'DELETE_CUSTOMER',
  ADD_TRANSACTION:    'ADD_TRANSACTION',
  ADD_TO_AUDIT:       'ADD_TO_AUDIT',
  ADD_TO_QUEUE:       'ADD_TO_QUEUE',
  REMOVE_FROM_QUEUE:  'REMOVE_FROM_QUEUE',
  CLEAR_QUEUE:        'CLEAR_QUEUE',
  SET_ONLINE:         'SET_ONLINE',
};

// ── Reducer — handles every state change ──
function reducer(state, action) {
  switch (action.type) {

    case ACTIONS.SET_AUTH_LOADING:
      return { ...state, authLoading: action.payload };

    case ACTIONS.LOGIN:
      return { ...state, currentUser: action.payload };

    case ACTIONS.LOGOUT:
      return {
        ...state,
        currentUser: null,
        customers: [],
        transactions: [],
        auditLog: [],
        offlineQueue: [],
      };

    case ACTIONS.SET_DATA_LOADING:
      return { ...state, dataLoading: action.payload };

    case ACTIONS.SET_DATA_ERROR:
      return { ...state, dataError: action.payload };

    case ACTIONS.SET_CUSTOMERS:
      return { ...state, customers: action.payload };

    case ACTIONS.SET_TRANSACTIONS:
      return { ...state, transactions: action.payload };

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

    case ACTIONS.REMOVE_FROM_QUEUE:
      return {
        ...state,
        offlineQueue: state.offlineQueue.filter(t => t.id !== action.payload),
      };

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

// ── Load customers + transactions from Firestore ──────────────
// Call this once a user is authenticated (see App.js). Screens
// never need to call the Firestore services directly for reads —
// they just read state.customers / state.transactions.
export async function loadAppData(dispatch) {
  dispatch({ type: ACTIONS.SET_DATA_LOADING, payload: true });
  dispatch({ type: ACTIONS.SET_DATA_ERROR, payload: null });

  const [customersResult, transactionsResult] = await Promise.all([
    fetchCustomers(),
    fetchTransactions(),
  ]);

  if (customersResult.success) {
    dispatch({ type: ACTIONS.SET_CUSTOMERS, payload: customersResult.data });
  }
  if (transactionsResult.success) {
    dispatch({ type: ACTIONS.SET_TRANSACTIONS, payload: transactionsResult.data });
  }

  const error = !customersResult.success
    ? customersResult.error
    : !transactionsResult.success
      ? transactionsResult.error
      : null;
  dispatch({ type: ACTIONS.SET_DATA_ERROR, payload: error });
  dispatch({ type: ACTIONS.SET_DATA_LOADING, payload: false });
}
