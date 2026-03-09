import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Heart,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AnimatedPressable from '@/components/AnimatedPressable';
import SettingsSheet from '@/components/SettingsSheet';
import ReflectionModal from '@/components/ReflectionModal';
import { Fonts } from '@/constants/fonts';
import { getDayContent, getPhaseLabel } from '@/mocks/content';
import { getDailyEncouragement } from '@/mocks/encouragements';
import { useApp } from '@/providers/AppProvider';
import { WeeklyReflection } from '@/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function getEncouragingSub(completedDays: number): string {
  if (completedDays === 0) return "You showed up. That's everything.";
  if (completedDays === 1) return 'Day 1 complete. The groove has begun.';
  if (completedDays <= 3) return 'Something real is forming.';
  if (completedDays <= 6) return 'Keep walking in freedom.';
  if (completedDays === 7) return 'One week. You are not the same.';
  if (completedDays <= 13) return 'Your prayer life is becoming real.';
  if (completedDays === 14) return "Halfway. Look how far you've come.";
  if (completedDays <= 20) return "Look at the confidence you're carrying.";
  if (completedDays === 21) return 'Three weeks. Something has changed.';
  if (completedDays <= 29) return "Almost there. You're ready.";
  return "You don't need this app anymore. But you're always welcome.";
}

