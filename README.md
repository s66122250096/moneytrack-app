# MoneyTrack

MoneyTrack is a mobile personal finance tracker built with **React Native (Expo)** and **Firebase**. It lets users log in, record income and expenses, organize spending by category, set budgets, and view reports — all synced per-account to Firestore.

## Features

- 🔐 **Authentication** — email/password sign up and login via Firebase Auth
- 📊 **Dashboard** — at-a-glance overview of income, expenses, and balance
- ➕ **Add Transaction** — quickly log a new income or expense entry
- 🕒 **Transaction History** — browse and review past transactions
- 📁 **Categories** — create and manage custom income/expense categories
- 💰 **Budgets** — set and track spending budgets
- 📈 **Reports** — visual breakdown of spending over time
- 👤 **Profile** — manage account details

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) (React Native 0.74, React 18) |
| Navigation | React Navigation (bottom tabs + native stack) |
| Backend / Auth / DB | Firebase Authentication & Cloud Firestore |
| Local storage | `@react-native-async-storage/async-storage` |
| Icons | `lucide-react-native` |
| Media | `expo-image-picker` |

## Project Structure

```
moneytrack-app/
├── App.js                     # App entry: providers + navigation container
├── index.js                   # Expo root component registration
├── app.json                   # Expo app config
├── firestore.rules            # Firestore security rules (per-user access)
├── assets/                    # App icons and splash images
└── src/
    ├── context/
    │   └── AuthContext.js     # Auth state (current user, loading) via React Context
    ├── firebase/
    │   ├── config.js          # Firebase app/auth/firestore initialization
    │   ├── authService.js     # Sign up / login / logout helpers
    │   ├── transactionService.js  # CRUD for income/expense transactions
    │   ├── categoryService.js     # CRUD for categories
    │   └── budgetService.js       # CRUD for budgets
    ├── navigation/
    │   ├── RootNavigator.js       # Switches between auth flow and main app
    │   └── MainTabNavigator.js    # Bottom tab navigation (Dashboard, History, Add, Report, Budget, Profile)
    └── screens/
        ├── LoginScreen.js
        ├── RegisterScreen.js
        ├── DashboardScreen.js
        ├── AddTransactionScreen.js
        ├── TransactionHistoryScreen.js
        ├── ReportScreen.js
        ├── BudgetScreen.js
        ├── CategoryScreen.js
        └── ProfileScreen.js
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm
- [Expo Go](https://expo.dev/client) app on your phone, and/or Android Studio / Xcode for emulators
- A [Firebase](https://firebase.google.com/) project with **Authentication** (Email/Password) and **Cloud Firestore** enabled

### 1. Clone the repository

```bash
git clone https://github.com/s66122250096/moneytrack-app.git
cd moneytrack-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project, enable **Email/Password** sign-in and **Cloud Firestore**, then add your web app config to `src/firebase/config.js`, e.g.:

```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

> ⚠️ Avoid committing real Firebase keys to a public repository — use environment variables or a `.env` file that's excluded via `.gitignore`.

Deploy the included security rules so each user can only read/write their own data:

```bash
firebase deploy --only firestore:rules
```

(or paste the contents of `firestore.rules` into **Firebase Console → Firestore Database → Rules**).

### 4. Run the app

```bash
npm start        # opens Expo Dev Tools / QR code
npm run android   # run on Android emulator/device
npm run ios       # run on iOS simulator/device
```

Scan the QR code with the **Expo Go** app to run it on your own phone.

## Data Model (Firestore)

```
users/{userId}
└── transactions/{transactionId}
```

Access is restricted so a signed-in user can only read/write documents under their own `users/{userId}` path (see `firestore.rules`).

## Roadmap Ideas

- [ ] Export reports (CSV/PDF)
- [ ] Recurring transactions
- [ ] Multi-currency support
- [ ] Push notifications for budget limits
