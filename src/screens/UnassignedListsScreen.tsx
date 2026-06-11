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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { BroadcastList } from '../types';
import { BroadcastListCard } from '../components/BroadcastListCard';

type NavigationProp = any;

export const UnassignedListsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
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

    useFocusEffect(
        useCallback(() => {
            loadUnassignedLists();
        }, [])
    );

    const handleListPress = (listId: string) => {
        navigation.navigate('ListContacts', { listId });
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
        // Navigate to group selection
        navigation.navigate('SetActiveGroup', { 
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
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