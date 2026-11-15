import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.saituno.app',
  appName: 'Saituno',
  webDir: 'dist/saituno/browser',
  loggingBehavior: 'none',
  android: {
    allowMixedContent: false
  }
};

export default config;
