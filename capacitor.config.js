const { defineConfig } = require('@meteorjs/capacitor');

module.exports = defineConfig(() => ({
  appId: 'com.idq61wlm3rjzi.weftp5pcclxr',
  appName: 'welcome-meteor-cordova',
  ios: { contentInset: 'always' },
  plugins: {
    CapacitorMeteorWebApp: {
      startupTimeout: 60000,
    },
  },
}));
