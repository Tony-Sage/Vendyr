import { BroadcastList, ListContact, BroadcastGroup } from '../types';

// Mock broadcast lists
export const mockBroadcastLists: BroadcastList[] = [
    { id: 'list_1', name: 'Q1 Promotions', groupId: null, createdAt: 1704067200000, contactCount: 45 },
    { id: 'list_2', name: 'Holiday Offers', groupId: null, createdAt: 1704067200000, contactCount: 32 },
    { id: 'list_3', name: 'New Product Launch', groupId: null, createdAt: 1704067200000, contactCount: 18 },
    { id: 'list_4', name: 'Customer Feedback', groupId: null, createdAt: 1704067200000, contactCount: 67 },
    { id: 'list_5', name: 'Event Invites', groupId: null, createdAt: 1704067200000, contactCount: 23 },
    { id: 'list_6', name: 'Flash Sale', groupId: null, createdAt: 1704153600000, contactCount: 56 },
    { id: 'list_7', name: 'Weekend Special', groupId: null, createdAt: 1704240000000, contactCount: 34 },
    { id: 'list_8', name: 'Abandoned Cart', groupId: null, createdAt: 1704326400000, contactCount: 28 },
];

// Mock contacts for each list
export const mockListContacts: { [listId: string]: ListContact[] } = {
    list_1: [
        { listId: 'list_1', contactId: '1234567890@s.whatsapp.net', contactName: 'John Doe', phoneNumber: '+1234567890' },
        { listId: 'list_1', contactId: '1234567891@s.whatsapp.net', contactName: 'Jane Smith', phoneNumber: '+1234567891' },
        { listId: 'list_1', contactId: '1234567892@s.whatsapp.net', contactName: 'Bob Johnson', phoneNumber: '+1234567892' },
    ],
    list_2: [
        { listId: 'list_2', contactId: '1234567893@s.whatsapp.net', contactName: 'Alice Brown', phoneNumber: '+1234567893' },
        { listId: 'list_2', contactId: '1234567890@s.whatsapp.net', contactName: 'John Doe', phoneNumber: '+1234567890' }, // Duplicate contact (John Doe)
        { listId: 'list_2', contactId: '1234567894@s.whatsapp.net', contactName: 'Charlie Wilson', phoneNumber: '+1234567894' },
    ],
    list_3: [
        { listId: 'list_3', contactId: '1234567895@s.whatsapp.net', contactName: 'Diana Prince', phoneNumber: '+1234567895' },
        { listId: 'list_3', contactId: '1234567896@s.whatsapp.net', contactName: 'Bruce Wayne', phoneNumber: '+1234567896' },
    ],
};

// Mock groups (for testing)
export const mockGroups: BroadcastGroup[] = [
    { id: 'group_1', name: 'Marketing', description: 'All marketing broadcast lists', createdAt: 1704067200000, listCount: 0, totalContacts: 0 },
    { id: 'group_2', name: 'Sales', description: 'Sales and promotions', createdAt: 1704153600000, listCount: 0, totalContacts: 0 },
];

// Helper to initialize mock data in database
export const initializeMockData = async (
    addList: (list: BroadcastList) => Promise<void>,
    addContacts: (listId: string, contacts: ListContact[]) => Promise<void>
) => {
    for (const list of mockBroadcastLists) {
        await addList(list);
        const contacts = mockListContacts[list.id] || [];
        if (contacts.length > 0) {
            await addContacts(list.id, contacts);
        }
    }
    console.log('Mock data initialized');
};

// Mock contact selection simulation
export const mockSelectedContacts: { name: string; phoneNumber: string }[] = [
    { name: 'John Doe', phoneNumber: '+1234567890' },
    { name: 'Jane Smith', phoneNumber: '+1234567891' },
    { name: 'Alice Brown', phoneNumber: '+1234567893' },
];