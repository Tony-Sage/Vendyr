import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

// Rename the imported module to avoid conflict with the class name
const { WhatsAppMonitor: NativeWhatsAppMonitor } = NativeModules;

interface ContactInfo {
    name: string;
    phoneNumber: string;
}

class WhatsAppMonitorModule {
    private eventEmitter: NativeEventEmitter | null = null;
    private listeners: { [key: string]: any } = {};
    onContactsSelected: ((contacts: ContactInfo[]) => void) | null = null;

    constructor() {
        if (Platform.OS === 'android' && NativeWhatsAppMonitor) {
            this.eventEmitter = new NativeEventEmitter(NativeWhatsAppMonitor);
            this.setupListeners();
        }
    }

    private setupListeners() {
        if (!this.eventEmitter) return;

        this.listeners['broadcast_creation_started'] = this.eventEmitter.addListener(
            'broadcast_creation_started',
            () => {
                console.log('[WhatsAppMonitor] Broadcast creation started');
            }
        );

        this.listeners['broadcast_creation_ended'] = this.eventEmitter.addListener(
            'broadcast_creation_ended',
            () => {
                console.log('[WhatsAppMonitor] Broadcast creation ended');
            }
        );

        this.listeners['selected_contacts_changed'] = this.eventEmitter.addListener(
            'selected_contacts_changed',
            (event: { contacts: ContactInfo[] }) => {
                console.log('[WhatsAppMonitor] Selected contacts changed:', event.contacts);
                if (this.onContactsSelected) {
                    this.onContactsSelected(event.contacts);
                }
            }
        );
    }

    isAccessibilityEnabled(): Promise<boolean> {
        if (Platform.OS !== 'android' || !NativeWhatsAppMonitor) {
            return Promise.resolve(false);
        }
        return NativeWhatsAppMonitor.isAccessibilityEnabled();
    }

    requestAccessibilityPermission(): Promise<void> {
        if (Platform.OS !== 'android' || !NativeWhatsAppMonitor) {
            return Promise.resolve();
        }
        return NativeWhatsAppMonitor.requestAccessibilityPermission();
    }

    startMonitoring(): void {
        if (Platform.OS === 'android' && NativeWhatsAppMonitor) {
            NativeWhatsAppMonitor.startMonitoring();
        }
    }

    stopMonitoring(): void {
        if (Platform.OS === 'android' && NativeWhatsAppMonitor) {
            NativeWhatsAppMonitor.stopMonitoring();
        }
    }

    removeListeners() {
        Object.values(this.listeners).forEach(listener => listener.remove());
        this.listeners = {};
    }
}

export default new WhatsAppMonitorModule();