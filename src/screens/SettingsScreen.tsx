import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import * as Database from "../database/database";
import { storage } from "../utils/storage";
//import { BroadcastGroupService } from '../services/BroadcastGroupService';
import { realAccessibilityService } from "../services/RealAccessibilityService";

interface ScreenProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

export const SettingsScreen: React.FC<ScreenProps> = ({ navigate, goBack }) => {
  const [settings, setSettings] = useState({
    floatingBubbleEnabled: true,
    pushNotificationsEnabled: true,
    vibrationEnabled: true,
    soundEnabled: true,
  });
  const [whatsappLinked, setWhatsappLinked] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const appSettings = await Database.getAppSettings();
      setSettings(appSettings);

      const linked = await storage.getHasLinkedWhatsApp();
      setWhatsappLinked(linked);

      const lastSync = await storage.getLastSyncTime();
      setLastSyncTime(lastSync);

      setAccessibilityEnabled(await realAccessibilityService.isAccessibilityEnabled());
        
      setOverlayEnabled(false);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (
    key: keyof typeof settings,
    value: boolean,
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await Database.updateAppSettings({ [key]: value });
  };

  const handleEnableAccessibility = () => {
    Alert.alert(
      "Enable Accessibility Service",
      'To detect contact selection in real-time, Vendyr needs accessibility permission.\n\nYou will be taken to system settings. Find "Vendyr" and turn it on.',
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () =>
            realAccessibilityService.requestAccessibilityPermission(),
        },
      ],
    );
  };

  const handleEnableOverlay = () => {
    Alert.alert(
      "Enable Overlay Permission",
      'To show the floating bubble over WhatsApp, Vendyr needs overlay permission.\n\nYou will be taken to system settings. Find "Vendyr" and enable "Display over other apps".',
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
  };

  const handleLinkWhatsApp = () => {
    Alert.alert(
      "Link WhatsApp",
      "To sync your broadcast lists, you need to link Vendyr to WhatsApp.\n\nThis feature will be available in the next update.",
      [{ text: "OK" }],
    );
  };

  const handleSyncNow = async () => {
    Alert.alert(
      "Sync",
      "Manual sync will be available in the next update.\n\nFor now, you can use mock data for testing.",
      [{ text: "OK" }],
    );
  };

  const handleExportData = async () => {
    Alert.alert("Export Data", "Export feature coming soon");
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all groups, lists, and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const db = Database.getDb();
            await db.runAsync("DELETE FROM broadcast_groups");
            await db.runAsync("DELETE FROM broadcast_lists");
            await db.runAsync("DELETE FROM list_contacts");
            await db.runAsync("DELETE FROM ungrouped_notifications");
            await Database.updateAppSettings({
              floatingBubbleEnabled: true,
              pushNotificationsEnabled: true,
              vibrationEnabled: true,
              soundEnabled: true,
            });
            await storage.clearAll();
            await loadSettings();
            Alert.alert("Success", "All data cleared");
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissions</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Accessibility Service</Text>
            <Text style={styles.settingDescription}>
              Required for real-time contact detection
            </Text>
          </View>
          <View style={styles.settingAction}>
            {accessibilityEnabled ? (
              <View style={styles.enabledBadge}>
                <Text style={styles.enabledText}>✅ Enabled</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleEnableAccessibility}>
                <Text style={styles.enableLink}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Overlay Permission</Text>
            <Text style={styles.settingDescription}>
              Required for floating bubble over WhatsApp
            </Text>
          </View>
          <View style={styles.settingAction}>
            {overlayEnabled ? (
              <View style={styles.enabledBadge}>
                <Text style={styles.enabledText}>✅ Enabled</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleEnableOverlay}>
                <Text style={styles.enableLink}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WhatsApp Connection</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Status</Text>
            <Text style={styles.settingDescription}>
              {whatsappLinked ? "Linked" : "Not linked"}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLinkWhatsApp}>
            <Text style={styles.linkButton}>
              {whatsappLinked ? "Re-link" : "Link WhatsApp"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Last Sync</Text>
            <Text style={styles.settingDescription}>
              {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : "Never"}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSyncNow}>
            <Text style={styles.linkButton}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Floating Bubble</Text>
            <Text style={styles.settingDescription}>
              Display floating indicator over WhatsApp
            </Text>
          </View>
          <Switch
            value={settings.floatingBubbleEnabled}
            onValueChange={(val) =>
              handleToggleSetting("floatingBubbleEnabled", val)
            }
            trackColor={{ false: "#e0e0e0", true: "#2196F3" }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive alerts when conflicts are detected
            </Text>
          </View>
          <Switch
            value={settings.pushNotificationsEnabled}
            onValueChange={(val) =>
              handleToggleSetting("pushNotificationsEnabled", val)
            }
            trackColor={{ false: "#e0e0e0", true: "#2196F3" }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Vibration</Text>
            <Text style={styles.settingDescription}>
              Vibrate on conflict detection
            </Text>
          </View>
          <Switch
            value={settings.vibrationEnabled}
            onValueChange={(val) =>
              handleToggleSetting("vibrationEnabled", val)
            }
            trackColor={{ false: "#e0e0e0", true: "#2196F3" }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sound</Text>
            <Text style={styles.settingDescription}>
              Play sound on conflict detection
            </Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(val) => handleToggleSetting("soundEnabled", val)}
            trackColor={{ false: "#e0e0e0", true: "#2196F3" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>

        <TouchableOpacity style={styles.dataButton} onPress={handleExportData}>
          <Text style={styles.dataButtonText}>Export Data (JSON)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dataButton, styles.dangerButton]}
          onPress={handleClearData}
        >
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Vendyr v1.0.0 (Phase 1)</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#2196F3",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#202124",
  },
  placeholder: {
    width: 50,
  },
  section: {
    backgroundColor: "#ffffff",
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202124",
    marginVertical: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: "#202124",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: "#5f6368",
  },
  settingAction: {
    minWidth: 80,
    alignItems: "flex-end",
  },
  enabledBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  enabledText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "500",
  },
  enableLink: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "500",
  },
  linkButton: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dataButton: {
    backgroundColor: "#f5f5f5",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  dataButtonText: {
    color: "#202124",
    fontSize: 14,
    fontWeight: "500",
  },
  dangerButton: {
    backgroundColor: "#ffebee",
  },
  dangerButtonText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
    color: "#9aa0a6",
  },
});
