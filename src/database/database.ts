import * as SQLite from 'expo-sqlite';
import { SQL_SCHEMA } from './schema';
import { 
    BroadcastGroup, 
    BroadcastList, 
    ListContact, 
    AppSettings,
    UngroupedListNotification 
} from '../types';

let db: SQLite.SQLiteDatabase;

export const initDatabase = async () => {
    db = await SQLite.openDatabaseAsync('vendyr.db');
    await db.execAsync(SQL_SCHEMA);
    console.log('Database initialized');
    return db;
};

export const getDb = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
};

// ============ Broadcast Groups ============
export const createGroup = async (name: string, description: string | null = null): Promise<BroadcastGroup> => {
    const id = Date.now().toString();
    const createdAt = Date.now();
    
    await getDb().runAsync(
        'INSERT INTO broadcast_groups (id, name, description, created_at) VALUES (?, ?, ?, ?)',
        id, name, description, createdAt
    );
    
    return { id, name, description, createdAt };
};

export const getAllGroups = async (): Promise<BroadcastGroup[]> => {
    const results = await getDb().getAllAsync<any>(
        `SELECT 
            bg.id, bg.name, bg.description, bg.created_at as createdAt,
            COUNT(DISTINCT bl.id) as listCount,
            COUNT(DISTINCT lc.contact_id) as totalContacts
        FROM broadcast_groups bg
        LEFT JOIN broadcast_lists bl ON bl.group_id = bg.id
        LEFT JOIN list_contacts lc ON lc.list_id = bl.id
        GROUP BY bg.id
        ORDER BY bg.created_at DESC`
    );
    
    return results.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.createdAt,
        listCount: row.listCount || 0,
        totalContacts: row.totalContacts || 0
    }));
};

export const getGroupById = async (id: string): Promise<BroadcastGroup | null> => {
    const result = await getDb().getFirstAsync<any>(
        `SELECT bg.id, bg.name, bg.description, bg.created_at as createdAt,
            COUNT(DISTINCT bl.id) as listCount,
            COUNT(DISTINCT lc.contact_id) as totalContacts
        FROM broadcast_groups bg
        LEFT JOIN broadcast_lists bl ON bl.group_id = bg.id
        LEFT JOIN list_contacts lc ON lc.list_id = bl.id
        WHERE bg.id = ?
        GROUP BY bg.id`,
        id
    );
    
    if (!result) return null;
    
    return {
        id: result.id,
        name: result.name,
        description: result.description,
        createdAt: result.createdAt,
        listCount: result.listCount || 0,
        totalContacts: result.totalContacts || 0
    };
};

export const updateGroup = async (id: string, name: string, description: string | null): Promise<void> => {
    await getDb().runAsync(
        'UPDATE broadcast_groups SET name = ?, description = ? WHERE id = ?',
        name, description, id
    );
};

export const deleteGroup = async (id: string): Promise<void> => {
    // First, unassign all lists in this group (set group_id to NULL)
    await getDb().runAsync('UPDATE broadcast_lists SET group_id = NULL WHERE group_id = ?', id);
    // Then delete the group
    await getDb().runAsync('DELETE FROM broadcast_groups WHERE id = ?', id);
};

// ============ Broadcast Lists ============
export const addBroadcastList = async (id: string, name: string, groupId: string | null = null): Promise<void> => {
    const createdAt = Date.now();
    await getDb().runAsync(
        'INSERT OR REPLACE INTO broadcast_lists (id, name, group_id, created_at) VALUES (?, ?, ?, ?)',
        id, name, groupId, createdAt
    );
};

export const updateBroadcastListName = async (id: string, name: string): Promise<void> => {
    await getDb().runAsync('UPDATE broadcast_lists SET name = ? WHERE id = ?', name, id);
};