export default function HomeScreen() {
  const router = useRouter();

  const {
    state,
    isLoading,
    hasCompletedSessionToday,
    graceWindowRemaining,
    resetJourney,
    continueDaily,
    saveReflection,
  } = useApp();
  const isLargeFont = state.fontSize === 'large';
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [reflectionVisible, setReflectionVisible] = useState<boolean>(false);
  const [reflectionWeek, _setReflectionWeek] = useState<number>(1);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(40)).current;
  const glowPulse = useRef(new Animated.Value(0.25)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  const encouragement = useMemo(() => getDailyEncouragement(), []);

  useEffect(() => {
    console.log('[HomeScreen] Rendering Amen home screen');

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.55,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.25,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(translateAnim, {
          toValue: 0,
          tension: 30,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ctaFade, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(ctaSlide, {
          toValue: 0,
          tension: 35,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, translateAnim, ctaFade, ctaSlide, glowPulse]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#C89A5A" size="large" />
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
      <View style={styles.root}>
        <LinearGradient
          colors={['#0A0705', '#1A120B', '#0D0906']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topGlowWrap}>
          <Animated.View style={{ opacity: glowPulse }}>
            <LinearGradient
              colors={['rgba(180,116,53,0.35)', 'rgba(180,116,53,0.12)', 'rgba(180,116,53,0.03)', 'transparent']}
              style={styles.topGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </Animated.View>
        </View>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.completionContainer}>
            <View style={styles.completionOrb}>
              <View style={styles.completionInnerOrb}>
                <Check size={28} color="#C89A5A" strokeWidth={2.4} />
              </View>
            </View>
            <Text style={[styles.completionEyebrow, { fontFamily: Fonts.titleMedium }]}>JOURNEY COMPLETE</Text>
            <Text style={[styles.completionTitle, { fontFamily: Fonts.serifLight }]}>30 days of{'\n'}showing up</Text>
            <Text style={[styles.completionMessage, { fontFamily: Fonts.italic }]}>
              You have built a sacred daily rhythm.{'\n'}Stay close and begin again.
            </Text>
            <AnimatedPressable
              style={styles.goldBorderButton}
              onPress={() => {
                console.log('[HomeScreen] Continue daily pressed from completion state');
                continueDaily();
              }}
              scaleValue={0.96}
              testID="continue-daily"
            >
              <RotateCcw size={15} color="#C89A5A" />
              <Text style={[styles.goldBorderButtonText, { fontFamily: Fonts.titleLight }]}>CONTINUE DAILY</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.ghostButton}
              onPress={() => {
                console.log('[HomeScreen] Restart journey pressed from completion state');
                resetJourney();
              }}
              scaleValue={0.97}
              testID="restart-journey"
            >
              <Text style={[styles.ghostButtonText, { fontFamily: Fonts.titleLight }]}>Restart 30 Days</Text>
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0A0705', '#1A120B', '#0D0906']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topGlowWrap}>
        <Animated.View style={{ opacity: glowPulse }}>
          <LinearGradient
            colors={['rgba(180,116,53,0.30)', 'rgba(160,100,40,0.14)', 'rgba(140,80,30,0.04)', 'transparent']}
            style={styles.topGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      </View>

      <View style={styles.bottomGlowWrap}>
        <Animated.View style={{ opacity: Animated.multiply(glowPulse, 0.7) }}>
          <LinearGradient
            colors={['transparent', 'rgba(200,154,90,0.04)', 'rgba(200,154,90,0.12)', 'rgba(180,130,60,0.22)']}
            style={styles.bottomGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      </View>

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
                  <View style={styles.streakPill}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={[styles.streakText, { fontFamily: Fonts.titleMedium }]}>
                      {state.streakCount}-day streak
                    </Text>
                  </View>
                ) : null}
                {showGraceBadge ? (
                  <View style={[styles.streakPill, graceUrgent && styles.streakPillUrgent]}>
                    <AlertTriangle size={13} color={graceUrgent ? '#D4766A' : '#C89A5A'} />
                    <Text style={[styles.streakText, { fontFamily: Fonts.titleMedium, color: graceUrgent ? '#D4766A' : 'rgba(216,203,184,0.6)' }]}>
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
                style={styles.settingsBtn}
                testID="open-settings"
              >
                <Settings2 size={17} color="rgba(216,203,184,0.4)" />
              </TouchableOpacity>
            </View>

            <View style={styles.greetingSection}>
              <Text style={[styles.greetingLabel, { fontFamily: Fonts.titleLight }]}>
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
              </Text>
              <Text style={[styles.greetingName, { fontFamily: Fonts.serifRegular }, isLargeFont && { fontSize: 46, lineHeight: 52 }]}>
                {greetingName}
              </Text>
              <Text style={[styles.greetingSub, { fontFamily: Fonts.italic }, isLargeFont && { fontSize: 18 }]}>
                {encouragingSub}
              </Text>
            </View>

            {state.streakCount > 0 && (
              <View style={styles.streakCard}>
                <Text style={styles.streakCardEmoji}>🔥</Text>
                <Text style={[styles.streakCardText, { fontFamily: Fonts.titleLight }]}>
                  <Text style={[styles.streakCardStrong, { fontFamily: Fonts.titleMedium }]}>
                    {state.streakCount}-day streak
                  </Text>
                  {' · Keep walking in freedom'}
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }],
            }}
          >
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { fontFamily: Fonts.titleMedium }]}>JOURNEY TO WHOLENESS</Text>
                <Text style={[styles.progressDay, { fontFamily: Fonts.titleLight }]}>
                  Day {state.currentDay} of 30
                </Text>
              </View>
              <View style={styles.progressTrack}>
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
            <Text style={[styles.sectionEyebrow, { fontFamily: Fonts.titleMedium }]}>TODAY&apos;S PRACTICE</Text>

            <AnimatedPressable
              style={styles.todayCard}
              onPress={() => {
                if (!hasCompletedSessionToday) {
                  console.log("[HomeScreen] Starting today's session");
                  router.push('/session');
                }
              }}
              scaleValue={0.97}
              testID="begin-today"
            >
              <View style={styles.todayCardInner}>
                <View style={styles.todayCardAccentLine} />

                <Text style={[styles.todayCardDay, { fontFamily: Fonts.titleMedium }]}>
                  {'Day ' + state.currentDay + ' · ' + phaseLabel}
                </Text>
                <Text style={[styles.todayCardTitle, { fontFamily: Fonts.serifLight }, isLargeFont && { fontSize: 34, lineHeight: 40 }]}>
                  {dayContent.title}
                </Text>
                <Text style={[styles.todayCardDesc, { fontFamily: Fonts.italic }, isLargeFont && { fontSize: 18 }]} numberOfLines={3}>
                  {dayContent.settle}
                </Text>

                <View style={styles.todayCardRule} />

                <View style={styles.triadPills}>
                  {['Thank', 'Repent', 'Invite', 'Ask', 'Declare'].map((pill) => (
                    <View key={pill} style={styles.triadPill}>
                      <Text style={[styles.triadPillText, { fontFamily: Fonts.titleMedium }]}>{pill}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.todayCardRule} />

                {hasCompletedSessionToday ? (
                  <View style={styles.todayCardCta}>
                    <View style={styles.completedBadge}>
                      <Check size={11} color="#8EB084" strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.todayCardCtaText, { fontFamily: Fonts.titleMedium, color: '#8EB084' }]}>Completed today</Text>
                  </View>
                ) : (
                  <View style={styles.todayCardCta}>
                    <Text style={[styles.todayCardCtaText, { fontFamily: Fonts.titleMedium }]}>
                      Begin today&apos;s prayer
                    </Text>
                    <ChevronRight size={14} color="#C89A5A" />
                  </View>
                )}
              </View>
            </AnimatedPressable>
          </Animated.View>

          <Animated.View
            style={{
              opacity: ctaFade,
              transform: [{ translateY: ctaSlide }],
            }}
          >
            <Text style={[styles.sectionEyebrow, { fontFamily: Fonts.titleMedium }]}>30-DAY JOURNEY</Text>
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
                      isDone && styles.dayChipDone,
                      isToday && styles.dayChipToday,
                      isLocked && styles.dayChipLocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayChipNum,
                        { fontFamily: Fonts.titleLight },
                        isDone && styles.dayChipNumDone,
                        isToday && { color: '#F5EFE7', fontFamily: Fonts.titleBold },
                      ]}
                    >
                      {dayNum}
                    </Text>
                    <View
                      style={[
                        styles.dayChipDot,
                        isDone && styles.dayChipDotDone,
                        isToday && styles.dayChipDotToday,
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
              marginTop: 24,
            }}
          >
            <View style={styles.quoteCard}>
              <Sparkles size={12} color="#C89A5A" style={{ marginBottom: 10, opacity: 0.6 }} />
              <Text style={[styles.quoteText, { fontFamily: Fonts.italic }]}>
                &ldquo;{encouragement.text}&rdquo;
              </Text>
              <Text style={[styles.quoteAuthor, { fontFamily: Fonts.titleMedium }]}>
                {encouragement.author}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.supportRow}
              onPress={() => {
                console.log('[HomeScreen] Navigating to support page');
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/paywall');
              }}
              activeOpacity={0.7}
              testID="support-cause-home"
            >
              <View style={styles.supportHeart}>
                <Heart size={12} color="#F5EFE7" fill="#F5EFE7" />
              </View>
              <Text style={[styles.supportLabel, { fontFamily: Fonts.titleMedium }]} numberOfLines={1}>Support This Cause</Text>
              <ChevronRight size={14} color="rgba(216,203,184,0.3)" />
            </TouchableOpacity>
          </Animated.View>

          {!hasCompletedSessionToday && (
            <Animated.View
              style={{
                opacity: ctaFade,
                transform: [{ translateY: ctaSlide }],
                marginTop: 20,
                marginBottom: 12,
              }}
            >
              <AnimatedPressable
                style={styles.goldBorderButton}
                onPress={() => {
                  console.log("[HomeScreen] Starting today's session from CTA");
                  router.push('/session');
                }}
                scaleValue={0.96}
                hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
                testID="begin-today-cta"
              >
                <Play size={15} color="#C89A5A" fill="#C89A5A" />
                <Text style={[styles.goldBorderButtonText, { fontFamily: Fonts.titleLight }]}>BEGIN TODAY</Text>
              </AnimatedPressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      <SettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      <ReflectionModal
        visible={reflectionVisible}
        week={reflectionWeek}
        onSave={(reflection: WeeklyReflection) => {
          saveReflection(reflection);
        }}
        onClose={() => setReflectionVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0705',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0705',
  },
  topGlowWrap: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  topGlow: {
    width: SCREEN_W * 1.4,
    height: SCREEN_H * 0.45,
    borderRadius: SCREEN_W * 0.7,
  },
  bottomGlowWrap: {
    position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  bottomGlow: {
    width: SCREEN_W * 1.2,
    height: SCREEN_H * 0.35,
    borderRadius: SCREEN_W * 0.6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
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
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(200,154,90,0.2)',
    backgroundColor: 'rgba(200,154,90,0.06)',
    gap: 7,
  },
  streakPillUrgent: {
    borderColor: 'rgba(212,118,106,0.3)',
    backgroundColor: 'rgba(212,118,106,0.08)',
  },
  streakEmoji: {
    fontSize: 13,
  },
  streakText: {
    fontSize: 11,
    letterSpacing: 0.3,
    color: 'rgba(216,203,184,0.6)',
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(200,154,90,0.15)',
    backgroundColor: 'rgba(200,154,90,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  wordmark: {
    fontSize: 38,
    letterSpacing: 6,
    color: '#F5EFE7',
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  wordmarkSub: {
    fontSize: 12,
    letterSpacing: 2,
    color: 'rgba(216,203,184,0.35)',
    textTransform: 'uppercase' as const,
  },
  greetingLabel: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: '#C89A5A',
    marginBottom: 6,
  },
  greetingSection: {
    marginBottom: 24,
  },
  greetingName: {
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.5,
    color: '#F5EFE7',
    marginBottom: 6,
  },
  greetingSub: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(216,203,184,0.5)',
    letterSpacing: 0.2,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(200,154,90,0.12)',
    backgroundColor: 'rgba(200,154,90,0.05)',
    marginBottom: 28,
  },
  streakCardEmoji: {
    fontSize: 20,
  },
  streakCardText: {
    flex: 1,
    fontSize: 12,
    letterSpacing: 0.3,
    color: 'rgba(216,203,184,0.45)',
  },
  streakCardStrong: {
    color: '#D4AD6A',
  },
  progressSection: {
    marginBottom: 28,
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
    color: 'rgba(200,154,90,0.5)',
  },
  progressDay: {
    fontSize: 11,
    color: 'rgba(216,203,184,0.3)',
  },
  progressTrack: {
    height: 2,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(200,154,90,0.1)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#C89A5A',
  },
  sectionEyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    marginBottom: 14,
    color: 'rgba(200,154,90,0.4)',
  },
  todayCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(200,154,90,0.12)',
    overflow: 'hidden',
    marginBottom: 28,
    backgroundColor: 'rgba(26,18,11,0.8)',
  },
  todayCardInner: {
    padding: 24,
    position: 'relative',
  },
  todayCardAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(200,154,90,0.2)',
  },
  todayCardDay: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
    color: '#C89A5A',
  },
  todayCardTitle: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 10,
    color: '#F5EFE7',
  },
  todayCardDesc: {
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 18,
    color: 'rgba(216,203,184,0.5)',
  },
  todayCardRule: {
    height: 1,
    marginVertical: 14,
    backgroundColor: 'rgba(200,154,90,0.08)',
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
    borderColor: 'rgba(200,154,90,0.15)',
  },
  triadPillText: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: 'rgba(200,154,90,0.5)',
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
    color: '#C89A5A',
  },
  completedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(142,176,132,0.15)',
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
    borderColor: 'rgba(200,154,90,0.15)',
    backgroundColor: 'rgba(200,154,90,0.06)',
  },
  dayChipToday: {
    borderColor: 'rgba(200,154,90,0.4)',
    backgroundColor: 'rgba(200,154,90,0.1)',
  },
  dayChipLocked: {
    opacity: 0.25,
  },
  dayChipNum: {
    fontSize: 13,
    color: 'rgba(216,203,184,0.3)',
  },
  dayChipNumDone: {
    color: '#C89A5A',
  },
  dayChipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  dayChipDotDone: {
    backgroundColor: '#C89A5A',
  },
  dayChipDotToday: {
    backgroundColor: '#F5EFE7',
  },
  quoteCard: {
    borderWidth: 1,
    borderColor: 'rgba(200,154,90,0.1)',
    borderRadius: 18,
    padding: 22,
    marginBottom: 14,
    backgroundColor: 'rgba(26,18,11,0.6)',
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 10,
    color: 'rgba(216,203,184,0.5)',
  },
  quoteAuthor: {
    fontSize: 10,
    letterSpacing: 0.3,
    color: 'rgba(216,203,184,0.25)',
  },
  supportRow: {
    borderWidth: 1,
    borderColor: 'rgba(200,154,90,0.1)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(200,154,90,0.04)',
  },
  supportHeart: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C89A5A',
  },
  supportLabel: {
    flex: 1,
    fontSize: 13,
    letterSpacing: 0.1,
    color: '#F5EFE7',
  },
  goldBorderButton: {
    minHeight: 56,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(200,154,90,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
    backgroundColor: 'transparent',
  },
  goldBorderButtonText: {
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: '#C89A5A',
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
    color: 'rgba(216,203,184,0.3)',
  },
  completionContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(200,154,90,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    backgroundColor: 'rgba(200,154,90,0.05)',
  },
  completionInnerOrb: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(200,154,90,0.08)',
  },
  completionEyebrow: {
    fontSize: 11,
    letterSpacing: 2.4,
    marginBottom: 12,
    color: 'rgba(200,154,90,0.5)',
  },
  completionTitle: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 14,
    color: '#F5EFE7',
  },
  completionMessage: {
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 36,
    color: 'rgba(216,203,184,0.45)',
  },
});
