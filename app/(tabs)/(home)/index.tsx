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
  const translateAnim = useRef(new Animated.Value(18)).current;
  const ctaAnim = useRef(new Animated.Value(0.94)).current;

  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const encouragement = useMemo(() => getDailyEncouragement(), []);
  const TimeIcon = timeOfDay.icon;

  const veryCompact = height < 740;

  useEffect(() => {
    console.log('[HomeScreen] Rendering Amen home screen');
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(translateAnim, {
        toValue: 0,
        tension: 40,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(ctaAnim, {
        toValue: 1,
        tension: 48,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [ctaAnim, fadeAnim, translateAnim]);

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
      <LinearGradient colors={[C.gradientStart, C.gradientMid, C.gradientEnd]} style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.completionContainer}>
            <View style={[styles.completionOrb, { borderColor: C.accentLight, backgroundColor: C.surfaceAlt }]}>
              <View style={[styles.completionInnerOrb, { backgroundColor: C.accentBg }]}>
                <Check size={30} color={C.accentDark} strokeWidth={2.4} />
              </View>
            </View>
            <Text style={[styles.completionEyebrow, { color: C.textMuted }]}>Amen complete</Text>
            <Text style={[styles.completionTitle, { color: C.text }]}>30 days of showing up</Text>
            <Text style={[styles.completionMessage, { color: C.textSecondary }]}>
              You have built a sacred daily rhythm. Stay close and begin again tomorrow.
            </Text>
            <AnimatedPressable
              style={[styles.primaryButtonShell, { shadowColor: C.accentDeep }]}
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
                <RotateCcw size={18} color={C.white} />
                <Text style={styles.primaryButtonText}>Continue Daily</Text>
              </LinearGradient>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.secondaryButton, { borderColor: C.border, backgroundColor: C.surface }]}
              onPress={() => {
                console.log('[HomeScreen] Restart journey pressed from completion state');
                resetJourney();
              }}
              scaleValue={0.98}
              testID="restart-journey"
            >
              <Text style={[styles.secondaryButtonText, { color: C.textSecondary }]}>Restart 30 Days</Text>
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[C.gradientStart, C.gradientMid, C.gradientEnd]} style={styles.root}>
      <View style={[styles.backgroundGlowTop, { backgroundColor: C.accentBg }]} />
      <View style={[styles.backgroundGlowBottom, { backgroundColor: C.overlayLight }]} />
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
            <View style={styles.headerMetaRow}>
              <View style={[styles.headerPill, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}> 
                <TimeIcon size={14} color={C.accentDark} />
                <Text style={[styles.headerPillText, { color: C.textSecondary }]}>
                  {timeOfDay.greeting}
                  {greetingName}
                </Text>
              </View>

              <View style={styles.headerActions}>
                {state.streakCount > 0 && !showGraceBadge ? (
                  <View style={[styles.metricPill, { backgroundColor: C.surface, borderColor: C.border }]}> 
                    <Flame size={14} color={C.accent} />
                    <Text style={[styles.metricPillText, { color: C.text }]}>{state.streakCount}</Text>
                  </View>
                ) : null}

                {showGraceBadge ? (
                  <View
                    style={[
                      styles.metricPill,
                      { backgroundColor: graceUrgent ? C.roseBg : C.surface, borderColor: C.border },
                    ]}
                  >
                    <AlertTriangle size={14} color={graceUrgent ? C.rose : C.accent} />
                    <Text style={[styles.metricPillText, { color: C.textSecondary }]}>
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
                  style={[styles.settingsButton, { backgroundColor: C.surface, borderColor: C.border }]}
                  testID="open-settings"
                >
                  <Settings2 size={18} color={C.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.hero,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              },
            ]}
          >
            <Image
              source={require('@/assets/images/amen-icon-smooth-logo.png')}
              resizeMode="contain"
              style={styles.wordmark}
              testID="amen-logo-home"
            />

            <View style={styles.taglineWrap}>
              <Text style={[styles.tagline, { color: C.textSecondary }]}>30 days to discover God is </Text>
              <View style={[styles.highlightWrap, { backgroundColor: C.accentBg, borderColor: C.border }]}> 
                <Text style={[styles.highlightText, { color: C.accentDark }]}>much closer</Text>
              </View>
              <Text style={[styles.tagline, { color: C.textSecondary }]}> than you think.</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.mainCard,
              {
                backgroundColor: C.surface,
                borderColor: C.border,
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              },
            ]}
          >
            <View style={styles.mainCardHeader}>
              <View>
                <Text style={[styles.cardEyebrow, { color: C.textMuted }]}>Today&apos;s prayer</Text>
                <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={2}>
                  {dayContent.title}
                </Text>
              </View>
              <View style={[styles.phaseBadge, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}> 
                <Text style={[styles.phaseBadgeText, { color: C.accentDark }]}>{phaseLabel}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.ringWrap}>
                <ProgressRing
                  progress={completedDays / 30}
                  size={veryCompact ? 142 : 164}
                  strokeWidth={7}
                  color={C.accent}
                  backgroundColor={C.border}
                >
                  <Text style={[styles.ringLabel, { color: C.textMuted }]}>DAY</Text>
                  <Text style={[styles.ringNumber, { color: C.text }]}>{state.currentDay}</Text>
                  <Text style={[styles.ringSubtext, { color: C.textMuted }]}>of 30</Text>
                </ProgressRing>
              </View>

              <View style={styles.detailColumn}>
                <View style={[styles.scriptureCard, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}> 
                  <Text style={[styles.scriptureLabel, { color: C.textMuted }]}>Daily encouragement</Text>
                  <Text style={[styles.scriptureText, { color: C.textSecondary }]} numberOfLines={veryCompact ? 3 : 4}>
                    “{encouragement.text}”
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.supportCard, { backgroundColor: C.accentBg, borderColor: C.border }]}
                  onPress={() => {
                    console.log('[HomeScreen] Navigating to support page');
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/paywall');
                  }}
                  activeOpacity={0.88}
                  testID="support-cause-home"
                >
                  <View style={[styles.supportIconWrap, { backgroundColor: C.white }]}> 
                    <Heart size={14} color={C.accentDark} fill={C.accentDark} />
                  </View>
                  <View style={styles.supportTextWrap}>
                    <Text style={[styles.supportTitle, { color: C.text }]}>Support This Cause</Text>
                    <Text style={[styles.supportSubtitle, { color: C.textSecondary }]} numberOfLines={1}>
                      Help fund the app and global missions
                    </Text>
                  </View>
                  <ChevronRight size={16} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.ctaSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: ctaAnim }, { translateY: translateAnim }],
              },
            ]}
          >
            {hasCompletedSessionToday ? (
              <View style={[styles.completedCard, { backgroundColor: C.sageBg, borderColor: C.sageLight }]}> 
                <View style={[styles.completedIcon, { backgroundColor: C.sage }]}> 
                  <Check size={18} color={C.white} strokeWidth={2.5} />
                </View>
                <View style={styles.completedTextWrap}>
                  <Text style={[styles.completedTitle, { color: C.sageDark }]}>You showed up today</Text>
                  <Text style={[styles.completedSubtitle, { color: C.sage }]}>Come back tomorrow for day {Math.min(state.currentDay + 1, 30)}</Text>
                </View>
              </View>
            ) : (
              <AnimatedPressable
                style={[styles.primaryButtonShell, { shadowColor: C.accentDeep }]}
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
                  <Play size={18} color={C.white} fill={C.white} />
                  <Text style={styles.primaryButtonText}>Begin Today</Text>
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
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -110,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.55,
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.8,
  },
  header: {
    marginBottom: 18,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerPill: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerPillText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricPill: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginRight: 8,
  },
  metricPillText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 22,
  },
  wordmark: {
    width: 220,
    height: 88,
    marginBottom: 10,
  },
  taglineWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    maxWidth: 320,
  },
  tagline: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '400',
  },
  highlightWrap: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  highlightText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  mainCard: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 20,
    marginBottom: 18,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 10,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  cardEyebrow: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '300',
    letterSpacing: -1,
    maxWidth: 205,
  },
  phaseBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginLeft: 12,
  },
  phaseBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  ringWrap: {
    width: 152,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ringLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
  },
  ringNumber: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '300',
    letterSpacing: -2,
  },
  ringSubtext: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  detailColumn: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scriptureCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    minHeight: 104,
  },
  scriptureLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scriptureText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  supportCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  supportTextWrap: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  supportSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  ctaSection: {
    marginTop: 'auto',
  },
  primaryButtonShell: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.34,
    shadowRadius: 30,
    elevation: 12,
  },
  primaryButton: {
    minHeight: 62,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginLeft: 10,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  completedCard: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completedTextWrap: {
    flex: 1,
  },
  completedTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  completedSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  completionContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionOrb: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completionInnerOrb: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  completionTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '300',
    letterSpacing: -1.2,
    textAlign: 'center',
    marginBottom: 12,
  },
  completionMessage: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 26,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