export const assignListToGroup = async (listId: string, groupId: string | null): Promise<void> => {
    await getDb().runAsync('UPDATE broadcast_lists SET group_id = ? WHERE id = ?', groupId, listId);
    
    // If assigning to a group, remove from notifications
    if (groupId) {
        await getDb().runAsync('DELETE FROM ungrouped_notifications WHERE list_id = ?', listId);
    }
};

export const getAllLists = async (): Promise<BroadcastList[]> => {
    const results = await getDb().getAllAsync<any>(
        `SELECT bl.id, bl.name, bl.group_id as groupId, bl.created_at as createdAt,
            COUNT(DISTINCT lc.contact_id) as contactCount
        FROM broadcast_lists bl
        LEFT JOIN list_contacts lc ON lc.list_id = bl.id
        GROUP BY bl.id
        ORDER BY bl.name`
    );
    
    return results.map(row => ({
        id: row.id,
        name: row.name,
        groupId: row.groupId,
        createdAt: row.createdAt,
        contactCount: row.contactCount || 0
    }));
};

export const getListsByGroup = async (groupId: string): Promise<BroadcastList[]> => {
    const results = await getDb().getAllAsync<any>(
        `SELECT bl.id, bl.name, bl.group_id as groupId, bl.created_at as createdAt,
            COUNT(DISTINCT lc.contact_id) as contactCount
        FROM broadcast_lists bl
        LEFT JOIN list_contacts lc ON lc.list_id = bl.id
        WHERE bl.group_id = ?
        GROUP BY bl.id
        ORDER BY bl.name`,
        groupId
    );
    
    return results.map(row => ({
        id: row.id,
        name: row.name,
        groupId: row.groupId,
        createdAt: row.createdAt,
        contactCount: row.contactCount || 0
    }));
};

export const getUnassignedLists = async (): Promise<BroadcastList[]> => {
    const results = await getDb().getAllAsync<any>(
        `SELECT bl.id, bl.name, bl.group_id as groupId, bl.created_at as createdAt,
            COUNT(DISTINCT lc.contact_id) as contactCount
        FROM broadcast_lists bl
        LEFT JOIN list_contacts lc ON lc.list_id = bl.id
        WHERE bl.group_id IS NULL
        GROUP BY bl.id
        ORDER BY bl.name`
    );
    
    return results.map(row => ({
        id: row.id,
        name: row.name,
        groupId: null,
        createdAt: row.createdAt,
        contactCount: row.contactCount || 0
    }));
};

export const deleteBroadcastList = async (id: string): Promise<void> => {
    await getDb().runAsync('DELETE FROM broadcast_lists WHERE id = ?', id);
};

// ============ List Contacts ============
export const addContactsToList = async (listId: string, contacts: ListContact[]): Promise<void> => {
    for (const contact of contacts) {
        await getDb().runAsync(
            'INSERT OR REPLACE INTO list_contacts (list_id, contact_id, contact_name, phone_number) VALUES (?, ?, ?, ?)',
            listId, contact.contactId, contact.contactName, contact.phoneNumber
        );
    }
};

export const getListContacts = async (listId: string): Promise<ListContact[]> => {
    const results = await getDb().getAllAsync<ListContact>(
        'SELECT list_id as listId, contact_id as contactId, contact_name as contactName, phone_number as phoneNumber FROM list_contacts WHERE list_id = ? ORDER BY contact_name',
        listId
    );
    return results;
};

export const clearListContacts = async (listId: string): Promise<void> => {
    await getDb().runAsync('DELETE FROM list_contacts WHERE list_id = ?', listId);
};

export const searchListContacts = async (listId: string, query: string): Promise<ListContact[]> => {
    const results = await getDb().getAllAsync<ListContact>(
        `SELECT list_id as listId, contact_id as contactId, contact_name as contactName, phone_number as phoneNumber 
        FROM list_contacts 
        WHERE list_id = ? AND (contact_name LIKE ? OR phone_number LIKE ?)
        ORDER BY contact_name`,
        listId, `%${query}%`, `%${query}%`
    );
    return results;
};

