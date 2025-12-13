import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.cozinhaaolucro.app',
    appName: 'Cozinha ao Lucro',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
