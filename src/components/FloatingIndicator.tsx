import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Platform,
} from 'react-native';

interface FloatingIndicatorProps {
    hasConflict: boolean;
    conflictCount: number;
    onPress: () => void;
    visible: boolean;
}

export const FloatingIndicator: React.FC<FloatingIndicatorProps> = ({
    hasConflict,
    conflictCount,
    onPress,
    visible,
}) => {
    const [position] = useState(new Animated.ValueXY({ x: 0, y: 0 }));
    const [scale] = useState(new Animated.Value(1));
    const [opacity] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 5,
                    tension: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    useEffect(() => {
        // Pulse animation when conflict detected
        if (hasConflict && visible) {
            Animated.sequence([
                Animated.spring(scale, {
                    toValue: 1.2,
                    friction: 3,
                    tension: 100,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 3,
                    tension: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [hasConflict, visible]);

    if (!visible) return null;

    const backgroundColor = hasConflict ? '#F44336' : '#4CAF50';
    const statusText = hasConflict 
        ? `${conflictCount} conflict${conflictCount !== 1 ? 's' : ''}`
        : 'Safe';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ scale }],
                    backgroundColor,
                },
            ]}
        >
            <TouchableOpacity
                style={styles.touchable}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={styles.content}>
                    <Text style={styles.statusIcon}>
                        {hasConflict ? '⚠️' : '✅'}
                    </Text>
                    <Text style={styles.statusText}>{statusText}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 999,
    },
    touchable: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    statusText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});