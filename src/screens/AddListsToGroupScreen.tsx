import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { BroadcastList } from '../types';
import { BroadcastListCard } from '../components/BroadcastListCard';

interface ScreenProps {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    mode?: string;
    groupId?: string;
    selectedListIds?: string[];
    onSelect?: (listIds: string[]) => void;
}

export const AddListsToGroupScreen: React.FC<ScreenProps> = ({ 
    navigate, 
    goBack, 
    mode, 
    groupId, 
    selectedListIds: initialSelectedIds, 
    onSelect 
}) => {
    const [lists, setLists] = useState<BroadcastList[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds || []));

    useEffect(() => {
        loadUnassignedLists();
    }, []);

    const loadUnassignedLists = async () => {
        try {
            const unassignedLists = await BroadcastGroupService.getUnassignedLists();
            setLists(unassignedLists);
        } catch (error) {
            console.error('Failed to load unassigned lists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectList = (listId: string, selected: boolean) => {
        const newSelected = new Set(selectedIds);
        if (selected) {
            newSelected.add(listId);
        } else {
            newSelected.delete(listId);
        }
        setSelectedIds(newSelected);
    };

    const handleConfirm = () => {
        const selectedListIds = Array.from(selectedIds);
        if (mode === 'creation' && onSelect) {
            onSelect(selectedListIds);
            goBack();
        } else if (mode === 'assignment' && groupId) {
            assignListsToGroup();
        } else {
            goBack();
        }
    };

    const assignListsToGroup = async () => {
        try {
            for (const listId of selectedIds) {
                await BroadcastGroupService.assignListToGroup(listId, groupId!);
            }
            goBack();
        } catch (error) {
            console.error('Failed to assign lists:', error);
        }
    };

    const filteredLists = searchQuery.trim()
        ? lists.filter(list => 
            list.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : lists;

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
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Lists</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Search broadcast lists..."
                    placeholderTextColor="#9aa0a6"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {filteredLists.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'No matching lists found' : 'No unassigned broadcast lists'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {searchQuery 
                            ? 'Try a different search term' 
                            : 'Create broadcast lists in WhatsApp first, then sync them here'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredLists}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BroadcastListCard
                            id={item.id}
                            name={item.name}
                            contactCount={item.contactCount || 0}
                            onPress={() => {}}
                            showCheckbox={true}
                            isSelected={selectedIds.has(item.id)}
                            onSelect={handleSelectList}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {filteredLists.length > 0 && (
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>
                        ✓ Confirm ({selectedIds.size} selected)
                    </Text>
                </TouchableOpacity>
            )}
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
    confirmButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#25D366',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    confirmButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});