// Broadcast group types
export interface BroadcastGroup {
    id: string;
    name: string;
    description: string | null;
    createdAt: number;
    listCount?: number;
    totalContacts?: number;
}

export interface BroadcastList {
    id: string;
    groupId: string | null;  // null means unassigned
    name: string;
    createdAt: number;
    contactCount?: number;
}

export interface ListContact {
    listId: string;
    contactId: string;  // WhatsApp ID format: +1234567890@s.whatsapp.net
    contactName: string;
    phoneNumber: string;
}

export interface Conflict {
    contactName: string;
    phoneNumber: string;
    existingListName: string;
    existingListId: string;
}

export interface SelectedContact {
    name: string;
    phoneNumber: string;
    contactId?: string;
}

// App settings
export interface AppSettings {
    activeGroupId: string | null;
    floatingBubbleEnabled: boolean;
    pushNotificationsEnabled: boolean;
    vibrationEnabled: boolean;
    soundEnabled: boolean;
}

// Notification types
export interface UngroupedListNotification {
    listId: string;
    listName: string;
    detectedAt: number;
    contactCount: number;
}