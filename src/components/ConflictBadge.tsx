import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConflictBadgeProps {
    count: number;
    size?: 'small' | 'medium' | 'large';
}

export const ConflictBadge: React.FC<ConflictBadgeProps> = ({ count, size = 'medium' }) => {
    if (count === 0) return null;
    
    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return { width: 18, height: 18, fontSize: 10 };
            case 'large':
                return { width: 28, height: 28, fontSize: 14 };
            default:
                return { width: 22, height: 22, fontSize: 12 };
        }
    };
    
    const sizeStyles = getSizeStyles();
    
    return (
        <View style={[styles.badge, { width: sizeStyles.width, height: sizeStyles.height }]}>
            <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>
                {count > 9 ? '9+' : count}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        backgroundColor: '#F44336',
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    text: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
});