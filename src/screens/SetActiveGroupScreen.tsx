import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { detectionService } from '../services/DetectionService';
import { BroadcastGroup } from '../types';

interface ScreenProps {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    selectionMode?: boolean;
    onSelectGroup?: (groupId: string) => void;
    groupId: string;
}

export const SetActiveGroupScreen: React.FC<ScreenProps> = ({ 
    navigate, 
    goBack, 
    selectionMode, 
    onSelectGroup 
}) => {
    const [groups, setGroups] = useState<BroadcastGroup[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
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
        loadData();
    }, []);

    const handleSelectGroup = async (groupId: string, groupName: string) => {
        if (selectionMode && onSelectGroup) {
            onSelectGroup(groupId);
            goBack();
        } else {
            await detectionService.setActiveGroup(groupId);
            setActiveGroupId(groupId);
            
            // Open WhatsApp automatically
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
        }
    };
    

    const handleClearActive = async () => {
        await detectionService.setActiveGroup(null);
        setActiveGroupId(null);
        Alert.alert('Cleared', 'No active group set. Conflict detection is disabled.');
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    if (groups.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyIcon}>📁</Text>
                <Text style={styles.emptyText}>No groups yet</Text>
                <Text style={styles.emptySubtext}>
                    Create a group first to set it as active
                </Text>
                <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => navigate('GroupCreation')}
                >
                    <Text style={styles.createButtonText}>Create Group</Text>
                </TouchableOpacity>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {selectionMode ? 'Select Group' : 'Set Active Group'}
                </Text>
                <View style={styles.placeholder} />
            </View>

            {!selectionMode && (
                <View style={styles.infoBanner}>
                    <Text style={styles.infoText}>
                        Active group determines which broadcast lists to check for conflicts
                    </Text>
                </View>
            )}
            
            <FlatList
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const isActive = activeGroupId === item.id;
                    return (
                        <TouchableOpacity
                            style={[styles.groupCard, isActive && styles.activeCard]}
                            onPress={() => {
                                handleSelectGroup(item.id, item.name)
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.groupIcon}>
                                <Text style={styles.iconText}>📁</Text>
                            </View>
                            <View style={styles.groupInfo}>
                                <Text style={styles.groupName}>{item.name}</Text>
                                {item.description ? (
                                    <Text style={styles.groupDescription} numberOfLines={1}>
                                        {item.description}
                                    </Text>
                                ) : null}
                                <Text style={styles.groupStats}>
                                    {item.listCount || 0} list{(item.listCount || 0) !== 1 ? 's' : ''} •{' '}
                                    {item.totalContacts || 0} contact{(item.totalContacts || 0) !== 1 ? 's' : ''}
                                </Text>
                            </View>
                            {isActive && !selectionMode && (
                                <View style={styles.activeBadge}>
                                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                </View>
                            )}
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    );
                }}
                contentContainerStyle={styles.listContent}
            />
            
            {!selectionMode && activeGroupId && (
                <TouchableOpacity style={styles.clearButton} onPress={handleClearActive}>
                    <Text style={styles.clearButtonText}>Clear Active Group</Text>
                </TouchableOpacity>
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
        paddingHorizontal: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#075E54',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
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
        color: '#202124',
    },
    placeholder: {
        width: 50,
    },
    infoBanner: {
        backgroundColor: '#DCF8C6',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 8,
    },
    infoText: {
        color: '#075E54',
        fontSize: 14,
        textAlign: 'center',
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
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#202124',
        marginBottom: 2,
    },
    groupDescription: {
        fontSize: 13,
        color: '#5f6368',
        marginBottom: 2,
    },
    groupStats: {
        fontSize: 12,
        color: '#9aa0a6',
    },
    activeBadge: {
        backgroundColor: '#25D366',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    activeBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    chevron: {
        fontSize: 24,
        color: '#9aa0a6',
    },
    clearButton: {
        backgroundColor: '#ffebee',
        margin: 20,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#F44336',
        fontSize: 14,
        fontWeight: '500',
    },
    createButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
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