import React, { useRef, useCallback } from 'react';
import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedPressableProps extends TouchableOpacityProps {
  scaleValue?: number;
  haptic?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

function AnimatedPressableComponent({
  scaleValue = 0.97,
  haptic = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  onPressIn,
  onPressOut,
  onPress,
  children,
  style,
  ...rest
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.spring(scaleAnim, {
        toValue: scaleValue,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }).start();
      onPressIn?.(e);
    },
    [scaleAnim, scaleValue, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }).start();
      onPressOut?.(e);
    },
    [scaleAnim, onPressOut]
  );

  const handlePress = useCallback(
    (e: any) => {
      if (haptic) {
        Haptics.impactAsync(hapticStyle);
      }
      onPress?.(e);
    },
    [haptic, hapticStyle, onPress]
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(AnimatedPressableComponent);
