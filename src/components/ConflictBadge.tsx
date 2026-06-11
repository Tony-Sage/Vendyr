import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    TouchableOpacity,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConflictBadgeProps {
    count: number;
    size?: 'small' | 'medium' | 'large';
    onPress?: () => void;
    draggable?: boolean;
}

export const ConflictBadge: React.FC<ConflictBadgeProps> = ({ 
    count, 
    size = 'medium',
    onPress,
    draggable = true,
}) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const [scale] = useState(new Animated.Value(1));
    const [isDragging, setIsDragging] = useState(false);
    const componentSize = useRef({ width: 0, height: 0 });
    const dragStartPosition = useRef({ x: 0, y: 0 });
    const currentPosition = useRef({ x: 0, y: 0 });

    const updateCurrentPosition = (x: number, y: number) => {
        currentPosition.current = { x, y };
    };

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

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => draggable,
        onMoveShouldSetPanResponder: () => draggable,
        onPanResponderGrant: () => {
            setIsDragging(true);
            currentPosition.current = {
                x: (pan.x as any)._offset,
                y: (pan.y as any)._offset,
            };
            dragStartPosition.current = currentPosition.current;
            
            Animated.spring(scale, {
                toValue: 1.2,
                friction: 5,
                tension: 40,
                useNativeDriver: false,
            }).start();
        },
        onPanResponderMove: (_, gestureState) => {
            let newX = dragStartPosition.current.x + gestureState.dx;
            let newY = dragStartPosition.current.y + gestureState.dy;

            // Constrain to screen edges
            const padding = 10;
            const maxX = SCREEN_WIDTH - componentSize.current.width - padding;
            const maxY = SCREEN_HEIGHT - componentSize.current.height - padding;
            const minX = padding;
            const minY = padding;

            newX = Math.min(maxX, Math.max(minX, newX));
            newY = Math.min(maxY, Math.max(minY, newY));

            pan.setValue({ x: newX, y: newY });
            updateCurrentPosition(newX, newY);
        },
        onPanResponderRelease: () => {
            setIsDragging(false);
            Animated.spring(scale, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: false,
            }).start();
        },
    });

    if (count === 0) return null;

    return (
        <Animated.View
            style={[
                styles.badgeContainer,
                {
                    width: sizeStyles.width,
                    height: sizeStyles.height,
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale },
                    ],
                },
            ]}
            {...(draggable ? panResponder.panHandlers : {})}
            onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                componentSize.current = { width, height };
                if (currentPosition.current.x === 0 && currentPosition.current.y === 0) {
                    const initialX = -10;
                    const initialY = -10;
                    pan.setValue({ x: initialX, y: initialY });
                    updateCurrentPosition(initialX, initialY);
                }
            }}
        >
            <TouchableOpacity 
                style={[styles.badge, { width: sizeStyles.width, height: sizeStyles.height }]}
                onPress={!isDragging ? onPress : undefined}
                disabled={isDragging}
                activeOpacity={0.8}
            >
                <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>
                    {count > 9 ? '9+' : count}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    badgeContainer: {
        position: 'absolute',
        zIndex: 1000,
    },
    badge: {
        backgroundColor: '#F44336',
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
    text: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
});