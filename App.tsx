import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, Vibration, BackHandler, Linking } from 'react-native';
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
import { mockBroadcastLists, mockListContacts } from './src/mocks/mockData';
import * as Database from './src/database/database';

type ScreenName = 
  | 'Home'
  | 'GroupCreation'
  | 'AddListsToGroup'
  | 'UnassignedLists'
  | 'GroupDetail'
  | 'ListContacts'
  | 'GroupInfo'
  | 'Notifications'
  | 'Settings'
  | 'SetActiveGroup';

  interface NavigationParams {
    groupId?: string;
    listId?: string;
    listName?: string;
    mode?: string;
    selectedListIds?: string[];
    groupName?: string;           // ADD THIS
    groupDescription?: string;    // ADD THIS
    onSelect?: (listIds: string[]) => void;
    onComplete?: (listIds: string[]) => void;  // ADD THIS
    selectionMode?: boolean;
    onSelectGroup?: (groupId: string) => void;
    returnToScreen?: ScreenName;
    returnParams?: any;
  }

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const [navigationParams, setNavigationParams] = useState<NavigationParams>({});
  const [navigationHistory, setNavigationHistory] = useState<{screen: ScreenName, params: NavigationParams}[]>([]);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);
  const [showFloatingIndicator, setShowFloatingIndicator] = useState(true);
  const [lastConflicts, setLastConflicts] = useState<any[]>([]);

  const navigate = (screen: ScreenName, params?: NavigationParams) => {
    // Save current screen to history before navigating
    setNavigationHistory(prev => [...prev, { screen: currentScreen, params: navigationParams }]);
    setNavigationParams(params || {});
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (navigationHistory.length > 0) {
      const previous = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentScreen(previous.screen);
      setNavigationParams(previous.params);
    } else {
      setCurrentScreen('Home');
      setNavigationParams({});
    }
  };

  // Direct back to home (for cancel operations)
  const goToHome = () => {
    setNavigationHistory([]);
    setCurrentScreen('Home');
    setNavigationParams({});
  };

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentScreen !== 'Home') {
        goBack();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [currentScreen, navigationHistory]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await initDatabase();
      
      const groups = await BroadcastGroupService.getAllGroups();
      if (groups.length === 0) {
        console.log('No data found, loading mock data...');
        await loadMockData();
      }
      
      await detectionService.initialize();
      
      const settings = await Database.getAppSettings();
      setShowFloatingIndicator(settings.floatingBubbleEnabled);
      
      mockAccessibilityService.startMonitoring((conflicts) => {
        if (conflicts.length > 0) {
          setHasConflict(true);
          setConflictCount(conflicts.length);
          setLastConflicts(conflicts);
          
          if (settings.vibrationEnabled) {
            Vibration.vibrate(500);
          }
          
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#075E54' }}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={{ marginTop: 16, color: '#ffffff' }}>Initializing Vendyr...</Text>
      </View>
    );
  }

  const renderScreen = () => {
    const commonProps = { navigate, goBack, goToHome };

    switch (currentScreen) {
      case 'Home':
        return <HomeScreen {...commonProps} />;
      
      case 'GroupCreation':
        return <GroupCreationScreen {...commonProps} />;
      
        case 'AddListsToGroup':
          return (
            <AddListsToGroupScreen
              {...commonProps}
              mode={navigationParams.mode}
              groupId={navigationParams.groupId}
              selectedListIds={navigationParams.selectedListIds}
              groupName={navigationParams.groupName}
              groupDescription={navigationParams.groupDescription}
              onComplete={navigationParams.onComplete}
            />
          );
      
      case 'UnassignedLists':
        return <UnassignedListsScreen {...commonProps} />;
      
      case 'GroupDetail':
        return (
          <GroupDetailScreen
            {...commonProps}
            groupId={navigationParams.groupId || ''}
          />
        );
      
      case 'ListContacts':
        return (
          <ListContactsScreen
            {...commonProps}
            listId={navigationParams.listId || ''}
            listName={navigationParams.listName}
          />
        );
      
      case 'GroupInfo':
        return (
          <GroupInfoScreen
            {...commonProps}
            groupId={navigationParams.groupId || ''}
          />
        );
      
      case 'Notifications':
        return <NotificationsScreen {...commonProps} />;
      
      case 'Settings':
        return <SettingsScreen {...commonProps} />;
      
      case 'SetActiveGroup':
        return (
          <SetActiveGroupScreen
            {...commonProps}
            selectionMode={navigationParams.selectionMode}
            onSelectGroup={navigationParams.onSelectGroup}
          />
        );
      
      default:
        return <HomeScreen {...commonProps} />;
    }
  };

  return (
    <>
      {renderScreen()}
      {showFloatingIndicator && (
        <FloatingIndicator
          hasConflict={hasConflict}
          conflictCount={conflictCount}
          onPress={handleFloatingPress}
          visible={true}
          draggabele={true}
        />
      )}
    </>
  );
}