import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { BroadcastList } from '../types';
import { BroadcastListCard } from '../components/BroadcastListCard';

type NavigationProp = any;
type RouteProp = any;

export const AddListsToGroupScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProp>();
    const { mode, groupId, selectedListIds: initialSelectedIds, onSelect } = route.params || {};
    
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
            navigation.goBack();
        } else if (mode === 'assignment' && groupId) {
            // Assign directly to group
            assignListsToGroup();
        } else {
            navigation.goBack();
        }
    };

    const assignListsToGroup = async () => {
        try {
            for (const listId of selectedIds) {
                await BroadcastGroupService.assignListToGroup(listId, groupId);
            }
            navigation.goBack();
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
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingBottom: 80,
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
        backgroundColor: '#2196F3',
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