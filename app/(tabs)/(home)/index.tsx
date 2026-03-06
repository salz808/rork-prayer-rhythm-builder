import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Check,
  ChevronRight,
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
import SettingsSheet from '@/components/SettingsSheet';
import { useColors } from '@/hooks/useColors';
import { Fonts } from '@/constants/fonts';
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

function getEncouragingSub(completedDays: number): string {
  if (completedDays === 0) return "You showed up. That's everything.";
  if (completedDays === 1) return 'Day 1 complete. The groove has begun.';
  if (completedDays <= 3) return 'Something real is forming.';
  if (completedDays <= 6) return 'Keep walking in freedom.';
  if (completedDays === 7) return 'One week. You are not the same.';
  if (completedDays <= 13) return 'Your prayer life is becoming real.';
  if (completedDays === 14) return 'Halfway. Look how far you\'ve come.';
  if (completedDays <= 20) return 'Look at the confidence you\'re carrying.';
  if (completedDays === 21) return 'Three weeks. Something has changed.';
  if (completedDays <= 29) return 'Almost there. You\'re ready.';
  return "You don't need this app anymore. But you're always welcome.";
}

export default function HomeScreen() {
  const router = useRouter();
  const C = useColors();

  const {
    state,
    isLoading,
    hasCompletedSessionToday,
    graceWindowRemaining,
    resetJourney,
    continueDaily,
  } = useApp();
  const isLargeFont = state.fontSize === 'large';
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(24)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(30)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const encouragement = useMemo(() => getDailyEncouragement(), []);

  useEffect(() => {
    console.log('[HomeScreen] Rendering Amen home screen');

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.65,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.stagger(100, [
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
  const greetingName = state.user.firstName || 'Friend';
  const progressPercent = Math.max(3.3, (completedDays / 30) * 100);
  const encouragingSub = getEncouragingSub(completedDays);

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progressPercent,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [progressPercent, progressWidth]);

  if (state.journeyComplete) {
    return (
      <View style={[styles.root, { backgroundColor: C.background }]}>
        <Animated.View style={[styles.ambientGlowOuter, { opacity: Animated.multiply(glowPulse, 0.4), backgroundColor: C.accent }]} />
        <Animated.View style={[styles.ambientGlow, { opacity: glowPulse, backgroundColor: C.accent }]} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.completionContainer}>
            <View style={[styles.completionOrb, { borderColor: C.border, backgroundColor: C.surface }]}>
              <View style={[styles.completionInnerOrb, { backgroundColor: C.accentBg }]}>
                <Check size={28} color={C.accent} strokeWidth={2.4} />
              </View>
            </View>
            <Text style={[styles.completionEyebrow, { color: C.textMuted, fontFamily: Fonts.titleBold }]}>JOURNEY COMPLETE</Text>
            <Text style={[styles.completionTitle, { color: C.text, fontFamily: Fonts.serifLight }]}>30 days of{'\n'}showing up</Text>
            <Text style={[styles.completionMessage, { color: C.textSecondary, fontFamily: Fonts.italic }]}>
              You have built a sacred daily rhythm.{'\n'}Stay close and begin again.
            </Text>
            <AnimatedPressable
              style={[styles.primaryButtonShell, { shadowColor: C.accent }]}
              onPress={() => {
                console.log('[HomeScreen] Continue daily pressed from completion state');
                continueDaily();
              }}
              scaleValue={0.96}
              testID="continue-daily"
            >
              <LinearGradient
                colors={['#D49550', '#A86B2A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <RotateCcw size={17} color="#180C02" />
                <Text style={[styles.primaryButtonText, { color: '#180C02', fontFamily: Fonts.titleMedium }]}>Continue Daily</Text>
              </LinearGradient>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.ghostButton]}
              onPress={() => {
                console.log('[HomeScreen] Restart journey pressed from completion state');
                resetJourney();
              }}
              scaleValue={0.97}
              testID="restart-journey"
            >
              <Text style={[styles.ghostButtonText, { color: C.textMuted, fontFamily: Fonts.titleSemiBold }]}>Restart 30 Days</Text>
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <Animated.View style={[styles.ambientGlowOuter, { opacity: Animated.multiply(glowPulse, 0.4), backgroundColor: C.accent }]} />
      <Animated.View style={[styles.ambientGlow, { opacity: glowPulse, backgroundColor: C.accent }]} />
      <Animated.View style={[styles.ambientGlowBottom, { opacity: Animated.multiply(glowPulse, 0.3), backgroundColor: C.accent }]} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }],
            }}
          >
            <View style={styles.topBar}>
              <View style={styles.topBarLeft}>
                {state.streakCount > 0 && !showGraceBadge ? (
                  <View style={[styles.streakPill, { backgroundColor: C.accentBg, borderColor: C.border }]}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={[styles.streakText, { color: C.accentDark, fontFamily: Fonts.titleMedium }]}>
                      {state.streakCount}-day streak
                    </Text>
                  </View>
                ) : null}
                {showGraceBadge ? (
                  <View
                    style={[
                      styles.streakPill,
                      { backgroundColor: graceUrgent ? C.roseBg : C.accentBg, borderColor: C.border },
                    ]}
                  >
                    <AlertTriangle size={13} color={graceUrgent ? C.rose : C.accent} />
                    <Text style={[styles.streakText, { color: graceUrgent ? C.rose : C.textSecondary, fontFamily: Fonts.titleMedium }]}>
                      {graceUrgent ? 'Pray today' : 'Grace window'}
                    </Text>
                  </View>
                ) : null}
              </View>
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

            <View style={styles.headerSection}>
              <Text style={[styles.greetingLabel, { color: C.accent, fontFamily: Fonts.titleMedium }]}>
                {timeOfDay.greeting}
              </Text>
              <Text style={[styles.nameTitle, { color: C.text, fontFamily: Fonts.serifLight }, isLargeFont && { fontSize: 46, lineHeight: 50 }]}>{greetingName}</Text>
              <Text style={[styles.subText, { color: C.textSecondary, fontFamily: Fonts.italic }, isLargeFont && { fontSize: 18 }]}>{encouragingSub}</Text>
            </View>

            <View style={[styles.streakCard, { backgroundColor: C.accentBg, borderColor: C.border }]}>
              <Text style={styles.streakCardEmoji}>🔥</Text>
              <Text style={[styles.streakCardText, { color: C.textSecondary }]}>
                <Text style={[styles.streakCardStrong, { color: C.accentDark, fontFamily: Fonts.titleMedium }]}>
                  {state.streakCount > 0 ? `${state.streakCount}-day streak` : 'Start your streak'}
                </Text>
                {' · Keep walking in freedom'}
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }],
            }}
          >
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: C.accent, fontFamily: Fonts.titleMedium }]}>JOURNEY TO WHOLENESS</Text>
                <Text style={[styles.progressDay, { color: C.textMuted }]}>
                  Day {state.currentDay} of 30
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }],
            }}
          >
            <Text style={[styles.sectionEyebrow, { color: C.accent, fontFamily: Fonts.titleMedium }]}>TODAY&apos;S PRACTICE</Text>

            <AnimatedPressable
              style={[styles.todayCard, { borderColor: C.border }]}
              onPress={() => {
                if (!hasCompletedSessionToday) {
                  console.log('[HomeScreen] Starting today\'s session');
                  router.push('/session');
                }
              }}
              scaleValue={0.97}
              testID="begin-today"
            >
              <LinearGradient
                colors={[C.surfaceElevated, C.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.todayCardInner}
              >
                <View style={[styles.todayCardTopLine, { backgroundColor: C.accent }]} />
                <View style={[styles.todayCardGlow, { backgroundColor: C.accent }]} />

                <Text style={[styles.todayCardDay, { color: C.accent, fontFamily: Fonts.titleSemiBold }]}>
                  {'Day ' + state.currentDay + ' · ' + phaseLabel}
                </Text>
                <Text style={[styles.todayCardTitle, { color: C.text, fontFamily: Fonts.serifLight }, isLargeFont && { fontSize: 34, lineHeight: 38 }]}>
                  {dayContent.title}
                </Text>
                <Text style={[styles.todayCardDesc, { color: C.textSecondary, fontFamily: Fonts.italic }, isLargeFont && { fontSize: 18 }]} numberOfLines={3}>
                  {dayContent.settle}
                </Text>

                <View style={[styles.todayCardRule, { backgroundColor: C.border }]} />

                <View style={styles.triadPills}>
                  {['Thank', 'Repent', 'Invite', 'Ask', 'Declare'].map((pill) => (
                    <View key={pill} style={[styles.triadPill, { borderColor: C.border }]}>
                      <Text style={[styles.triadPillText, { color: C.accent, fontFamily: Fonts.titleMedium }]}>{pill}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.todayCardRule, { backgroundColor: C.border }]} />

                {hasCompletedSessionToday ? (
                  <View style={styles.todayCardCta}>
                    <View style={[styles.completedBadge, { backgroundColor: C.sageBg }]}>
                      <Check size={12} color={C.sage} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.todayCardCtaText, { color: C.sage, fontFamily: Fonts.titleMedium }]}>Completed today</Text>
                  </View>
                ) : (
                  <View style={styles.todayCardCta}>
                    <Text style={[styles.todayCardCtaText, { color: C.accent, fontFamily: Fonts.titleMedium }]}>
                      Begin today&apos;s prayer
                    </Text>
                    <ChevronRight size={14} color={C.accent} />
                  </View>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </Animated.View>

          <Animated.View
            style={{
              opacity: ctaFade,
              transform: [{ translateY: ctaSlide }],
            }}
          >
            <Text style={[styles.sectionEyebrow, { color: C.accent, fontFamily: Fonts.titleMedium }]}>30-DAY JOURNEY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayStripContent}
              style={styles.dayStrip}
            >
              {Array.from({ length: 30 }, (_, i) => {
                const dayNum = i + 1;
                const isDone = state.progress.some(p => p.day === dayNum && p.completed);
                const isToday = dayNum === state.currentDay;
                const isLocked = dayNum > state.currentDay;

                return (
                  <View
                    key={dayNum}
                    style={[
                      styles.dayChip,
                      isDone && [styles.dayChipDone, { backgroundColor: C.accentBg, borderColor: C.border }],
                      isToday && [styles.dayChipToday, { backgroundColor: 'rgba(200,137,74,0.15)', borderColor: C.accent }],
                      isLocked && styles.dayChipLocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayChipNum,
                        { color: C.textMuted, fontFamily: Fonts.titleLight },
                        isDone && { color: C.accent },
                        isToday && { color: C.text, fontFamily: Fonts.titleBold },
                        isLocked && { color: C.textMuted },
                      ]}
                    >
                      {dayNum}
                    </Text>
                    <View
                      style={[
                        styles.dayChipDot,
                        isDone && { backgroundColor: C.accent },
                        isToday && { backgroundColor: C.text },
                      ]}
                    />
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>

          <Animated.View
            style={{
              opacity: ctaFade,
              transform: [{ translateY: ctaSlide }],
              marginTop: 20,
            }}
          >
            <View style={[styles.quoteCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Sparkles size={12} color={C.accent} style={{ marginBottom: 8 }} />
              <Text style={[styles.quoteText, { color: C.textSecondary, fontFamily: Fonts.italic }]}>
                &ldquo;{encouragement.text}&rdquo;
              </Text>
              <Text style={[styles.quoteAuthor, { color: C.textMuted, fontFamily: Fonts.titleSemiBold }]}>
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
              activeOpacity={0.7}
              testID="support-cause-home"
            >
              <View style={[styles.supportHeart, { backgroundColor: C.accent }]}>
                <Heart size={12} color={C.white} fill={C.white} />
              </View>
              <Text style={[styles.supportLabel, { color: C.text, fontFamily: Fonts.titleSemiBold }]} numberOfLines={1}>Support This Cause</Text>
              <ChevronRight size={14} color={C.textMuted} />
            </TouchableOpacity>
          </Animated.View>

          {!hasCompletedSessionToday && (
            <Animated.View
              style={{
                opacity: ctaFade,
                transform: [{ translateY: ctaSlide }],
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              <AnimatedPressable
                style={[styles.primaryButtonShell, { shadowColor: C.accent }]}
                onPress={() => {
                  console.log('[HomeScreen] Starting today\'s session from CTA');
                  router.push('/session');
                }}
                scaleValue={0.96}
                hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
                testID="begin-today-cta"
              >
                <LinearGradient
                  colors={['#D49550', '#A86B2A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  <Play size={17} color="#180C02" fill="#180C02" />
                  <Text style={[styles.primaryButtonText, { color: '#180C02', fontFamily: Fonts.titleMedium }]}>Begin Today</Text>
                </LinearGradient>
              </AnimatedPressable>
            </Animated.View>
          )}
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  ambientGlowOuter: {
    position: 'absolute',
    top: -180,
    left: '50%',
    width: 600,
    height: 400,
    borderRadius: 300,
    transform: [{ translateX: -300 }],
  },
  ambientGlow: {
    position: 'absolute',
    top: -80,
    left: '50%',
    width: 380,
    height: 260,
    borderRadius: 190,
    transform: [{ translateX: -190 }],
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -80,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    gap: 8,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 20,
  },
  greetingLabel: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  nameTitle: {
    fontSize: 40,
    letterSpacing: -0.5,
    lineHeight: 44,
    marginBottom: 6,
  },
  subText: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 17,
    paddingVertical: 14,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 24,
  },
  streakCardEmoji: {
    fontSize: 22,
  },
  streakCardText: {
    flex: 1,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  streakCardStrong: {},
  progressSection: {
    marginBottom: 24,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
  },
  progressDay: {
    fontSize: 11,
  },
  progressTrack: {
    height: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#C8894A',
  },
  sectionEyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    marginBottom: 14,
    opacity: 0.55,
  },
  todayCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  todayCardInner: {
    padding: 24,
    position: 'relative',
  },
  todayCardTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.35,
  },
  todayCardGlow: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.06,
  },
  todayCardDay: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  todayCardTitle: {
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  todayCardDesc: {
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 16,
  },
  todayCardRule: {
    height: 1,
    marginVertical: 14,
  },
  triadPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  triadPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  triadPillText: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    opacity: 0.65,
  },
  todayCardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayCardCtaText: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  completedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStrip: {
    marginBottom: 4,
  },
  dayStripContent: {
    gap: 7,
    paddingRight: 8,
  },
  dayChip: {
    width: 42,
    height: 52,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayChipDone: {
    borderWidth: 1,
  },
  dayChipToday: {
    borderWidth: 1,
  },
  dayChipLocked: {
    opacity: 0.28,
  },
  dayChipNum: {
    fontSize: 13,
  },
  dayChipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  quoteCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  supportRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  supportHeart: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportLabel: {
    flex: 1,
    fontSize: 13,
    letterSpacing: 0.1,
  },
  primaryButtonShell: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 12.5,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  ghostButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ghostButtonText: {
    fontSize: 14,
    letterSpacing: 0.2,
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
    letterSpacing: 2.4,
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 32,
    lineHeight: 40,
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
  },
});
