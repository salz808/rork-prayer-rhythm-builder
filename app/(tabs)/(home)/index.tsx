import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Check, Flame, RotateCcw, Sun, Moon, Sunrise, Sunset, Settings2, AlertTriangle, Heart, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/providers/AppProvider';
import { useColors } from '@/hooks/useColors';
import { getDayContent, getPhaseLabel } from '@/mocks/content';
import { getDailyEncouragement } from '@/mocks/encouragements';
import ProgressRing from '@/components/ProgressRing';
import SettingsSheet from '@/components/SettingsSheet';
import AnimatedPressable from '@/components/AnimatedPressable';

function getTimeOfDay(): { greeting: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { greeting: 'Good morning', icon: Sunrise };
  if (hour >= 12 && hour < 17) return { greeting: 'Good afternoon', icon: Sun };
  if (hour >= 17 && hour < 21) return { greeting: 'Good evening', icon: Sunset };
  return { greeting: 'Good night', icon: Moon };
}

export default function HomeScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { state, isLoading, hasCompletedSessionToday, graceWindowRemaining, resetJourney, continueDaily } = useApp();
  const C = useColors();
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);

  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const TimeIcon = timeOfDay.icon;
  const encouragement = useMemo(() => getDailyEncouragement(), []);

  const compact = height < 760;
  const tiny = height < 700;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 45,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(buttonAnim, {
        toValue: 1,
        tension: 45,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, buttonAnim]);

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
  const completedDays = state.progress.filter((p) => p.completed).length;
  const phaseLabel = getPhaseLabel(state.currentDay);

  const showGraceBadge = graceWindowRemaining !== null && state.streakCount > 0;
  const graceUrgent = graceWindowRemaining === 0;

  if (state.journeyComplete) {
    return (
      <LinearGradient colors={[C.gradientStart, C.gradientEnd]} style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.completionContainer}>
            <View style={[styles.completionGlow, { backgroundColor: C.sageBg }]}>
              <View style={[styles.completionBadge, { backgroundColor: C.sageLight }]}>
                <Check size={30} color={C.sage} strokeWidth={2.5} />
              </View>
            </View>
            <Text style={[styles.completionTitle, { color: C.text }]}>30 Days Complete</Text>
            <Text style={[styles.completionMessage, { color: C.textSecondary }]}>You built a beautiful rhythm. Keep going daily.</Text>
            <View style={styles.completionActions}>
              <AnimatedPressable
                style={[styles.completionButton, { backgroundColor: C.accentBg, borderColor: C.accentLight }]}
                onPress={() => {
                  continueDaily();
                }}
                scaleValue={0.97}
                testID="continue-daily"
              >
                <View style={styles.completionButtonInner}>
                  <RotateCcw size={18} color={C.accentDark} />
                  <Text style={[styles.completionButtonText, { color: C.accentDark }]}>Continue Daily</Text>
                </View>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.completionButtonSecondary, { borderColor: C.border }]}
                onPress={() => {
                  resetJourney();
                }}
                scaleValue={0.97}
                testID="restart-journey"
              >
                <Text style={[styles.completionButtonSecondaryText, { color: C.textSecondary }]}>Restart 30 Days</Text>
              </AnimatedPressable>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[C.gradientStart, C.gradientMid, C.gradientEnd]} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, { paddingHorizontal: compact ? 18 : 24, paddingTop: compact ? 8 : 12 }]}> 
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}> 
            <View style={styles.brandRow}>
              <Image source={require('@/assets/images/amen-logo.png')} style={[styles.logo, { width: compact ? 96 : 120 }]} resizeMode="contain" testID="amen-logo-home" />
              <View style={styles.greetingRow}>
                <View style={[styles.timeIconWrap, { backgroundColor: C.accentBg }]}> 
                  <TimeIcon size={12} color={C.accentDark} />
                </View>
                <Text style={[styles.greeting, { color: C.text }]}> 
                  {timeOfDay.greeting}{state.user?.firstName ? `, ${state.user.firstName}` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {state.streakCount > 0 && !showGraceBadge && (
                <View style={[styles.streakBadge, { backgroundColor: C.warmLight }]}> 
                  <Flame size={13} color={C.warmDeep} />
                  <Text style={[styles.streakText, { color: C.warmDeep }]}>{state.streakCount}</Text>
                </View>
              )}
              {showGraceBadge && (
                <View style={[styles.graceBadge, { backgroundColor: graceUrgent ? '#3D1A1A' : '#3A2C14' }]}> 
                  <AlertTriangle size={11} color={graceUrgent ? '#E07070' : '#D4A050'} />
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSettingsVisible(true);
                }}
                style={[styles.settingsBtn, { backgroundColor: C.overlayLight }]}
                testID="open-settings"
              >
                <Settings2 size={17} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.mainCenter}>
            <Animated.View style={[styles.taglineWrap, { opacity: fadeAnim }]}>
              <Text style={[styles.tagline, { color: C.textSecondary }]}>30 days to discover God is </Text>
              <Text style={[styles.taglineHighlight, { color: C.accentDark }]}>much closer</Text>
              <Text style={[styles.tagline, { color: C.textSecondary }]}> than you think.</Text>
            </Animated.View>

            <Animated.View style={[styles.ringContainer, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}> 
              <ProgressRing
                progress={completedDays / 30}
                size={compact ? 180 : 206}
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
              <Text style={[styles.dayTitle, { color: C.text }]} numberOfLines={2}>
                {dayContent.title}
              </Text>
            </Animated.View>

            {!tiny && (
              <Animated.View style={[styles.supportSection, { opacity: fadeAnim }]}> 
                <TouchableOpacity
                  style={[styles.supportCauseBtn, { backgroundColor: C.surface, borderColor: C.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/paywall');
                  }}
                  activeOpacity={0.85}
                  testID="support-cause-home"
                >
                  <View style={[styles.supportCauseIcon, { backgroundColor: C.warmLight }]}> 
                    <Heart size={14} color={C.warmDeep} fill={C.warmDeep} />
                  </View>
                  <Text style={[styles.supportCauseTitle, { color: C.text }]}>Support This Cause</Text>
                  <ChevronRight size={16} color={C.textMuted} />
                </TouchableOpacity>
                {!compact && (
                  <Text style={[styles.quoteText, { color: C.textMuted }]} numberOfLines={1}>
                    “{encouragement.text}”
                  </Text>
                )}
              </Animated.View>
            )}
          </View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonAnim,
                transform: [
                  {
                    translateY: buttonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {hasCompletedSessionToday ? (
              <View style={[styles.completedToday, { backgroundColor: C.sageBg, borderColor: C.sageLight }]}> 
                <View style={[styles.completedIcon, { backgroundColor: C.sage }]}> 
                  <Check size={17} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View style={styles.completedTextWrap}>
                  <Text style={[styles.completedTodayText, { color: C.sageDark }]}>Today complete</Text>
                  <Text style={[styles.completedTodaySubtext, { color: C.sage }]}>Come back tomorrow</Text>
                </View>
              </View>
            ) : (
              <AnimatedPressable
                style={[styles.beginButton, { shadowColor: C.accentDeep }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/session');
                }}
                scaleValue={0.96}
                hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
                testID="begin-today"
              >
                <LinearGradient colors={[C.accentDark, C.accentDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.beginButtonGradient}>
                  <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.beginButtonText}>Begin Today</Text>
                </LinearGradient>
              </AnimatedPressable>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>

      <SettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  brandRow: {
    gap: 8,
    maxWidth: '75%',
  },
  logo: {
    height: 34,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
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
    fontWeight: '700',
  },
  graceBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCenter: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  taglineWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  taglineHighlight: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
  },
  ringContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 52,
    fontWeight: '200',
    letterSpacing: -3,
  },
  dayOf: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: -4,
  },
  dayInfo: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  phaseTag: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  phaseTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dayTitle: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.6,
    textAlign: 'center',
    lineHeight: 34,
  },
  supportSection: {
    gap: 8,
  },
  supportCauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  supportCauseIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportCauseTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  quoteText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 8,
  },
  beginButton: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
  },
  beginButtonGradient: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  beginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  completedToday: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
  },
  completedTextWrap: {
    alignItems: 'flex-start',
  },
  completedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTodayText: {
    fontSize: 15,
    fontWeight: '600',
  },
  completedTodaySubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  completionGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  completionMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 27,
    marginBottom: 36,
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
