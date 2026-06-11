import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Linking,
} from 'react-native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { detectionService } from '../services/DetectionService';
import { BroadcastList } from '../types';
import { BroadcastListCard } from '../components/BroadcastListCard';

interface ScreenProps {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    goToHome: () => void;
    groupId: string;
}

export const GroupDetailScreen: React.FC<ScreenProps> = ({ navigate, goBack, goToHome, groupId }) => {
    const [lists, setLists] = useState<BroadcastList[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const group = await BroadcastGroupService.getGroupById(groupId);
            if (group) {
                setGroupName(group.name);
            }
            
            const groupLists = await BroadcastGroupService.getListsByGroup(groupId);
            setLists(groupLists);
        } catch (error) {
            console.error('Failed to load group data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [groupId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleListPress = (listId: string, listName: string) => {
        navigate('ListContacts', { listId, listName, returnToScreen: 'GroupDetail', returnParams: { groupId } });
    };

    const handleRemoveList = (listId: string, listName: string) => {
        Alert.alert(
            'Remove List',
            `Remove "${listName}" from ${groupName}?\n\nThe list will remain in WhatsApp but will be unassigned from this group.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Remove', 
                    style: 'destructive',
                    onPress: async () => {
                        await BroadcastGroupService.removeListFromGroup(listId);
                        await loadData();
                    }
                },
            ]
        );
    };

    const handleAddList = () => {
        navigate('AddListsToGroup', {
            mode: 'assignment',
            groupId: groupId,
            onComplete: () => {
                loadData();
            }
        });
    };

    const handleCreateBroadcast = async () => {
        await detectionService.setActiveGroup(groupId);
        
        // Try multiple WhatsApp URL schemes
        const whatsappUrl = 'whatsapp://';
        const whatsappBusinessUrl = 'whatsapp://send';
        
        try {
            const canOpen = await Linking.canOpenURL(whatsappUrl);
            if (canOpen) {
                await Linking.openURL(whatsappUrl);
            } else {
                const canOpenBusiness = await Linking.canOpenURL(whatsappBusinessUrl);
                if (canOpenBusiness) {
                    await Linking.openURL(whatsappBusinessUrl);
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
            }
        } catch (error) {
            Alert.alert('Error', 'Could not open WhatsApp. Please make sure it is installed.');
        }
    };

    const handleInfoPress = () => {
        navigate('GroupInfo', { groupId });
    };

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
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
                <TouchableOpacity onPress={handleInfoPress} style={styles.infoButton}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                </TouchableOpacity>
            </View>

            {lists.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>No lists in this group</Text>
                    <Text style={styles.emptySubtext}>
                        Tap + to add broadcast lists to "{groupName}"
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={lists}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BroadcastListCard
                            id={item.id}
                            name={item.name}
                            contactCount={item.contactCount || 0}
                            onPress={() => handleListPress(item.id, item.name)}
                            onLongPress={() => handleRemoveList(item.id, item.name)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#25D366']} />
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={handleAddList}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whatsappFab} onPress={handleCreateBroadcast}>
                <Text style={styles.whatsappFabText}>💬</Text>
            </TouchableOpacity>
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
    infoButton: {
        padding: 8,
    },
    infoIcon: {
        fontSize: 20,
        color: '#ffffff',
    },
    listContent: {
        paddingBottom: 100,
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
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#25D366',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    fabText: {
        fontSize: 28,
        color: '#ffffff',
        fontWeight: '600',
    },
    whatsappFab: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#075E54',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    whatsappFabText: {
        fontSize: 28,
        color: '#ffffff',
    },
});