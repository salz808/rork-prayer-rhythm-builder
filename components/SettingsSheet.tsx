import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  Switch,
  Platform,
} from 'react-native';
import { X, Music2, Moon, Sun, AlignLeft, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/providers/AppProvider';
import { useColors } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import { Fonts } from '@/constants/fonts';
import { Soundscape } from '@/types';
import { SOUNDSCAPE_OPTIONS } from '@/constants/soundscapes';

const SOUNDSCAPE_ICONS: Record<Soundscape, typeof Music2> = {
  throughTheDoor: Music2,
  firstLight: Sun,
  reunion: Heart,
};

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ visible, onClose }: SettingsSheetProps) {
  const C = useColors();
  const router = useRouter();
  const { state, setSoundscape, toggleDarkMode, setFontSize } = useApp();
  const slideAnim = useRef(new Animated.Value(400)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 14,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, bgAnim]);

  const handleSoundscape = (id: Soundscape) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSoundscape(id);
  };

  const handleDarkMode = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleDarkMode();
  };

  const handleFontSize = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFontSize(state.fontSize === 'normal' ? 'large' : 'normal');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: bgAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: C.surface, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: C.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: C.text, fontFamily: Fonts.serifRegular }]}>Settings</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: C.overlayLight }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, { color: C.textMuted, fontFamily: Fonts.titleBold }]}>Music</Text>
          <Text style={[styles.sectionSub, { color: C.textMuted, fontFamily: Fonts.italic }]}>Choose what plays during prayer.</Text>
          <View style={styles.soundscapeGrid}>
            {SOUNDSCAPE_OPTIONS.map(({ id, label, description }) => {
              const isSelected = state.soundscape === id;
              const Icon = SOUNDSCAPE_ICONS[id];

              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.soundscapeCard,
                    {
                      backgroundColor: isSelected ? C.accentBg : C.surfaceAlt,
                      borderColor: isSelected ? C.accentDark : C.border,
                    },
                  ]}
                  onPress={() => handleSoundscape(id)}
                  activeOpacity={0.7}
                  testID={`soundscape-${id}`}
                >
                  <View
                    style={[
                      styles.soundscapeIconWrap,
                      { backgroundColor: isSelected ? C.accentLight : C.border },
                    ]}
                  >
                    <Icon size={16} color={isSelected ? C.accentDark : C.textMuted} />
                  </View>

                  <View style={styles.soundscapeTextWrap}>
                    <Text style={[styles.soundscapeLabel, { color: isSelected ? C.accentDark : C.text, fontFamily: Fonts.titleMedium }]}> 
                      {label}
                    </Text>
                    <Text style={[styles.soundscapeDesc, { color: isSelected ? C.accent : C.textMuted, fontFamily: Fonts.titleLight }]}> 
                      {description}
                    </Text>
                  </View>

                  {isSelected ? (
                    <View style={[styles.soundscapeBadge, { backgroundColor: C.accentDark }]}>
                      <Text style={[styles.soundscapeBadgeText, { fontFamily: Fonts.titleMedium }]}>Selected</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.divider, { backgroundColor: C.borderLight }]} />

          <Text style={[styles.sectionLabel, { color: C.textMuted, fontFamily: Fonts.titleBold }]}>Display</Text>

          <View style={[styles.toggleRow, { borderColor: C.borderLight }]}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, { backgroundColor: state.darkMode ? '#2E2318' : C.accentBg }]}>
                {state.darkMode ? (
                  <Moon size={16} color={C.accentDark} />
                ) : (
                  <Sun size={16} color={C.accentDark} />
                )}
              </View>
              <View>
                <Text style={[styles.toggleLabel, { color: C.text, fontFamily: Fonts.titleSemiBold }]}>Dark Mode</Text>
                <Text style={[styles.toggleSub, { color: C.textMuted, fontFamily: Fonts.titleLight }]}>
                  {state.darkMode ? 'Warm charcoal theme' : 'Light parchment theme'}
                </Text>
              </View>
            </View>
            <Switch
              value={state.darkMode}
              onValueChange={handleDarkMode}
              trackColor={{ false: C.border, true: C.accentDark }}
              thumbColor={Platform.OS === 'android' ? C.white : undefined}
              ios_backgroundColor={C.border}
              testID="dark-mode-toggle"
            />
          </View>

          <View style={[styles.toggleRow, { borderColor: C.borderLight }]}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, { backgroundColor: C.sageBg }]}>
                <AlignLeft size={16} color={C.sageDark} />
              </View>
              <View>
                <Text style={[styles.toggleLabel, { color: C.text, fontFamily: Fonts.titleSemiBold }]}>Larger Text</Text>
                <Text style={[styles.toggleSub, { color: C.textMuted, fontFamily: Fonts.titleLight }]}>
                  {state.fontSize === 'large' ? 'Larger prayer text' : 'Standard text size'}
                </Text>
              </View>
            </View>
            <Switch
              value={state.fontSize === 'large'}
              onValueChange={handleFontSize}
              trackColor={{ false: C.border, true: C.sageDark }}
              thumbColor={Platform.OS === 'android' ? C.white : undefined}
              ios_backgroundColor={C.border}
              testID="font-size-toggle"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: C.borderLight }]} />

          <TouchableOpacity
            style={[styles.supportRow, { backgroundColor: C.accentBg, borderColor: C.accentLight }]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
              setTimeout(() => router.push('/paywall'), 300);
            }}
            activeOpacity={0.8}
            testID="open-paywall"
          >
            <View style={[styles.supportIcon, { backgroundColor: C.accentDark }]}>
              <Heart size={16} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <View style={styles.supportText}>
              <Text style={[styles.supportTitle, { color: C.accentDark, fontFamily: Fonts.titleBold }]}>Support the App</Text>
              <Text style={[styles.supportSub, { color: C.accent, fontFamily: Fonts.italic }]}>Help fund development & missions</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,4,1,0.85)',
  },
  sheet: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingBottom: 44,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.18,
    shadowRadius: 36,
    elevation: 28,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  },
  sectionSub: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  soundscapeGrid: {
    gap: 10,
    marginBottom: 20,
  },
  soundscapeCard: {
    borderRadius: 18,
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  soundscapeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundscapeTextWrap: {
    flex: 1,
  },
  soundscapeLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  soundscapeDesc: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  soundscapeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  soundscapeBadgeText: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 1,
  },
  toggleSub: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  supportRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  supportSub: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
});
