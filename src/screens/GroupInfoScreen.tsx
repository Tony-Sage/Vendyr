import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { BroadcastGroup } from '../types';

type NavigationProp = any;
type RouteProp = any;

export const GroupInfoScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProp>();
    const { groupId } = route.params;
    
    const [group, setGroup] = useState<BroadcastGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    useEffect(() => {
        loadGroup();
    }, [groupId]);

    const loadGroup = async () => {
        try {
            const groupData = await BroadcastGroupService.getGroupById(groupId);
            setGroup(groupData);
            setEditName(groupData?.name || '');
            setEditDescription(groupData?.description || '');
        } catch (error) {
            console.error('Failed to load group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editName.trim()) {
            Alert.alert('Error', 'Group name is required');
            return;
        }
        
        try {
            await BroadcastGroupService.updateGroup(groupId, editName.trim(), editDescription.trim() || null);
            await loadGroup();
            setIsEditing(false);
            Alert.alert('Success', 'Group updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update group');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Group',
            `Delete "${group?.name}"?\n\nThe group will be removed, but all broadcast lists will remain unassigned in WhatsApp.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        await BroadcastGroupService.deleteGroup(groupId);
                        navigation.goBack();
                    }
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    if (!group) {
        return (
            <View style={styles.centerContainer}>
                <Text>Group not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {isEditing ? (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Group Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Enter group name"
                                maxLength={50}
                            />
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editDescription}
                                onChangeText={setEditDescription}
                                placeholder="Enter description (optional)"
                                multiline
                                numberOfLines={3}
                                maxLength={200}
                            />
                        </View>
                        
                        <View style={styles.buttonRow}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelButton]} 
                                onPress={() => setIsEditing(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.button, styles.saveButton]} 
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Name</Text>
                                <Text style={styles.infoValue}>{group.name}</Text>
                                <TouchableOpacity onPress={() => setIsEditing(true)}>
                                    <Text style={styles.editIcon}>✏️</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.divider} />
                            
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Description</Text>
                                <Text style={[styles.infoValue, !group.description && styles.placeholderText]}>
                                    {group.description || 'No description'}
                                </Text>
                                <TouchableOpacity onPress={() => setIsEditing(true)}>
                                    <Text style={styles.editIcon}>✏️</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        <View style={styles.statsCard}>
                            <Text style={styles.statsTitle}>Statistics</Text>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Number of lists</Text>
                                <Text style={styles.statValue}>{group.listCount || 0}</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Total contacts</Text>
                                <Text style={styles.statValue}>{group.totalContacts || 0}</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Created</Text>
                                <Text style={styles.statValue}>
                                    {new Date(group.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                        
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                            <Text style={styles.deleteButtonText}>Delete Group</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </ScrollView>
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
    content: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#202124',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#5f6368',
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#2196F3',
        marginLeft: 10,
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '500',
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoLabel: {
        width: 100,
        fontSize: 14,
        color: '#5f6368',
    },
    infoValue: {
        flex: 1,
        fontSize: 16,
        color: '#202124',
    },
    placeholderText: {
        color: '#9aa0a6',
        fontStyle: 'italic',
    },
    editIcon: {
        fontSize: 18,
        color: '#2196F3',
        padding: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    statsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#202124',
        marginBottom: 12,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#5f6368',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#202124',
    },
    deleteButton: {
        backgroundColor: '#ffebee',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    deleteButtonText: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: '600',
    },
});