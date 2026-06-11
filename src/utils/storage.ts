import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    HAS_COMPLETED_ONBOARDING: 'has_completed_onboarding',
    HAS_LINKED_WHATSAPP: 'has_linked_whatsapp',
    LAST_SYNC_TIME: 'last_sync_time',
    APP_THEME: 'app_theme',
};

export const storage = {
    // Onboarding
    setHasCompletedOnboarding: async (value: boolean): Promise<void> => {
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, JSON.stringify(value));
    },
    
    getHasCompletedOnboarding: async (): Promise<boolean> => {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING);
        return value ? JSON.parse(value) : false;
    },
    
    // WhatsApp linking
    setHasLinkedWhatsApp: async (value: boolean): Promise<void> => {
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_LINKED_WHATSAPP, JSON.stringify(value));
    },
    
    getHasLinkedWhatsApp: async (): Promise<boolean> => {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_LINKED_WHATSAPP);
        return value ? JSON.parse(value) : false;
    },
    
    // Last sync time
    setLastSyncTime: async (timestamp: number): Promise<void> => {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, timestamp.toString());
    },
    
    getLastSyncTime: async (): Promise<number | null> => {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
        return value ? parseInt(value, 10) : null;
    },
    
    // Theme
    setAppTheme: async (theme: 'light' | 'dark'): Promise<void> => {
        await AsyncStorage.setItem(STORAGE_KEYS.APP_THEME, theme);
    },
    
    getAppTheme: async (): Promise<'light' | 'dark'> => {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.APP_THEME);
        return (value as 'light' | 'dark') || 'light';
    },
    
    // Clear all app data (for reset)
    clearAll: async (): Promise<void> => {
        const keys = Object.values(STORAGE_KEYS);
        await AsyncStorage.multiRemove(keys);
    },
};