import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDev = process.env.APP_VARIANT === 'development' || process.env.EAS_BUILD_PROFILE === 'development';

  return {
    ...config,
    name: isDev ? 'MeloVista (Dev)' : 'MeloVista',
    slug: 'melovista',
    scheme: isDev ? 'melovista-dev' : 'melovista',
    android: {
      ...config.android,
      package: isDev ? 'com.split_dance.melovista.dev' : 'com.split_dance.melovista',
    },
  };
};
