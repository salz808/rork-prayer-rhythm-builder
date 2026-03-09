import React, { useRef, useCallback, useState } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedPressableProps extends PressableProps {
  scaleValue?: number;
  haptic?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
}

function AnimatedPressableComponent({
  scaleValue = 0.96,
  haptic = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  onPressIn,
  onPressOut,
  onPress,
  children,
  style,
  hoverStyle,
  ...rest
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = useState(false);

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: scaleValue,
          tension: 220,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.82,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
      onPressIn?.(e);
    },
    [scaleAnim, opacityAnim, scaleValue, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 220,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      onPressOut?.(e);
    },
    [scaleAnim, opacityAnim, onPressOut]
  );

  const handlePress = useCallback(
    (e: any) => {
      if (haptic) {
        void Haptics.impactAsync(hapticStyle);
      }
      onPress?.(e);
    },
    [haptic, hapticStyle, onPress]
  );

  const hoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => {
      setHovered(true);
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        tension: 200,
        friction: 12,
        useNativeDriver: true,
      }).start();
    },
    onMouseLeave: () => {
      setHovered(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 12,
        useNativeDriver: true,
      }).start();
    },
  } : {};

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        style,
        hovered && hoverStyle,
      ]}
      {...(Platform.OS === 'web' ? hoverProps : {})}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default React.memo(AnimatedPressableComponent);
