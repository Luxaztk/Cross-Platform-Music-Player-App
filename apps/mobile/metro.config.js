// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add your monorepo packages to the resolver
// config.projectRoot = __dirname;
// config.watchFolders = [
//   path.resolve(__dirname, 'apps/mobile'),
//   // Add other packages if needed
// ];

module.exports = config;
