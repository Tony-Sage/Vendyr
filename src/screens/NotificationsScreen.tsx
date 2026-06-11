import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Database from '../database/database';
import { UngroupedListNotification } from '../types';
import { BroadcastGroupService } from '../services/BroadcastGroupService';

type NavigationProp = any;

export const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [notifications, setNotifications] = useState<UngroupedListNotification[]>([]);
    const [loading, setLoading] = useState(true);

    const loadNotifications = async () => {
        try {
            const notifs = await Database.getUngroupedNotifications();
            setNotifications(notifs);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [])
    );

    const handleAssign = async (listId: string, listName: string) => {
        const groups = await BroadcastGroupService.getAllGroups();
        
        if (groups.length === 0) {
            Alert.alert(
                'No Groups',
                'You need to create a group first before assigning lists.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Create Group', onPress: () => navigation.navigate('GroupCreation') },
                ]
            );
            return;
        }
        
        Alert.alert(
            'Assign to Group',
            `Assign "${listName}" to which group?`,
            [
                ...groups.map(group => ({
                    text: group.name,
                    onPress: async () => {
                        await BroadcastGroupService.assignListToGroup(listId, group.id);
                        await Database.removeUngroupedNotification(listId);
                        await loadNotifications();
                        Alert.alert('Success', `"${listName}" assigned to ${group.name}`);
                    }
                })),
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleClearAll = () => {
        Alert.alert(
            'Clear All',
            `Clear all ${notifications.length} notification(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Clear', 
                    style: 'destructive',
                    onPress: async () => {
                        await Database.clearAllUngroupedNotifications();
                        await loadNotifications();
                    }
                },
            ]
        );
    };

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
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
            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔔</Text>
                    <Text style={styles.emptyText}>No notifications</Text>
                    <Text style={styles.emptySubtext}>
                        New broadcast lists will appear here when discovered
                    </Text>
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {notifications.length} ungrouped list{notifications.length !== 1 ? 's' : ''}
                        </Text>
                        <TouchableOpacity onPress={handleClearAll}>
                            <Text style={styles.clearText}>Clear All</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.listId}
                        renderItem={({ item }) => (
                            <View style={styles.notificationCard}>
                                <View style={styles.notificationIcon}>
                                    <Text style={styles.iconText}>📢</Text>
                                </View>
                                <View style={styles.notificationInfo}>
                                    <Text style={styles.listName}>{item.listName}</Text>
                                    <Text style={styles.detectedText}>
                                        Detected {formatDate(item.detectedAt)}
                                    </Text>
                                    <Text style={styles.contactCount}>
                                        {item.contactCount} contact{item.contactCount !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.assignButton}
                                    onPress={() => handleAssign(item.listId, item.listName)}
                                >
                                    <Text style={styles.assignButtonText}>Assign</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                    />
                </>
            )}
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
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#5f6368',
    },
    clearText: {
        fontSize: 14,
        color: '#F44336',
        fontWeight: '500',
    },
    listContent: {
        paddingBottom: 20,
    },
    notificationCard: {
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
    notificationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff3e0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    iconText: {
        fontSize: 24,
    },
    notificationInfo: {
        flex: 1,
    },
    listName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#202124',
        marginBottom: 2,
    },
    detectedText: {
        fontSize: 12,
        color: '#5f6368',
        marginBottom: 2,
    },
    contactCount: {
        fontSize: 12,
        color: '#9aa0a6',
    },
    assignButton: {
        backgroundColor: '#e8f0fe',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    assignButtonText: {
        color: '#2196F3',
        fontSize: 14,
        fontWeight: '500',
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
});