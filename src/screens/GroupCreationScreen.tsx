import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';

interface ScreenProps {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
}

export const GroupCreationScreen: React.FC<ScreenProps> = ({ navigate, goBack }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedLists, setSelectedLists] = useState<string[]>([]);

    const handleCreateGroup = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        try {
            const group = await BroadcastGroupService.createGroup(name.trim(), description.trim() || null);
            
            if (selectedLists.length > 0) {
                for (const listId of selectedLists) {
                    await BroadcastGroupService.assignListToGroup(listId, group.id);
                }
            }
            
            Alert.alert('Success', `Group "${name}" created`, [
                { text: 'OK', onPress: goBack },
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to create group');
            console.error(error);
        }
    };

    const handleAddLists = () => {
        navigate('AddListsToGroup', {
            mode: 'creation',
            selectedListIds: selectedLists,
            onSelect: (listIds: string[]) => setSelectedLists(listIds),
        });
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Group</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Group Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g., Marketing, Sales, Support"
                        placeholderTextColor="#9aa0a6"
                        maxLength={50}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description (optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe what this group is for..."
                        placeholderTextColor="#9aa0a6"
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Broadcast Lists</Text>
                    <Text style={styles.sectionSubtitle}>
                        {selectedLists.length} list{selectedLists.length !== 1 ? 's' : ''} selected
                    </Text>
                    
                    <TouchableOpacity style={styles.addButton} onPress={handleAddLists}>
                        <Text style={styles.addButtonText}>
                            {selectedLists.length > 0 ? 'Change Selection' : 'Add Broadcast Lists'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
                    <Text style={styles.createButtonText}>Create Group</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    },
    placeholder: {
        width: 50,
    },
    content: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 24,
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
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#202124',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#5f6368',
        marginBottom: 16,
    },
    addButton: {
        backgroundColor: '#DCF8C6',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#075E54',
        fontSize: 14,
        fontWeight: '500',
    },
    createButton: {
        backgroundColor: '#25D366',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});