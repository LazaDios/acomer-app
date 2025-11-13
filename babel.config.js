module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Este plugin DEBE ser el último en la lista
      'react-native-reanimated/plugin', 
    ],
  };
};