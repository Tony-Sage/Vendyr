import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    PanResponder,
    Dimensions,
    Platform,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    const pan = useRef(new Animated.ValueXY()).current;
    const [scale] = useState(new Animated.Value(1));
    const [opacity] = useState(new Animated.Value(0));
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPosition = useRef({ x: 0, y: 0 });
    const componentSize = useRef({ width: 0, height: 0 });
    const currentPosition = useRef({ x: 0, y: 0 });

    // Track current position using useRef without listeners
    const updateCurrentPosition = (x: number, y: number) => {
        currentPosition.current = { x, y };
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            setIsDragging(true);
            // Get current position from the animated value's current offset
            currentPosition.current = {
                x: (pan.x as any)._offset,
                y: (pan.y as any)._offset,
            };
            dragStartPosition.current = currentPosition.current;
            
            // Scale down slightly when grabbing
            Animated.spring(scale, {
                toValue: 0.95,
                friction: 5,
                tension: 40,
                useNativeDriver: false, // Changed to false for consistency
            }).start();
        },
        onPanResponderMove: (_, gestureState) => {
            let newX = dragStartPosition.current.x + gestureState.dx;
            let newY = dragStartPosition.current.y + gestureState.dy;

            // Constrain to screen edges with padding
            const padding = 20;
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
            // Snap to nearest edge
            snapToEdge();
            
            // Scale back to normal
            Animated.spring(scale, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: false, // Changed to false for consistency
            }).start();
        },
    });

    const snapToEdge = () => {
        const currentX = currentPosition.current.x;
        const currentY = currentPosition.current.y;
        
        // Determine if we should snap to left or right edge
        const snapToRight = currentX > SCREEN_WIDTH / 2;
        let targetX = currentX;
        
        if (snapToRight) {
            // Snap to right edge
            targetX = SCREEN_WIDTH - componentSize.current.width - 20;
        } else {
            // Snap to left edge
            targetX = 20;
        }
        
        // Animate to snapped position
        Animated.spring(pan, {
            toValue: { x: targetX, y: currentY },
            friction: 7,
            tension: 40,
            useNativeDriver: false, // Changed to false
        }).start(() => {
            // Update current position after animation completes
            updateCurrentPosition(targetX, currentY);
        });
    };

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 5,
                    tension: 200,
                    useNativeDriver: false, // Changed to false
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false, // Changed to false
                }),
            ]).start();
        } else {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false, // Changed to false
            }).start();
        }
    }, [visible]);

    useEffect(() => {
        // Pulse animation when conflict detected
        if (hasConflict && visible && !isDragging) {
            Animated.sequence([
                Animated.spring(scale, {
                    toValue: 1.2,
                    friction: 3,
                    tension: 100,
                    useNativeDriver: false, // Changed to false
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 3,
                    tension: 100,
                    useNativeDriver: false, // Changed to false
                }),
            ]).start();
        }
    }, [hasConflict, visible, isDragging]);

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
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale },
                    ],
                    opacity,
                    backgroundColor,
                },
            ]}
            {...panResponder.panHandlers}
            onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                componentSize.current = { width, height };
                // Set initial position if not set
                if (currentPosition.current.x === 0 && currentPosition.current.y === 0) {
                    const initialX = SCREEN_WIDTH - width - 20;
                    const initialY = SCREEN_HEIGHT - 100;
                    pan.setValue({ x: initialX, y: initialY });
                    updateCurrentPosition(initialX, initialY);
                }
            }}
        >
            <TouchableOpacity
                style={styles.touchable}
                onPress={!isDragging ? onPress : undefined}
                activeOpacity={0.8}
                disabled={isDragging}
            >
                <View style={styles.content}>
                    <Text style={styles.statusText}>{statusText}</Text>
                    <View style={styles.dragHandle}>
                        <View style={styles.dragDot} />
                        <View style={styles.dragDot} />
                        <View style={styles.dragDot} />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
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
    statusText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
    },
    dragHandle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
        paddingLeft: 8,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.3)',
    },
    dragDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.7)',
        marginHorizontal: 1.5,
    },
});