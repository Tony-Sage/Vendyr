import { SelectedContact, Conflict } from '../types';
import { detectionService } from './DetectionService';
import whatsappMonitor from '../native/WhatsAppMonitorModule';

type EventCallback = (conflicts: Conflict[]) => void;

class RealAccessibilityService {
    private isMonitoring: boolean = false;
    private eventCallback: EventCallback | null = null;
    private currentContacts: SelectedContact[] = [];

    startMonitoring(onConflict: EventCallback): void {
        if (this.isMonitoring) return;
        
        this.eventCallback = onConflict;
        this.isMonitoring = true;

        // Set up the callback from the native module
        whatsappMonitor.onContactsSelected = (contacts: { name: string; phoneNumber: string }[]) => {
            this.handleContactsSelected(contacts);
        };

        console.log('Real Accessibility Service started');
        whatsappMonitor.startMonitoring();
    }

    private handleContactsSelected(contacts: { name: string; phoneNumber: string }[]): void {
        const selectedContacts: SelectedContact[] = contacts.map(c => ({
            name: c.name,
            phoneNumber: c.phoneNumber,
        }));

        this.currentContacts = selectedContacts;

        // Use detection service to check for conflicts
        const conflicts = detectionService.simulateContactSelection(selectedContacts);
        
        if (this.eventCallback) {
            this.eventCallback(conflicts);
        }

        console.log(`Real: ${selectedContacts.length} contacts selected - ${conflicts.length} conflicts`);
    }

    stopMonitoring(): void {
        this.isMonitoring = false;
        this.eventCallback = null;
        whatsappMonitor.stopMonitoring();
        console.log('Real Accessibility Service stopped');
    }

    isAccessibilityEnabled(): Promise<boolean> {
        return whatsappMonitor.isAccessibilityEnabled();
    }

    requestAccessibilityPermission(): void {
        whatsappMonitor.requestAccessibilityPermission();
    }

    isMonitoringActive(): boolean {
        return this.isMonitoring;
    }

    // For testing - manually trigger (removes mock)
    simulateContact(contact: SelectedContact): void {
        this.handleContactsSelected([{
            name: contact.name,
            phoneNumber: contact.phoneNumber
        }]);
    }

    simulateBulkSelection(contacts: SelectedContact[]): void {
        this.handleContactsSelected(contacts.map(c => ({
            name: c.name,
            phoneNumber: c.phoneNumber
        })));
    }
}

export const realAccessibilityService = new RealAccessibilityService();