# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Meteor 3.4 full-stack mobile application with React 18, targeting iOS and Android via Cordova. Uses MongoDB for data storage, Rspack for bundling, Tailwind CSS 4 for styling, and Konsta UI for native-looking mobile components.

## Commands

```bash
# Start development server (browser, port 3000)
meteor run

# Run on iOS simulator
meteor run ios

# Run on Android emulator
meteor run android --mobile-server http://10.0.2.2:3000

# Run tests once
meteor test --once --driver-package meteortesting:mocha

# Run tests in watch mode (full app)
TEST_WATCH=1 meteor test --full-app --driver-package meteortesting:mocha

# Bundle visualization
meteor --production --extra-packages bundle-visualizer
```

## Architecture

**Meteor pub/sub data flow:**
```
MongoDB → Server Publications → DDP protocol → Client Subscriptions → React Hooks → UI
```

**Directory structure:**
- **`client/`** — Client entry point (`main.jsx` bootstraps React into `#react-target`)
- **`server/`** — Server entry point (publications, seed data)
- **`imports/api/`** — MongoDB collection definitions (isomorphic, shared between client/server)
- **`imports/ui/`** — React components
- **`imports/ui/hooks/`** — Custom React hooks (e.g., `useDarkMode.js`)
- **`mobile-config.js`** — Cordova configuration (timeouts, preferences)

**Key patterns:**
- Collections are defined in `imports/api/` and imported on both client and server
- Server exposes data via `Meteor.publish()`, client subscribes via `useSubscribe()` hook from `react-meteor-data`
- Reactive queries use `useFind()` hook from `react-meteor-data`
- MongoDB async API: use `insertAsync`, `updateAsync`, `removeAsync`, `countAsync` (not the sync variants)
- Rspack handles bundling (configured in `rspack.config.js`); CSS goes through PostCSS + Tailwind
- The `.meteorignore` file excludes `client/main.css` from Meteor's default CSS handling since Rspack processes it

## Cordova / Mobile

- **Platforms:** iOS, Android (defined in `.meteor/platforms`)
- **Plugins:** `cordova-plugin-inappbrowser` for opening external links
- **Config:** `mobile-config.js` sets timeout preferences (LoadUrlTimeoutValue, WebAppStartupTimeout)

## UI / Konsta UI

The app uses **Konsta UI** for native-looking mobile components with automatic platform theming.

- `KonstaApp` wraps the entire app with a `theme` prop (auto-detected: iOS on Apple devices, Material elsewhere)
- Components used: `Page`, `Navbar`, `Block`, `BlockTitle`, `Button`, `List`, `ListItem`, `Icon`, `Link`, `Toggle`, `Preloader`
- **Dual icon strategy:** `framework7-icons/react` for iOS theme, `react-icons/md` (Material Design) for Android — passed to Konsta's `Icon` component via `ios` and `material` props
- Dark mode is managed via a custom `useDarkMode` hook

**Meteor packages** are managed in `.meteor/packages` (not npm). Use `meteor add/remove <package>` to manage them.
