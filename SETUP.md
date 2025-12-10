# CityZen - Cross-Platform Mobile & Web App

A React-based application that runs on both mobile and web using React Native Web.
# CityZen — Setup

This file contains step-by-step setup instructions for running CityZen on web and native mobile (via Expo).

## Prerequisites
- Node.js 16+ and npm or yarn
- For native device/emulator builds: Android SDK / Xcode (or use Expo to avoid native setup)

## Install dependencies

```powershell
npm install
```

If you plan to run native features or use AsyncStorage on mobile, install native package for storage (optional):

```powershell
npm install @react-native-async-storage/async-storage
```

## Recommended: Run with Expo (web + native)

Start Metro + Dev tools with Expo:

```powershell
npm run start
# For web only
npm run web
# For native device/emulator
npm run android
npm run ios
```

Notes:
- Ensure the `assets/` icons referenced in `app.json` exist (or update `app.json`).
- Expo web uses `react-native-web` under the hood; we've kept a Vite workflow for an alternative web dev loop.

## Alternative: Vite web workflow

If you prefer Vite for web development, use the existing scripts:

```powershell
npm run dev
npm run build:web
npm run preview
```

## Important project initialization for navigation (web)

Add these lines at the very top of `index.jsx` before any other imports if not already present:

```js
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();
```

## Porting notes
- Many components under `src/components/ui/` are web-first and use DOM elements; they will not run on native without change.
- Options:
  - Port components to React Native primitives (`View`, `Text`, `Pressable`) and StyleSheet.
  - Add platform-specific implementations (`Component.web.jsx` / `Component.native.jsx`).
  - Use a cross-platform UI kit that supports RN + web.

## Next steps
1. Create `src/screens/` and replace placeholders in `App.jsx` with real screen components.
2. Port or provide platform-specific UI components for mobile compatibility.
3. Verify native builds (requires native toolchain) or continue using Expo for mobile iteration.

## Troubleshooting
- If package install fails due to native module compilation, try `npm install --legacy-peer-deps` or use Expo-managed workflow.

## License
MIT
```
