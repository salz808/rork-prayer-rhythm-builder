import React from 'react';
import { View } from 'react-native';

interface RadialGlowProps {
  size: number;
  r?: number;
  g?: number;
  b?: number;
  maxOpacity?: number;
  style?: object;
}

const RING_SCALES = [1.0, 0.82, 0.64, 0.48, 0.33, 0.2, 0.1];
const RING_OPACITY_WEIGHTS = [0.08, 0.14, 0.22, 0.35, 0.52, 0.72, 1.0];

export default function RadialGlow({
  size,
  r = 200,
  g = 137,
  b = 74,
  maxOpacity = 0.18,
  style,
}: RadialGlowProps) {
  return (
    <View
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
      pointerEvents="none"
    >
      {RING_SCALES.map((scale, i) => {
        const s = size * scale;
        const opacity = maxOpacity * RING_OPACITY_WEIGHTS[i];
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: s,
              height: s,
              borderRadius: s / 2,
              backgroundColor: `rgba(${r},${g},${b},${opacity})`,
            }}
          />
        );
      })}
    </View>
  );
}
