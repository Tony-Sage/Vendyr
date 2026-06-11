import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
} from 'react-native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { ListContact } from '../types';

interface ScreenProps {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    goToHome: () => void;
    listId: string;
    listName?: string;
    returnToScreen?: string;
    returnParams?: any;
}

export const ListContactsScreen: React.FC<ScreenProps> = ({ 
    navigate, 
    goBack, 
    goToHome, 
    listId, 
    listName,
    returnToScreen,
    returnParams 
}) => {
    const [contacts, setContacts] = useState<ListContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadContacts = async () => {
        try {
            const listContacts = await BroadcastGroupService.getListContacts(listId);
            setContacts(listContacts);
        } catch (error) {
            console.error('Failed to load contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, [listId]);

    const handleGoBack = () => {
        if (returnToScreen === 'GroupDetail' && returnParams) {
            navigate(returnToScreen, returnParams);
        } else {
            goBack();
        }
    };

    const handleContactPress = async (phoneNumber: string) => {
        let normalizedPhone = phoneNumber.replace(/\s/g, '').replace(/^\+/, '');
        
        const url = `whatsapp://send?phone=${normalizedPhone}`;
        
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert(
                    'WhatsApp Not Found',
                    'Please make sure WhatsApp is installed on your device.',
                    [
                        { text: 'OK' },
                        { text: 'Open Play Store', onPress: () => Linking.openURL('market://details?id=com.whatsapp') }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Could not open WhatsApp. Please make sure it is installed.');
        }
    };

    const filteredContacts = searchQuery.trim()
        ? contacts.filter(contact => 
            contact.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.phoneNumber.includes(searchQuery)
          )
        : contacts;

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#25D366" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{listName || 'Contacts'}</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Search contacts..."
                    placeholderTextColor="#9aa0a6"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {filteredContacts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>👥</Text>
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'No matching contacts found' : 'No contacts in this list'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {searchQuery 
                            ? 'Try a different search term' 
                            : 'Add contacts to this broadcast list in WhatsApp'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredContacts}
                    keyExtractor={(item) => item.contactId}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.contactCard}
                            onPress={() => handleContactPress(item.phoneNumber)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {item.contactName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{item.contactName}</Text>
                                <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
                            </View>
                            <Text style={styles.whatsappIcon}>💬</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}
            
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {contacts.length} contact{contacts.length !== 1 ? 's' : ''} total
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5E5E5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E5E5E5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#075E54',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#ffffff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 50,
    },
    searchContainer: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 60,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginVertical: 4,
        padding: 12,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#DCF8C6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#075E54',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#202124',
        marginBottom: 2,
    },
    phoneNumber: {
        fontSize: 13,
        color: '#5f6368',
    },
    whatsappIcon: {
        fontSize: 22,
        color: '#25D366',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#202124',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#5f6368',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        padding: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    footerText: {
        fontSize: 12,
        color: '#5f6368',
    },
});