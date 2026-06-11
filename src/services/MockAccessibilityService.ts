import { SelectedContact, Conflict } from '../types';
import { detectionService } from './DetectionService';

type EventCallback = (conflicts: Conflict[]) => void;

class MockAccessibilityService {
    private isMonitoring: boolean = false;
    //private intervalId: NodeJS.Timeout | null = null;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private eventCallback: EventCallback | null = null;
    
    // Mock data for simulating contact selection
    private mockContacts: SelectedContact[] = [
        { name: 'John Doe', phoneNumber: '+1234567890', contactId: '1234567890@s.whatsapp.net' },
        { name: 'Jane Smith', phoneNumber: '+1234567891', contactId: '1234567891@s.whatsapp.net' },
        { name: 'Bob Johnson', phoneNumber: '+1234567892', contactId: '1234567892@s.whatsapp.net' },
        { name: 'Alice Brown', phoneNumber: '+1234567893', contactId: '1234567893@s.whatsapp.net' },
        { name: 'Charlie Wilson', phoneNumber: '+1234567894', contactId: '1234567894@s.whatsapp.net' },
    ];
    
    private currentIndex: number = 0;
    
    startMonitoring(onConflict: EventCallback): void {
        if (this.isMonitoring) return;
        
        this.eventCallback = onConflict;
        this.isMonitoring = true;
        
        // Simulate real-time contact selection
        // In real app, this would be triggered by Accessibility events
        console.log('Mock Accessibility Service started - simulating contact selection every 3 seconds');
        
        this.intervalId = setInterval(() => {
            if (!this.isMonitoring) return;
            
            // Simulate selecting a random contact
            const randomContact = this.mockContacts[Math.floor(Math.random() * this.mockContacts.length)];
            const conflicts = detectionService.simulateContactSelection([randomContact]);
            
            if (this.eventCallback) {
                this.eventCallback(conflicts);
            }
            
            console.log(`Mock: Selected ${randomContact.name} - Conflicts: ${conflicts.length}`);
        }, 3000);
    }
    
    stopMonitoring(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isMonitoring = false;
        this.eventCallback = null;
        console.log('Mock Accessibility Service stopped');
    }
    
    isAccessibilityEnabled(): boolean {
        // For mock, always return true
        return true;
    }
    
    requestAccessibilityPermission(): void {
        console.log('Mock: Requesting accessibility permission (in real app, this would open settings)');
    }
    
    isMonitoringActive(): boolean {
        return this.isMonitoring;
    }
    
    // For testing - manually trigger a contact selection
    simulateContact(contact: SelectedContact): void {
        if (this.eventCallback) {
            const conflicts = detectionService.simulateContactSelection([contact]);
            this.eventCallback(conflicts);
        }
    }
    
    // For testing - simulate bulk selection
    simulateBulkSelection(contacts: SelectedContact[]): void {
        if (this.eventCallback) {
            const conflicts = detectionService.simulateContactSelection(contacts);
            this.eventCallback(conflicts);
        }
    }
}

export const mockAccessibilityService = new MockAccessibilityService();