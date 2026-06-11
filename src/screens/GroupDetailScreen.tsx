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
import { useNavigation, useRoute } from '@react-navigation/native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { detectionService } from '../services/DetectionService';
import { BroadcastList } from '../types';
import { BroadcastListCard } from '../components/BroadcastListCard';

type NavigationProp = any;
type RouteProp = any;

export const GroupDetailScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProp>();
    const { groupId } = route.params;
    
    const [lists, setLists] = useState<BroadcastList[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const group = await BroadcastGroupService.getGroupById(groupId);
            if (group) {
                setGroupName(group.name);
                navigation.setOptions({ title: group.name });
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

    const handleListPress = (listId: string) => {
        navigation.navigate('ListContacts', { listId });
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
        navigation.navigate('AddListsToGroup', {
            mode: 'assignment',
            groupId: groupId,
        });
    };

    const handleCreateBroadcast = async () => {
        // Set active group and open WhatsApp
        await detectionService.setActiveGroup(groupId);
        
        // Open WhatsApp
        const url = 'whatsapp://';
        try {
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert('Error', 'WhatsApp is not installed');
        }
    };

    const handleInfoPress = () => {
        navigation.navigate('GroupInfo', { groupId });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
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
                            onPress={handleListPress}
                            onLongPress={() => handleRemoveList(item.id, item.name)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    infoButton: {
        padding: 8,
    },
    infoIcon: {
        fontSize: 22,
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
        backgroundColor: '#2196F3',
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
        backgroundColor: '#25D366',
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
    },
});