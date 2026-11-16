# Cordova to Capacitor transition

The `main` branch remains a Cordova example. The separate `capacitor-migration`
branch is the destination for this experimental transition, preserving the same
application behavior so the native integrations can be compared.

The Cordova baseline is [PR #3](https://github.com/CloudByGalaxy/welcome-meteor-cordova/pull/3)
at `b6f4f8bb614e1c3b53e4d5c2941791736a5a9015`, including its Meteor 3.6.1 upgrade
and two Maestro flows. Keep that baseline pinned when examining the migration
diff. Bring shared application fixes and tests from Cordova into the transition
branch as maintenance continues.

## Experimental Meteor dependency

This branch requires the Meteor checkout from
[meteor/meteor#14633](https://github.com/meteor/meteor/pull/14633), with matching
local `@meteorjs/capacitor` and `@meteorjs/rspack` packages. Stock Meteor 3.6.1
does not provide this integration merely because the app installs Capacitor npm
dependencies.

The local validation used Meteor integration revision
`af156585073111e45a86cb65fd555d2739bed69d` plus a pending native-plugin follow-up
that reads `plugins.CapacitorMeteorWebApp.startupTimeout` on Android and iOS.
That follow-up remains local and unpublished. Preserving the original
60000-millisecond startup deadline is blocked until it is available in the
selected Meteor runtime. The older native runtime defaults to 30000 milliseconds
and does not consume the new setting. This branch is a review candidate, and
the README's local setup must use the matching runtime.

## Preserved behavior and configuration

| Cordova baseline | Capacitor transition |
|---|---|
| React, Konsta and Tailwind UI | Same components, styling and counter behavior; no application source rewrite. |
| Mongo collection and `links` publication | Same server/data code and subscription. Native smoke still waits for a published link. |
| InAppBrowser 6.0.0 in `.meteor/cordova-plugins` | The same plugin is installed through npm. `Info.jsx` retains its `_system` call and browser fallback. |
| Generated native ID | Explicit `appId: 'com.idq61wlm3rjzi.weftp5pcclxr'`; `.meteor/.id` is unchanged. |
| Android version `0.0.1`, code `1` | Preserved in `android/app/build.gradle`. |
| iOS marketing/build versions `0.0.1` | Preserved in the maintained Xcode project. |
| `WebAppStartupTimeout = 60000` | Explicit `plugins.CapacitorMeteorWebApp.startupTimeout: 60000`, requiring the pending native follow-up above. |
| `LoadUrlTimeoutValue = 60000` | Retained as historical Cordova configuration. It has no automatic mapping to this bundled WebView startup. |
| Generated Cordova native project | Maintained `android/` and `ios/` source; generated assets, plugin wrappers and caches are ignored. |
| Original Mocha and Maestro tests | Preserved. Additional external-browser/return and real HCP checks run separately. |

The original `mobile-config.js`, `.meteor/cordova-plugins` and platform entries
remain available as a Cordova reference. Capacitor does not translate the mobile
configuration or install plugins from that list. Its plugin discovery uses npm.
Default native icons and splash assets are used; there were no custom native
branding inputs to port.

The `.meteor/` metadata in this branch was adapted using the checkout's existing
`meteor create --from` setup before adding `capacitor`. The `none` release and
source package selections describe this experimental checkout setup. They are
not a general instruction to remove an existing app's package constraints.

## Local validation recorded on 2026-11-16

These are executed local results, not a claim of GitHub CI coverage. The native
checks used an Android API 34 emulator and an iOS 26.2 Simulator. The prepared
toolchain used Node 22.14.0, Meteor's Node 26.13.0, JDK 21.0.13, Android SDK 36,
Xcode 26.3 and Maestro 2.12.1.

| Check | Result |
|---|---|
| Cordova baseline's two Maestro flows | Pass separately on Android and iOS. |
| Same two flows after migration | Pass separately on Android and iOS, with the original assertions and wait bounds. |
| External browser and return | Pass on both platforms: open the docs URL externally, return without stopping the app, retain counter state and increment again. |
| Real HCP | Pass on both platforms: observe a changed server manifest, activate the downloaded title change without reinstalling, cold-launch it, exercise the counter, restore the source and verify the original screen. |
| Original Mocha tests | Two server and two browser cases pass, with zero failures. The local run supplied the existing checkout's Playwright driver. |
| Browser smoke | UI, publication links, counter, theme and web fallback pass. The web fallback call is intercepted; native browser behavior has its own flow. |
| System UI | Light/dark screenshots inspected on both targets. Controls and system text remain visible around status and gesture areas. |
| Debug artifact and identity | Android APK signature verification passes. Both native apps report the intended ID and version settings. |

The companion Meteor follow-up also passed 10 JavaScript tests and five native
lifecycle tests on each platform. These are tests of that local Meteor change,
separate from the example's own flows.

Run Meteor workflow modes sequentially in the same app copy. A concurrent Mocha
command overwrote a generated native client entry during the initial attempt.
Restarting the native workflow restored it. The first counter check also raced
an initial update; the settled app passed the unchanged suite. Establish native
and DDP readiness before checking transient counter state. Separate source
copies are needed for concurrent Meteor build/test commands.

Use a backend URL reachable by the selected platform. An initial iOS attempt
received an update advertising Android's `10.0.2.2` address; rerunning the native
Cordova workflow with a shared LAN address passed both unchanged flows. No
assertion was weakened or test timeout increased to recover these runs.

## Reproduce the application checks

Follow the [README setup](README.md#getting-started), including both local npm
links and the required Meteor follow-up. Leave one native Meteor command serving
the backend and run Maestro from a second terminal. Complete the test device's
initial browser setup before the external-browser flow.

```bash
npm run test:native:smoke -- --platform android --device emulator-5554
npm run test:native -- --platform android --device emulator-5554
npm run test:native:migration -- --platform android --device emulator-5554
npm run test:native:hcp -- --platform android --device emulator-5554 --server http://localhost:3000
```

Run the equivalent commands separately with `--platform ios` and the selected
simulator UDID. The HCP helper's `--server` URL is reached from the host running
the test; the app's configured mobile URL must be reachable from the device.
HCP reports go to `.native-test-results/`. Its temporary source change is
restored, and unexpected concurrent source edits are preserved and reported.

## Remaining validation

- Signed release AAB and IPA gates remain open in the Meteor integration.
- A successor installed over a distributed Cordova app still needs validation
  of signing continuity, identity, permissions and persistent state. Fresh
  installation and this stateless sample do not establish those guarantees.
- Authentication, origin-bound storage, offline records, keychain data and
  entitlements need app-specific migration checks when present.
- Android 16 edge-to-edge behavior was not exercised on the API 34 emulator.
- The two-brand example is separate follow-up work.
