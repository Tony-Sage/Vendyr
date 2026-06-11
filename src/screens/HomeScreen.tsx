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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { detectionService } from '../services/DetectionService';
import { BroadcastGroup } from '../types';

type NavigationProp = any;

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [groups, setGroups] = useState<BroadcastGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

    const loadGroups = async () => {
        try {
            const allGroups = await BroadcastGroupService.getAllGroups();
            setGroups(allGroups);
            const activeId = await detectionService.getActiveGroupId();
            setActiveGroupId(activeId);
        } catch (error) {
            console.error('Failed to load groups:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadGroups();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadGroups();
        setRefreshing(false);
    };

    const handleGroupPress = (groupId: string) => {
        navigation.navigate('GroupDetail', { groupId });
    };

    const handleCreateGroup = () => {
        navigation.navigate('GroupCreation');
    };

    const handleMenuPress = () => {
        Alert.alert(
            'Menu',
            'Choose an option',
            [
                { text: 'Settings', onPress: () => navigation.navigate('Settings') },
                { text: 'Notifications', onPress: () => navigation.navigate('Notifications') },
                { text: 'Set Active Group', onPress: () => navigation.navigate('SetActiveGroup') },
                { text: 'Cancel', style: 'cancel' },
            ],
            { cancelable: true }
        );
    };

    const renderGroupCard = ({ item }: { item: BroadcastGroup }) => {
        const isActive = activeGroupId === item.id;
        return (
            <TouchableOpacity
                style={[styles.groupCard, isActive && styles.activeCard]}
                onPress={() => handleGroupPress(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.groupIcon}>
                    <Text style={styles.iconText}>📁</Text>
                </View>
                <View style={styles.groupInfo}>
                    <View style={styles.groupHeader}>
                        <Text style={styles.groupName} numberOfLines={1}>
                            {item.name}
                        </Text>
                        {isActive && (
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>ACTIVE</Text>
                            </View>
                        )}
                    </View>
                    {item.description ? (
                        <Text style={styles.groupDescription} numberOfLines={1}>
                            {item.description}
                        </Text>
                    ) : null}
                    <Text style={styles.groupStats}>
                        {item.listCount || 0} list{(item.listCount || 0) !== 1 ? 's' : ''} •{' '}
                        {item.totalContacts || 0} contact{(item.totalContacts || 0) !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.groupDate}>
                        Created: {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
        );
    };

    const renderUnassignedCard = () => {
        const unassignedCount = groups.filter(g => g.id === 'unassigned').length > 0 
            ? groups.find(g => g.id === 'unassigned')?.listCount || 0
            : 0;
        
        // Unassigned is handled separately - we don't store it as a real group
        return null;
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
                <Text style={styles.title}>Vendyr</Text>
                <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>⋮</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={renderGroupCard}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No groups yet</Text>
                        <Text style={styles.emptySubtext}>
                            Tap the + button to create your first broadcast group
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleCreateGroup}>
                <Text style={styles.fabText}>+</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#202124',
    },
    menuButton: {
        padding: 8,
    },
    menuIcon: {
        fontSize: 24,
        color: '#5f6368',
    },
    listContent: {
        paddingBottom: 80,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    activeCard: {
        borderWidth: 2,
        borderColor: '#2196F3',
        backgroundColor: '#f0f8ff',
    },
    groupIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e8f0fe',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    iconText: {
        fontSize: 24,
    },
    groupInfo: {
        flex: 1,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#202124',
        flex: 1,
    },
    activeBadge: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    activeBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    groupDescription: {
        fontSize: 13,
        color: '#5f6368',
        marginBottom: 4,
    },
    groupStats: {
        fontSize: 12,
        color: '#5f6368',
        marginBottom: 2,
    },
    groupDate: {
        fontSize: 11,
        color: '#9aa0a6',
    },
    chevron: {
        fontSize: 24,
        color: '#9aa0a6',
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
        fontSize: 20,
        fontWeight: '600',
        color: '#202124',
        marginBottom: 8,
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
});