import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { BroadcastGroupService } from "../services/BroadcastGroupService";
import { BroadcastGroup } from "../types";

interface ScreenProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  goToHome: () => void;
  groupId: string;
}

export const GroupInfoScreen: React.FC<ScreenProps> = ({
  navigate,
  goBack,
  goToHome,
  groupId,
}) => {
  const [group, setGroup] = useState<BroadcastGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const groupData = await BroadcastGroupService.getGroupById(groupId);
      setGroup(groupData);
      setEditName(groupData?.name || "");
      setEditDescription(groupData?.description || "");
    } catch (error) {
      console.error("Failed to load group:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Group name is required");
      return;
    }

    setSaving(true);
    try {
      await BroadcastGroupService.updateGroup(
        groupId,
        editName.trim(),
        editDescription.trim() || null,
      );
      await loadGroup();
      setIsEditing(false);
      Alert.alert("Success", "Group updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update group");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Group",
      `Delete "${group?.name}"?\n\nThe group will be removed, but all broadcast lists will remain unassigned in WhatsApp.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await BroadcastGroupService.deleteGroup(groupId);
              goToHome();
            } catch (error) {
              Alert.alert("Error", "Failed to delete group");
              console.error(error);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#25D366" />
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
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Details</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {isEditing ? (
          // Edit Mode
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Group Name *</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g., Marketing, Sales, Support"
                placeholderTextColor="#9aa0a6"
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Describe what this group is for..."
                placeholderTextColor="#9aa0a6"
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
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // View Mode
          <>
            {/* Group Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Text style={styles.infoHeaderTitle}>Group Information</Text>
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.infoField}>
                  <Text style={styles.infoLabel}>Group Name</Text>
                  <Text style={styles.infoValue}>{group.name}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoField}>
                  <Text style={styles.infoLabel}>Description</Text>
                  <Text style={[styles.infoValue, !group.description && styles.placeholderText]}>
                    {group.description || "No description provided"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Statistics Section */}
            <View style={styles.statsSection}>
              <Text style={styles.statsTitle}>Statistics</Text>
              
              <View style={styles.statsCard}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Number of Lists</Text>
                  <Text style={styles.statValue}>{group.listCount || 0}</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Contacts</Text>
                  <Text style={styles.statValue}>{group.totalContacts || 0}</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Created On</Text>
                  <Text style={styles.statValue}>
                    {new Date(group.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
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
    backgroundColor: "#E5E5E5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E5E5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#075E54",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#ffffff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  placeholder: {
    width: 50,
  },
  content: {
    padding: 20,
  },
  // Edit mode styles (matching GroupCreationScreen)
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#202124",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ffffff",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#5f6368",
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#25D366",
    marginLeft: 10,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  // View mode styles
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  infoHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202124",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#25D366",
  },
  infoField: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#5f6368",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 16,
    color: "#202124",
  },
  placeholderText: {
    color: "#9aa0a6",
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  // Statistics section styles
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202124",
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 14,
    color: "#5f6368",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#202124",
  },
  statDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  // Delete button
  deleteButton: {
    backgroundColor: "#ffebee",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  deleteButtonText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "600",
  },
});