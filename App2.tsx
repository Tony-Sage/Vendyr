import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, Alert, Linking, Platform, Vibration } from 'react-native';
import 'react-native-get-random-values';

// Import all screens
import { HomeScreen } from './src/screens/HomeScreen';
import { GroupCreationScreen } from './src/screens/GroupCreationScreen';
import { AddListsToGroupScreen } from './src/screens/AddListsToGroupScreen';
import { UnassignedListsScreen } from './src/screens/UnassignedListsScreen';
import { GroupDetailScreen } from './src/screens/GroupDetailScreen';
import { ListContactsScreen } from './src/screens/ListContactsScreen';
import { GroupInfoScreen } from './src/screens/GroupInfoScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SetActiveGroupScreen } from './src/screens/SetActiveGroupScreen';

// Services
import { initDatabase } from './src/database/database';
import { detectionService } from './src/services/DetectionService';
import { mockAccessibilityService } from './src/services/MockAccessibilityService';
import { FloatingIndicator } from './src/components/FloatingIndicator';
import { BroadcastGroupService } from './src/services/BroadcastGroupService';
import { mockBroadcastLists, mockListContacts, initializeMockData } from './src/mocks/mockData';
import * as Database from './src/database/database';

const Stack = createNativeStackNavigator();

export default function App() {
    const [isReady, setIsReady] = useState(false);
    const [hasConflict, setHasConflict] = useState(false);
    const [conflictCount, setConflictCount] = useState(0);
    const [showFloatingIndicator, setShowFloatingIndicator] = useState(true);
    const [lastConflicts, setLastConflicts] = useState<any[]>([]);

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // Initialize database
            await initDatabase();
            
            // Check if we have any data, if not, load mock data
            const groups = await BroadcastGroupService.getAllGroups();
            if (groups.length === 0) {
                console.log('No data found, loading mock data...');
                await loadMockData();
            }
            
            // Initialize detection service
            await detectionService.initialize();
            
            // Load settings
            const settings = await Database.getAppSettings();
            setShowFloatingIndicator(settings.floatingBubbleEnabled);
            
            // Start mock accessibility service for Phase 1
            // This simulates real-time contact selection detection
            mockAccessibilityService.startMonitoring((conflicts) => {
                if (conflicts.length > 0) {
                    setHasConflict(true);
                    setConflictCount(conflicts.length);
                    setLastConflicts(conflicts);
                    
                    // Vibration if enabled
                    if (settings.vibrationEnabled) {
                        Vibration.vibrate(500);
                    }
                    
                    // Alert for demo purposes
                    const conflictNames = conflicts.map(c => c.contactName).join(', ');
                    Alert.alert(
                        'Conflict Detected!',
                        `${conflictNames} already in "${conflicts[0].existingListName}"`,
                        [
                            { text: 'OK', onPress: () => setHasConflict(false) },
                            { text: 'View Details', onPress: () => showConflictDetails() },
                        ]
                    );
                } else {
                    setHasConflict(false);
                    setConflictCount(0);
                }
            });
            
            setIsReady(true);
        } catch (error) {
            console.error('Failed to initialize app:', error);
            Alert.alert('Error', 'Failed to initialize app. Please restart.');
        }
    };

    const loadMockData = async () => {
        for (const list of mockBroadcastLists) {
            await Database.addBroadcastList(list.id, list.name, list.groupId);
            const contacts = mockListContacts[list.id] || [];
            if (contacts.length > 0) {
                await Database.addContactsToList(list.id, contacts);
            }
        }
        console.log('Mock data loaded');
    };

    const showConflictDetails = () => {
        Alert.alert(
            'Conflict Details',
            lastConflicts.map(c => 
                `${c.contactName} (${c.phoneNumber})\nAlready in: ${c.existingListName}`
            ).join('\n\n'),
            [{ text: 'OK' }]
        );
    };

    const handleFloatingPress = () => {
        if (hasConflict) {
            showConflictDetails();
        } else {
            Alert.alert('Vendyr', 'No conflicts detected. Safe to proceed.');
        }
    };

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={{ marginTop: 16, color: '#5f6368' }}>Initializing Vendyr...</Text>
            </View>
        );
    }

    return (
        <>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Home"
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: '#ffffff',
                        },
                        headerTintColor: '#202124',
                        headerTitleStyle: {
                            fontWeight: '600',
                        },
                        headerBackTitle: 'Back',
                    }}
                >
                    <Stack.Screen 
                        name="Home" 
                        component={HomeScreen} 
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                        name="GroupCreation" 
                        component={GroupCreationScreen} 
                        options={{ title: 'New Group' }}
                    />
                    <Stack.Screen 
                        name="AddListsToGroup" 
                        component={AddListsToGroupScreen} 
                        options={{ title: 'Add Lists' }}
                    />
                    <Stack.Screen 
                        name="UnassignedLists" 
                        component={UnassignedListsScreen} 
                        options={{ title: 'Unassigned Lists' }}
                    />
                    <Stack.Screen 
                        name="GroupDetail" 
                        component={GroupDetailScreen} 
                        options={{ title: 'Group Details' }}
                    />
                    <Stack.Screen 
                        name="ListContacts" 
                        component={ListContactsScreen} 
                        options={{ title: 'List Contacts' }}
                    />
                    <Stack.Screen 
                        name="GroupInfo" 
                        component={GroupInfoScreen} 
                        options={{ title: 'Group Info' }}
                    />
                    <Stack.Screen 
                        name="Notifications" 
                        component={NotificationsScreen} 
                        options={{ title: 'Notifications' }}
                    />
                    <Stack.Screen 
                        name="Settings" 
                        component={SettingsScreen} 
                        options={{ title: 'Settings' }}
                    />
                    <Stack.Screen 
                        name="SetActiveGroup" 
                        component={SetActiveGroupScreen} 
                        options={{ title: 'Set Active Group' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
            
            {showFloatingIndicator && (
                <FloatingIndicator
                    hasConflict={hasConflict}
                    conflictCount={conflictCount}
                    onPress={handleFloatingPress}
                    visible={true}
                />
            )}
        </>
    );
}