// ============ Settings ============
export const getSetting = async (key: string): Promise<string | null> => {
    const result = await getDb().getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        key
    );
    return result?.value || null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
    await getDb().runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        key, value
    );
};

export const getActiveGroupId = async (): Promise<string | null> => {
    const value = await getSetting('active_group_id');
    return value && value !== '' ? value : null;
};

export const setActiveGroupId = async (groupId: string | null): Promise<void> => {
    await setSetting('active_group_id', groupId || '');
};

export const getAppSettings = async (): Promise<{
    floatingBubbleEnabled: boolean;
    pushNotificationsEnabled: boolean;
    vibrationEnabled: boolean;
    soundEnabled: boolean;
}> => {
    const floatingBubbleEnabled = (await getSetting('floating_bubble_enabled')) === 'true';
    const pushNotificationsEnabled = (await getSetting('push_notifications_enabled')) === 'true';
    const vibrationEnabled = (await getSetting('vibration_enabled')) === 'true';
    const soundEnabled = (await getSetting('sound_enabled')) === 'true';
    
    return {
        floatingBubbleEnabled,
        pushNotificationsEnabled,
        vibrationEnabled,
        soundEnabled
    };
};

export const updateAppSettings = async (settings: Partial<{
    floatingBubbleEnabled: boolean;
    pushNotificationsEnabled: boolean;
    vibrationEnabled: boolean;
    soundEnabled: boolean;
}>): Promise<void> => {
    if (settings.floatingBubbleEnabled !== undefined) {
        await setSetting('floating_bubble_enabled', settings.floatingBubbleEnabled.toString());
    }
    if (settings.pushNotificationsEnabled !== undefined) {
        await setSetting('push_notifications_enabled', settings.pushNotificationsEnabled.toString());
    }
    if (settings.vibrationEnabled !== undefined) {
        await setSetting('vibration_enabled', settings.vibrationEnabled.toString());
    }
    if (settings.soundEnabled !== undefined) {
        await setSetting('sound_enabled', settings.soundEnabled.toString());
    }
};

// ============ Ungrouped Notifications ============
export const addUngroupedNotification = async (listId: string, listName: string, contactCount: number): Promise<void> => {
    const detectedAt = Date.now();
    await getDb().runAsync(
        'INSERT OR REPLACE INTO ungrouped_notifications (list_id, list_name, detected_at, contact_count) VALUES (?, ?, ?, ?)',
        listId, listName, detectedAt, contactCount
    );
};

export const getUngroupedNotifications = async (): Promise<UngroupedListNotification[]> => {
    const results = await getDb().getAllAsync<UngroupedListNotification>(
        'SELECT list_id as listId, list_name as listName, detected_at as detectedAt, contact_count as contactCount FROM ungrouped_notifications ORDER BY detected_at DESC'
    );
    return results;
};

export const removeUngroupedNotification = async (listId: string): Promise<void> => {
    await getDb().runAsync('DELETE FROM ungrouped_notifications WHERE list_id = ?', listId);
};

export const clearAllUngroupedNotifications = async (): Promise<void> => {
    await getDb().runAsync('DELETE FROM ungrouped_notifications');
};

// ============ Sync Helpers ============
export const syncBroadcastLists = async (lists: { id: string; name: string; contacts: ListContact[] }[]): Promise<void> => {
    for (const list of lists) {
        // Check if list already exists
        const existing = await getDb().getFirstAsync<{ id: string }>('SELECT id FROM broadcast_lists WHERE id = ?', list.id);
        
        if (!existing) {
            // New list - add to unassigned and create notification
            await addBroadcastList(list.id, list.name, null);
            await addUngroupedNotification(list.id, list.name, list.contacts.length);
        } else {
            // Existing list - update name and clear/re-add contacts
            await updateBroadcastListName(list.id, list.name);
            await clearListContacts(list.id);
        }
        
        // Add contacts
        await addContactsToList(list.id, list.contacts);
    }
};