import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    GestureResponderEvent,
} from 'react-native';

interface BroadcastListCardProps {
    id: string;
    name: string;
    contactCount: number;
    onPress: (id: string) => void;
    onLongPress?: (id: string) => void;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    showCheckbox?: boolean;
}

export const BroadcastListCard: React.FC<BroadcastListCardProps> = ({
    id,
    name,
    contactCount,
    onPress,
    onLongPress,
    isSelected = false,
    onSelect,
    showCheckbox = false,
}) => {
    const handlePress = () => {
        onPress(id);
    };

    const handleLongPress = () => {
        if (onLongPress) {
            onLongPress(id);
        }
    };

    const handleCheckboxPress = (e: GestureResponderEvent) => {
        e.stopPropagation();
        if (onSelect) {
            onSelect(id, !isSelected);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, isSelected && styles.selectedContainer]}
            onPress={handlePress}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
        >
            <View style={styles.leftSection}>
                <Text style={styles.icon}>📢</Text>
                <View style={styles.infoSection}>
                    <Text style={styles.name} numberOfLines={1}>
                        {name}
                    </Text>
                    <Text style={styles.contactCount}>
                        {contactCount} contact{contactCount !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>
            
            <View style={styles.rightSection}>
                {showCheckbox ? (
                    <TouchableOpacity onPress={handleCheckboxPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.chevron}>›</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    selectedContainer: {
        backgroundColor: '#e8f0fe',
        borderWidth: 1,
        borderColor: '#2196F3',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    icon: {
        fontSize: 28,
        marginRight: 12,
    },
    infoSection: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '500',
        color: '#202124',
        marginBottom: 2,
    },
    contactCount: {
        fontSize: 13,
        color: '#5f6368',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chevron: {
        fontSize: 24,
        color: '#9aa0a6',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#5f6368',
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});