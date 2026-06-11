import * as Database from '../database/database';
import { Conflict, SelectedContact, ListContact } from '../types';

export class DetectionService {
    private activeGroupId: string | null = null;
    private groupListContacts: Map<string, Set<string>> = new Map(); // phoneNumber -> set of list names
    
    async initialize(): Promise<void> {
        this.activeGroupId = await Database.getActiveGroupId();
        if (this.activeGroupId) {
            await this.loadGroupContacts();
        }
    }
    
    async setActiveGroup(groupId: string | null): Promise<void> {
        this.activeGroupId = groupId;
        await Database.setActiveGroupId(groupId);
        if (groupId) {
            await this.loadGroupContacts();
        } else {
            this.groupListContacts.clear();
        }
    }
    
    getActiveGroupId(): string | null {
        return this.activeGroupId;
    }
    
    private async loadGroupContacts(): Promise<void> {
        if (!this.activeGroupId) return;
        
        const lists = await Database.getListsByGroup(this.activeGroupId);
        this.groupListContacts.clear();
        
        for (const list of lists) {
            const contacts = await Database.getListContacts(list.id);
            for (const contact of contacts) {
                const phoneNumber = this.normalizePhoneNumber(contact.phoneNumber);
                if (!this.groupListContacts.has(phoneNumber)) {
                    this.groupListContacts.set(phoneNumber, new Set());
                }
                this.groupListContacts.get(phoneNumber)!.add(list.name);
            }
        }
    }
    
    private normalizePhoneNumber(phone: string): string {
        // Remove spaces, dashes, and ensure format consistency
        return phone.replace(/[\s\-\(\)]/g, '');
    }
    
    async checkContact(contact: SelectedContact): Promise<Conflict | null> {
        if (!this.activeGroupId) return null;
        
        const normalizedPhone = this.normalizePhoneNumber(contact.phoneNumber);
        const lists = this.groupListContacts.get(normalizedPhone);
        
        if (lists && lists.size > 0) {
            const existingListName = Array.from(lists)[0];
            return {
                contactName: contact.name,
                phoneNumber: contact.phoneNumber,
                existingListName: existingListName,
                existingListId: '' // We don't have the list ID easily here, but can be added if needed
            };
        }
        
        return null;
    }
    
    async checkContacts(contacts: SelectedContact[]): Promise<Conflict[]> {
        const conflicts: Conflict[] = [];
        const checkedNumbers = new Set<string>();
        
        for (const contact of contacts) {
            const normalizedPhone = this.normalizePhoneNumber(contact.phoneNumber);
            if (checkedNumbers.has(normalizedPhone)) continue;
            checkedNumbers.add(normalizedPhone);
            
            const conflict = await this.checkContact(contact);
            if (conflict) {
                conflicts.push(conflict);
            }
        }
        
        return conflicts;
    }
    
    async refreshGroupData(): Promise<void> {
        await this.loadGroupContacts();
    }
    
    // For mock testing - simulate contact selection
    simulateContactSelection(contacts: SelectedContact[]): Conflict[] {
        // This will be used by MockAccessibilityService
        const conflicts: Conflict[] = [];
        
        for (const contact of contacts) {
            const normalizedPhone = this.normalizePhoneNumber(contact.phoneNumber);
            const lists = this.groupListContacts.get(normalizedPhone);
            
            if (lists && lists.size > 0) {
                conflicts.push({
                    contactName: contact.name,
                    phoneNumber: contact.phoneNumber,
                    existingListName: Array.from(lists)[0],
                    existingListId: ''
                });
            }
        }
        
        return conflicts;
    }
}

export const detectionService = new DetectionService();