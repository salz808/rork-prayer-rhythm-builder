import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Check, Flame, RotateCcw, Sun, Moon, Sunrise, Sunset, Settings2, AlertTriangle, Heart, Globe } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/providers/AppProvider';
import { useColors } from '@/hooks/useColors';
import { getDayContent, getPhaseLabel } from '@/mocks/content';
import ProgressRing from '@/components/ProgressRing';
import SettingsSheet from '@/components/SettingsSheet';
import AnimatedPressable from '@/components/AnimatedPressable';

function getTimeOfDay(): { greeting: string; icon: typeof Sun; period: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { greeting: 'Good morning', icon: Sunrise, period: 'morning' };
  if (hour >= 12 && hour < 17) return { greeting: 'Good afternoon', icon: Sun, period: 'afternoon' };
  if (hour >= 17 && hour < 21) return { greeting: 'Good evening', icon: Sunset, period: 'evening' };
  return { greeting: 'Good night', icon: Moon, period: 'night' };
}

export default function HomeScreen() {
  const router = useRouter();
  const { state, isLoading, hasCompletedSessionToday, graceWindowRemaining, resetJourney, continueDaily } = useApp();
  const C = useColors();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0.3)).current;

  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const TimeIcon = timeOfDay.icon;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(buttonAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, buttonAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 0.7,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0.3,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [breatheAnim]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: C.background }]}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  if (!state.user?.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  const dayContent = getDayContent(state.currentDay);
  const completedDays = state.progress.filter(p => p.completed).length;
  const phaseLabel = getPhaseLabel(state.currentDay);

  const handleBegin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/session');
  };

  const showGraceBadge = graceWindowRemaining !== null && state.streakCount > 0;
  const graceUrgent = graceWindowRemaining === 0;

  if (state.journeyComplete) {
    return (
      <LinearGradient
        colors={[C.gradientStart, C.gradientEnd]}
        style={styles.root}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.completionContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.completionContent, { opacity: fadeAnim }]}>
              <View style={[styles.completionGlow, { backgroundColor: C.sageBg }]}>
                <View style={[styles.completionBadge, { backgroundColor: C.sageLight }]}>
                  <Check size={30} color={C.sage} strokeWidth={2.5} />
                </View>
              </View>
              <Text style={[styles.completionTitle, { color: C.text }]}>30 Days Complete</Text>
              <Text style={[styles.completionMessage, { color: C.textSecondary }]}>
                You don{"'"}t need this app to pray anymore.{'\n\n'}
                But you{"'"}re always welcome back.{'\n\n'}
                Go build the life of prayer{'\n'}you were made for.
              </Text>
              <View style={styles.completionActions}>
                <AnimatedPressable
                  style={[styles.completionButton, { backgroundColor: C.accentBg, borderColor: C.accentLight }]}
                  onPress={() => { continueDaily(); }}
                  scaleValue={0.97}
                >
                  <View style={styles.completionButtonInner}>
                    <RotateCcw size={18} color={C.accentDark} />
                    <Text style={[styles.completionButtonText, { color: C.accentDark }]}>Continue Daily</Text>
                  </View>
                </AnimatedPressable>
                <AnimatedPressable
                  style={[styles.completionButtonSecondary, { borderColor: C.border }]}
                  onPress={() => { resetJourney(); }}
                  scaleValue={0.97}
                >
                  <Text style={[styles.completionButtonSecondaryText, { color: C.textSecondary }]}>Restart 30 Days</Text>
                </AnimatedPressable>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[C.gradientStart, C.gradientMid, C.gradientEnd]}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.greetingRow}>
              <View style={[styles.timeIconWrap, { backgroundColor: C.accentBg }]}>
                <TimeIcon size={15} color={C.accentDark} />
              </View>
              <Text style={[styles.greeting, { color: C.text }]}>
                {timeOfDay.greeting}{state.user?.firstName ? `, ${state.user.firstName}` : ''}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {state.streakCount > 0 && !showGraceBadge && (
                <View style={[styles.streakBadge, { backgroundColor: C.warmLight }]}>
                  <Flame size={13} color={C.warmDeep} />
                  <Text style={[styles.streakText, { color: C.warmDeep }]}>{state.streakCount}</Text>
                </View>
              )}
              {showGraceBadge && (
                <View style={[
                  styles.graceBadge,
                  { backgroundColor: graceUrgent ? '#3D1A1A' : '#3A2C14' },
                ]}>
                  <AlertTriangle size={11} color={graceUrgent ? '#E07070' : '#D4A050'} />
                  <View>
                    <Text style={[styles.graceBadgeTop, { color: graceUrgent ? '#E07070' : '#D4A050' }]}>
                      {graceUrgent ? 'Last grace day' : '1 grace day left'}
                    </Text>
                    <Text style={[styles.graceBadgeStreak, { color: graceUrgent ? '#C05050' : '#B07030' }]}>
                      {state.streakCount} day streak
                    </Text>
                  </View>
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSettingsVisible(true);
                }}
                style={[styles.settingsBtn, { backgroundColor: C.overlayLight }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                testID="open-settings"
              >
                <Settings2 size={17} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.ringContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Animated.View style={[styles.ringGlow, { backgroundColor: C.accentBg, opacity: breatheAnim }]} />
            <ProgressRing
              progress={completedDays / 30}
              size={220}
              strokeWidth={7}
              color={C.accent}
              backgroundColor={C.border}
            >
              <Text style={[styles.dayLabel, { color: C.textMuted }]}>DAY</Text>
              <Text style={[styles.dayNumber, { color: C.text }]}>{state.currentDay}</Text>
              <Text style={[styles.dayOf, { color: C.textMuted }]}>of 30</Text>
            </ProgressRing>
          </Animated.View>

          <Animated.View style={[styles.dayInfo, { opacity: fadeAnim }]}>
            <View style={[styles.phaseTag, { backgroundColor: C.accentBg }]}>
              <Text style={[styles.phaseTagText, { color: C.accentDark }]}>{phaseLabel}</Text>
            </View>
            <Text style={[styles.dayTitle, { color: C.text }]}>{dayContent.title}</Text>
          </Animated.View>

          <Animated.View style={[styles.supportSection, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={[styles.supportCauseBtn, { backgroundColor: C.surface, borderColor: C.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/paywall');
              }}
              activeOpacity={0.8}
              testID="support-cause-home"
            >
              <View style={[styles.supportCauseIcon, { backgroundColor: C.warmLight }]}>
                <Heart size={16} color={C.warmDeep} fill={C.warmDeep} />
              </View>
              <View style={styles.supportCauseText}>
                <Text style={[styles.supportCauseTitle, { color: C.text }]}>Support This Cause</Text>
                <Text style={[styles.supportCauseSub, { color: C.textMuted }]}>Fund development & global missions</Text>
              </View>
              <Globe size={16} color={C.textMuted} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonAnim,
                transform: [
                  {
                    translateY: buttonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {hasCompletedSessionToday ? (
              <View style={[styles.completedToday, { backgroundColor: C.sageBg, borderColor: C.sageLight }]}>
                <View style={[styles.completedIcon, { backgroundColor: C.sage }]}>
                  <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={[styles.completedTodayText, { color: C.sageDark }]}>Today{"'"}s prayer complete</Text>
                  <Text style={[styles.completedTodaySubtext, { color: C.sage }]}>Come back tomorrow</Text>
                </View>
              </View>
            ) : (
              <AnimatedPressable
                style={[styles.beginButton, { shadowColor: C.accentDeep }]}
                onPress={handleBegin}
                scaleValue={0.96}
                hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
                testID="begin-today"
              >
                <LinearGradient
                  colors={[C.accentDark, C.accentDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.beginButtonGradient}
                >
                  <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.beginButtonText}>Begin Today</Text>
                </LinearGradient>
              </AnimatedPressable>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <SettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  timeIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  graceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  graceBadgeTop: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.1,
  },
  graceBadgeStreak: {
    fontSize: 10,
    fontWeight: '500' as const,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 36,
    position: 'relative' as const,
  },
  ringGlow: {
    position: 'absolute' as const,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 4,
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 52,
    fontWeight: '200' as const,
    letterSpacing: -3,
  },
  dayOf: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: -4,
  },
  dayInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  phaseTag: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  phaseTagText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  dayTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 'auto' as const,
    paddingTop: 8,
  },
  beginButton: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  beginButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  beginButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  completedToday: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 22,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
  },
  completedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTodayText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  completedTodaySubtext: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  completionContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  completionContent: {
    alignItems: 'center',
  },
  completionGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  completionBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionTitle: {
    fontSize: 30,
    fontWeight: '700' as const,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  completionMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 44,
  },
  completionActions: {
    gap: 12,
    width: '100%',
  },
  completionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  completionButtonInner: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  completionButtonSecondary: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  completionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  supportSection: {
    width: '100%',
    marginBottom: 24,
  },
  supportCauseBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  supportCauseIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportCauseText: {
    flex: 1,
  },
  supportCauseTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  supportCauseSub: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
