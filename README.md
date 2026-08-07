# SusuPro

A daily-savings (susu) collection app for Expo/React Native. Admins manage
customers and team members; collectors record contributions and
withdrawals in the field, online or offline.

## Stack

- **Frontend:** Expo / React Native
- **Backend:** Firebase Authentication + Firestore
- **Offline:** SQLite (`expo-sqlite`) queue, synced automatically when the
  network returns

## First-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com) and
   create a project.
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → create a database (any region; start in
   production mode — the rules in this repo lock it down).
4. **Project settings** → Your apps → add a **Web** app, and copy the
   config object it gives you.

### 3. Configure the app

```bash
cp .env.example .env
```

Fill in the six `EXPO_PUBLIC_FIREBASE_*` values from the config you copied
in step 2. These are inlined into the app bundle by Expo — they are not
secret (access is controlled by `firestore.rules` and Firebase Auth, not
by hiding this config).

### 4. Deploy the security rules and indexes

```bash
npm install -g firebase-tools   # if you don't already have it
firebase login
firebase init firestore         # point it at the project you just created
firebase deploy --only firestore:rules,firestore:indexes
```

This deploys `firestore.rules` (role-based read/write access) and
`firestore.indexes.json` (a composite index that
`fetchCustomerTransactions` needs — without it, opening a customer's
transaction history will fail with a Firestore "index required" error).

### 5. Bootstrap the first admin account

The app has no self-signup — admins add every other account from inside
the app (Settings → Team Members). That means the *very first* admin has
to be created by hand, once:

1. **Authentication** tab in the Firebase Console → Add user → enter an
   email and password.
2. Copy the new user's **UID**.
3. **Firestore Database** → start collection `users` → document ID =
   that UID → add fields:
   - `name` (string)
   - `email` (string, same as the auth account)
   - `role` (string) = `admin`
   - `avatar` (string) = e.g. initials like `KA`

Sign in with that email/password in the app, and use **Settings → Team
Members → + Add** to create everyone else (admins or collectors) going
forward — no more manual Firestore edits needed.

### 6. Run it

```bash
npx expo start
```

## How data flows

- Reads: `AppContext`'s `loadAppData()` fetches customers + transactions
  from Firestore once a session is confirmed, and screens pull-to-refresh
  to re-fetch.
- Writes: every add/update goes through `src/services/*.js` straight to
  Firestore. `recordTransaction` uses a Firestore `runTransaction` so a
  transaction record and the customer's balance update always succeed or
  fail together.
- Offline: if a contribution/withdrawal is recorded with no network, it's
  written to a local SQLite queue and shown with a "Pending Sync" badge.
  `syncService.js` watches connectivity and replays the queue against
  Firestore as soon as the device is back online, then refreshes app
  state from the server.

## Known limitations

- Firestore reads require connectivity — only *writes* work offline
  (via the SQLite queue). True offline reads would need
  `@react-native-firebase` instead of the Firebase JS SDK.
- No password-reset flow yet (`sendPasswordResetEmail` would be the
  natural addition to `authService.js`).
- The `audit_log` Firestore collection and its security rules exist, but
  nothing writes to it yet — worth wiring up if you need a compliance
  trail of who did what.
