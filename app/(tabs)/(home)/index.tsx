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
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Flame,
  Heart,
  Moon,
  Play,
  RotateCcw,
  Settings2,
  Sun,
  Sunrise,
  Sunset,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AnimatedPressable from '@/components/AnimatedPressable';
import ProgressRing from '@/components/ProgressRing';
import SettingsSheet from '@/components/SettingsSheet';
import { useColors } from '@/hooks/useColors';
import { getDayContent, getPhaseLabel } from '@/mocks/content';
import { getDailyEncouragement } from '@/mocks/encouragements';
import { useApp } from '@/providers/AppProvider';

function getTimeOfDay(): { greeting: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { greeting: 'Good morning', icon: Sunrise };
  if (hour >= 12 && hour < 17) return { greeting: 'Good afternoon', icon: Sun };
  if (hour >= 17 && hour < 21) return { greeting: 'Good evening', icon: Sunset };
  return { greeting: 'Good night', icon: Moon };
}

export default function HomeScreen() {
  const router = useRouter();
  const C = useColors();
  const { height } = useWindowDimensions();
  const {
    state,
    isLoading,
    hasCompletedSessionToday,
    graceWindowRemaining,
    resetJourney,
    continueDaily,
  } = useApp();
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(24)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(30)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const encouragement = useMemo(() => getDailyEncouragement(), []);
  const TimeIcon = timeOfDay.icon;

  const compact = height < 780;

  useEffect(() => {
    console.log('[HomeScreen] Rendering Amen home screen');

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.6,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(translateAnim, {
          toValue: 0,
          tension: 36,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ctaFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(ctaSlide, {
          toValue: 0,
          tension: 40,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, translateAnim, ctaFade, ctaSlide, glowPulse]);

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
  const completedDays = state.progress.filter((item) => item.completed).length;
  const phaseLabel = getPhaseLabel(state.currentDay);
  const showGraceBadge = graceWindowRemaining !== null && state.streakCount > 0;
  const graceUrgent = graceWindowRemaining === 0;
  const greetingName = state.user.firstName ? `, ${state.user.firstName}` : '';

  if (state.journeyComplete) {
    return (
      <View style={[styles.root, { backgroundColor: C.background }]}>
        <Animated.View style={[styles.ambientGlow, { opacity: glowPulse, backgroundColor: C.accent }]} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.completionContainer}>
            <View style={[styles.completionOrb, { borderColor: C.border, backgroundColor: C.surface }]}>
              <View style={[styles.completionInnerOrb, { backgroundColor: C.accentBg }]}>
                <Check size={28} color={C.accent} strokeWidth={2.4} />
              </View>
            </View>
            <Text style={[styles.completionEyebrow, { color: C.textMuted }]}>JOURNEY COMPLETE</Text>
            <Text style={[styles.completionTitle, { color: C.text }]}>30 days of{'\n'}showing up</Text>
            <Text style={[styles.completionMessage, { color: C.textSecondary }]}>
              You have built a sacred daily rhythm.{'\n'}Stay close and begin again.
            </Text>
            <AnimatedPressable
              style={[styles.primaryButtonShell, { shadowColor: C.accent }]}
              onPress={() => {
                console.log('[HomeScreen] Continue daily pressed from completion state');
                continueDaily();
              }}
              scaleValue={0.97}
              testID="continue-daily"
            >
              <LinearGradient
                colors={[C.accent, C.accentDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <RotateCcw size={17} color={C.white} />
                <Text style={styles.primaryButtonText}>Continue Daily</Text>
              </LinearGradient>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.ghostButton]}
              onPress={() => {
                console.log('[HomeScreen] Restart journey pressed from completion state');
                resetJourney();
              }}
              scaleValue={0.98}
              testID="restart-journey"
            >
              <Text style={[styles.ghostButtonText, { color: C.textMuted }]}>Restart 30 Days</Text>
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <Animated.View style={[styles.ambientGlow, { opacity: glowPulse, backgroundColor: C.accent }]} />
      <Animated.View style={[styles.ambientGlowBottom, { opacity: glowPulse, backgroundColor: C.accentDeep }]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={[styles.greetingPill, { backgroundColor: C.surface, borderColor: C.border }]}>
                <TimeIcon size={13} color={C.accent} />
                <Text style={[styles.greetingText, { color: C.textSecondary }]}>
                  {timeOfDay.greeting}{greetingName}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {state.streakCount > 0 && !showGraceBadge ? (
                <View style={[styles.streakPill, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <Flame size={13} color={C.accent} />
                  <Text style={[styles.streakText, { color: C.text }]}>{state.streakCount}</Text>
                </View>
              ) : null}

              {showGraceBadge ? (
                <View
                  style={[
                    styles.streakPill,
                    { backgroundColor: graceUrgent ? C.roseBg : C.surface, borderColor: C.border },
                  ]}
                >
                  <AlertTriangle size={13} color={graceUrgent ? C.rose : C.accent} />
                  <Text style={[styles.streakText, { color: graceUrgent ? C.rose : C.textSecondary }]}>
                    {graceUrgent ? 'Today' : 'Grace'}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => {
                  console.log('[HomeScreen] Opening settings sheet');
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSettingsVisible(true);
                }}
                style={[styles.settingsBtn, { backgroundColor: C.surface, borderColor: C.border }]}
                testID="open-settings"
              >
                <Settings2 size={17} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              },
            ]}
          >
            <Image
              source={require('@/assets/images/amen-icon-smooth-logo.png')}
              resizeMode="contain"
              style={[styles.wordmark, compact && styles.wordmarkCompact]}
              testID="amen-logo-home"
            />

            <View style={styles.taglineContainer}>
              <Text style={[styles.taglineText, { color: C.textSecondary }]}>
                30 days to discover God is{' '}
              </Text>
              <View style={[styles.highlightChip, { backgroundColor: C.accentBg }]}>
                <Text style={[styles.highlightChipText, { color: C.accent }]}>much closer</Text>
              </View>
              <Text style={[styles.taglineText, { color: C.textSecondary }]}> than you think.</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.todayCard,
              {
                backgroundColor: C.surface,
                borderColor: C.border,
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              },
            ]}
          >
            <View style={styles.todayCardTop}>
              <View style={styles.todayCardMeta}>
                <Text style={[styles.todayEyebrow, { color: C.textMuted }]}>TODAY&apos;S PRAYER</Text>
                <Text style={[styles.todayTitle, { color: C.text }]} numberOfLines={2}>
                  {dayContent.title}
                </Text>
              </View>
              <View style={[styles.phasePill, { backgroundColor: C.accentBg }]}>
                <Text style={[styles.phaseText, { color: C.accent }]}>{phaseLabel}</Text>
              </View>
            </View>

            <View style={styles.todayCardBody}>
              <View style={styles.ringArea}>
                <ProgressRing
                  progress={completedDays / 30}
                  size={compact ? 130 : 148}
                  strokeWidth={6}
                  backgroundColor={C.border}
                >
                  <Text style={[styles.ringDayLabel, { color: C.textMuted }]}>DAY</Text>
                  <Text style={[styles.ringDayNum, { color: C.text }]}>{state.currentDay}</Text>
                  <Text style={[styles.ringDayOf, { color: C.textMuted }]}>of 30</Text>
                </ProgressRing>
              </View>

              <View style={styles.rightColumn}>
                <View style={[styles.quoteCard, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
                  <Sparkles size={12} color={C.accent} style={styles.quoteIcon} />
                  <Text style={[styles.quoteText, { color: C.textSecondary }]} numberOfLines={compact ? 3 : 4}>
                    &ldquo;{encouragement.text}&rdquo;
                  </Text>
                  <Text style={[styles.quoteAuthor, { color: C.textMuted }]} numberOfLines={1}>
                    {encouragement.author}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.supportRow, { backgroundColor: C.accentBg, borderColor: C.border }]}
                  onPress={() => {
                    console.log('[HomeScreen] Navigating to support page');
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/paywall');
                  }}
                  activeOpacity={0.8}
                  testID="support-cause-home"
                >
                  <View style={[styles.supportHeart, { backgroundColor: C.accent }]}>
                    <Heart size={12} color={C.white} fill={C.white} />
                  </View>
                  <Text style={[styles.supportLabel, { color: C.text }]} numberOfLines={1}>Support This Cause</Text>
                  <ChevronRight size={14} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.ctaArea,
              {
                opacity: ctaFade,
                transform: [{ translateY: ctaSlide }],
              },
            ]}
          >
            {hasCompletedSessionToday ? (
              <View style={[styles.doneCard, { backgroundColor: C.sageBg, borderColor: C.sageLight }]}>
                <View style={[styles.doneIcon, { backgroundColor: C.sage }]}>
                  <Check size={16} color={C.white} strokeWidth={2.5} />
                </View>
                <View style={styles.doneTextArea}>
                  <Text style={[styles.doneTitle, { color: C.sageDark }]}>You showed up today</Text>
                  <Text style={[styles.doneSub, { color: C.sage }]}>
                    Come back tomorrow for day {Math.min(state.currentDay + 1, 30)}
                  </Text>
                </View>
              </View>
            ) : (
              <AnimatedPressable
                style={[styles.primaryButtonShell, { shadowColor: C.accent }]}
                onPress={() => {
                  console.log('[HomeScreen] Starting today\'s session');
                  router.push('/session');
                }}
                scaleValue={0.97}
                hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
                testID="begin-today"
              >
                <LinearGradient
                  colors={[C.accent, C.accentDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  <Play size={17} color={C.white} fill={C.white} />
                  <Text style={styles.primaryButtonText}>Begin Today</Text>
                </LinearGradient>
              </AnimatedPressable>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>

      <SettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  ambientGlow: {
    position: 'absolute',
    top: -160,
    left: '20%',
    width: 260,
    height: 260,
    borderRadius: 130,
    transform: [{ scaleX: 1.8 }],
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: 40,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    transform: [{ scaleX: 1.4 }],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  wordmark: {
    width: 200,
    height: 80,
    marginBottom: 12,
  },
  wordmarkCompact: {
    width: 170,
    height: 68,
    marginBottom: 8,
  },
  taglineContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    maxWidth: 310,
    paddingHorizontal: 8,
  },
  taglineText: {
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '400' as const,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  highlightChip: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 3,
    marginHorizontal: 3,
  },
  highlightChipText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  todayCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
  },
  todayCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  todayCardMeta: {
    flex: 1,
    marginRight: 12,
  },
  todayEyebrow: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 6,
  },
  todayTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '300' as const,
    letterSpacing: -0.8,
  },
  phasePill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  phaseText: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  todayCardBody: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  ringArea: {
    width: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ringDayLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 3,
    marginBottom: 3,
  },
  ringDayNum: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '200' as const,
    letterSpacing: -2,
  },
  ringDayOf: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
  },
  quoteCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flex: 1,
  },
  quoteIcon: {
    marginBottom: 6,
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as const,
    fontStyle: 'italic' as const,
  },
  quoteAuthor: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    marginTop: 6,
  },
  supportRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportHeart: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  ctaArea: {
    marginTop: 'auto',
  },
  primaryButtonShell: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 12,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
  },
  ghostButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  doneCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doneIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTextArea: {
    flex: 1,
  },
  doneTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  doneSub: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  completionContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  completionInnerOrb: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionEyebrow: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2.4,
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '200' as const,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 14,
  },
  completionMessage: {
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 32,
    fontWeight: '400' as const,
  },
});
