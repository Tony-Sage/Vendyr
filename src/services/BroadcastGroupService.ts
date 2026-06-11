import * as Database from '../database/database';
import { BroadcastGroup, BroadcastList, ListContact } from '../types';

export class BroadcastGroupService {
    
    // Group operations
    static async createGroup(name: string, description: string | null = null): Promise<BroadcastGroup> {
        if (!name.trim()) {
            throw new Error('Group name is required');
        }
        return await Database.createGroup(name.trim(), description);
    }
    
    static async getAllGroups(): Promise<BroadcastGroup[]> {
        return await Database.getAllGroups();
    }
    
    static async getGroupById(id: string): Promise<BroadcastGroup | null> {
        return await Database.getGroupById(id);
    }
    
    static async updateGroup(id: string, name: string, description: string | null): Promise<void> {
        if (!name.trim()) {
            throw new Error('Group name is required');
        }
        await Database.updateGroup(id, name.trim(), description);
    }
    
    static async deleteGroup(id: string): Promise<void> {
        await Database.deleteGroup(id);
    }
    
    // List operations within groups
    static async getListsByGroup(groupId: string): Promise<BroadcastList[]> {
        return await Database.getListsByGroup(groupId);
    }
    
    static async getUnassignedLists(): Promise<BroadcastList[]> {
        return await Database.getUnassignedLists();
    }
    
    static async assignListToGroup(listId: string, groupId: string | null): Promise<void> {
        await Database.assignListToGroup(listId, groupId);
    }
    
    static async removeListFromGroup(listId: string): Promise<void> {
        await Database.assignListToGroup(listId, null);
    }
    
    // Contact operations
    static async getListContacts(listId: string): Promise<ListContact[]> {
        return await Database.getListContacts(listId);
    }
    
    static async searchListContacts(listId: string, query: string): Promise<ListContact[]> {
        if (!query.trim()) {
            return await Database.getListContacts(listId);
        }
        return await Database.searchListContacts(listId, query);
    }
    
    // Active group
    static async getActiveGroupId(): Promise<string | null> {
        return await Database.getActiveGroupId();
    }
    
    static async setActiveGroupId(groupId: string | null): Promise<void> {
        await Database.setActiveGroupId(groupId);
    }
    
    // Sync operations
    static async syncFromWhatsApp(lists: { id: string; name: string; contacts: ListContact[] }[]): Promise<void> {
        await Database.syncBroadcastLists(lists);
    }
}