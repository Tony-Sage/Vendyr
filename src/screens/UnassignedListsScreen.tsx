import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { BroadcastList } from '../types';
import { BroadcastListCard } from '../components/BroadcastListCard';

interface ScreenProps {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
}

export const UnassignedListsScreen: React.FC<ScreenProps> = ({ navigate, goBack }) => {
    const [lists, setLists] = useState<BroadcastList[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    useEffect(() => {
        loadUnassignedLists();
    }, []);

    const handleListPress = (listId: string) => {
        navigate('ListContacts', { listId });
    };

    const handleAssignPress = () => {
        if (lists.length === 0) {
            Alert.alert('No Lists', 'There are no unassigned lists to assign');
            return;
        }
        
        Alert.alert(
            'Assign List',
            'Select a group to assign all unassigned lists to',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Assign All', onPress: () => assignAllLists() },
            ]
        );
    };

    const assignAllLists = async () => {
        navigate('SetActiveGroup', { 
            selectionMode: true,
            onSelectGroup: async (groupId: string) => {
                for (const list of lists) {
                    await BroadcastGroupService.assignListToGroup(list.id, groupId);
                }
                await loadUnassignedLists();
                Alert.alert('Success', `${lists.length} list(s) assigned to group`);
            }
        });
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
                <Text style={styles.headerTitle}>Unassigned Lists</Text>
                <TouchableOpacity onPress={handleAssignPress} style={styles.assignButton}>
                    <Text style={styles.assignButtonText}>Assign All</Text>
                </TouchableOpacity>
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
                    <Text style={styles.emptyIcon}>✅</Text>
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'No matching lists found' : 'No unassigned lists'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {searchQuery 
                            ? 'Try a different search term' 
                            : 'All your broadcast lists are assigned to groups'}
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
                            onPress={handleListPress}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#2196F3',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#202124',
    },
    assignButton: {
        backgroundColor: '#e8f0fe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    assignButtonText: {
        color: '#2196F3',
        fontSize: 14,
        fontWeight: '500',
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
        paddingBottom: 20,
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