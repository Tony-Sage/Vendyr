import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
} from 'react-native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { detectionService } from '../services/DetectionService';
import { BroadcastGroup } from '../types';

interface ScreenProps {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    goToHome: () => void;
}

export const HomeScreen: React.FC<ScreenProps> = ({ navigate, goBack, goToHome }) => {
    const [groups, setGroups] = useState<BroadcastGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

    useEffect(() => {
        loadGroups();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadGroups();
        setRefreshing(false);
    };

    const handleGroupPress = (groupId: string) => {
        navigate('GroupDetail', { groupId });
    };

    const handleCreateGroup = () => {
        navigate('GroupCreation');
    };

    const handleDeleteGroup = (groupId: string, groupName: string) => {
        Alert.alert(
            'Delete Group',
            `Delete "${groupName}"?\n\nThe group will be removed, but all broadcast lists will remain unassigned in WhatsApp.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        await BroadcastGroupService.deleteGroup(groupId);
                        await loadGroups();
                    }
                },
            ]
        );
    };

    const openMenu = () => {
        setMenuVisible(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeMenu = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setMenuVisible(false);
        });
    };

    const handleMenuItemPress = (action: string) => {
        closeMenu();
        setTimeout(() => {
            switch (action) {
                case 'settings':
                    navigate('Settings');
                    break;
                case 'notifications':
                    navigate('Notifications');
                    break;
                case 'activeGroup':
                    navigate('SetActiveGroup');
                    break;
                default:
                    break;
            }
        }, 200);
    };

    const renderGroupCard = ({ item }: { item: BroadcastGroup }) => {
        const isActive = activeGroupId === item.id;
        return (
            <TouchableOpacity
                style={[styles.groupCard, isActive && styles.activeCard]}
                onPress={() => handleGroupPress(item.id)}
                onLongPress={() => handleDeleteGroup(item.id, item.name)}
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
                <Text style={styles.title}>Vendyr</Text>
                <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>⋮</Text>
                </TouchableOpacity>
            </View>

            {/* Floating Menu Modal */}
            <Modal
                transparent={true}
                visible={menuVisible}
                animationType="none"
                onRequestClose={closeMenu}
            >
                <TouchableWithoutFeedback onPress={closeMenu}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <Animated.View 
                                style={[
                                    styles.menuContainer,
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ scale: scaleAnim }],
                                    }
                                ]}
                            >
                                <TouchableOpacity 
                                    style={styles.menuItem}
                                    onPress={() => handleMenuItemPress('settings')}
                                >
                                    <Text style={styles.menuItemIcon}>⚙️</Text>
                                    <Text style={styles.menuItemText}>Settings</Text>
                                </TouchableOpacity>
                                
                                <View style={styles.menuDivider} />
                                
                                <TouchableOpacity 
                                    style={styles.menuItem}
                                    onPress={() => handleMenuItemPress('notifications')}
                                >
                                    <Text style={styles.menuItemIcon}>🔔</Text>
                                    <Text style={styles.menuItemText}>Notifications</Text>
                                </TouchableOpacity>
                                
                                <View style={styles.menuDivider} />
                                
                                <TouchableOpacity 
                                    style={styles.menuItem}
                                    onPress={() => handleMenuItemPress('activeGroup')}
                                >
                                    <Text style={styles.menuItemIcon}>🎯</Text>
                                    <Text style={styles.menuItemText}>Set Active Group</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <FlatList
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={renderGroupCard}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#25D366']} />
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

const { width: screenWidth } = Dimensions.get('window');

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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#075E54',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    menuButton: {
        padding: 8,
    },
    menuIcon: {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    menuContainer: {
        position: 'absolute',
        top: 80, 
        right: 16,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
    },
    menuItemIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    menuItemText: {
        fontSize: 16,
        color: '#202124',
        fontWeight: '500',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
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
        borderColor: '#25D366',
        backgroundColor: '#E8F5E9',
    },
    groupIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#DCF8C6',
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
        backgroundColor: '#25D366',
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
});