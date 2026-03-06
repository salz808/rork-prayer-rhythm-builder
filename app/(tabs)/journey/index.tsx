import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Lock, Flame, Calendar, Clock, Award, TrendingUp, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/providers/AppProvider';
import { useColors } from '@/hooks/useColors';
import { Fonts } from '@/constants/fonts';
import { milestones } from '@/mocks/content';
import { DayProgress } from '@/types';

function useAnimatedCounter(targetValue: number, duration: number = 800) {
  const [displayValue, setDisplayValue] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listenerId = animValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    Animated.timing(animValue, {
      toValue: targetValue,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animValue.removeListener(listenerId);
    };
  }, [targetValue, animValue, duration]);

  return displayValue;
}

function AnimatedStatCard({
  value,
  label,
  icon: Icon,
  iconBg,
  iconColor,
  delay = 0,
}: {
  value: number;
  label: string;
  icon: typeof Calendar;
  iconBg: string;
  iconColor: string;
  delay?: number;
}) {
  const C = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const displayValue = useAnimatedCounter(value);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          backgroundColor: C.surface,
          borderColor: C.borderLight,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.statIconOuter, { backgroundColor: iconBg + '40' }]}>
        <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
          <Icon size={15} color={iconColor} />
        </View>
      </View>
      <Text style={[styles.statValue, { color: C.text }]}>
        {displayValue}
      </Text>
      <Text style={[styles.statLabel, { color: C.textMuted }]}>{label}</Text>
    </Animated.View>
  );
}

export default function JourneyScreen() {
  const { state, graceWindowRemaining } = useApp();
  const C = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  const completedDays = state.progress.filter(p => p.completed).length;
  const totalMinutes = Math.round(
    state.progress.reduce((sum, p) => sum + p.duration, 0) / 60
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, headerSlide]);

  const nextMilestone = milestones.find(m => m.day > completedDays);
  const showGrace = graceWindowRemaining !== null && state.streakCount > 0;
  const graceUrgent = graceWindowRemaining === 0;

  const progressPercent = Math.round((completedDays / 30) * 100);

  return (
    <LinearGradient
      colors={[C.gradientStart, C.gradientMid, C.gradientEnd]}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: headerSlide }] }}>
            <View style={styles.titleRow}>
              <Text style={[styles.screenTitle, { color: C.text, fontFamily: Fonts.titleBold }]}>Your Journey</Text>
              {completedDays > 0 && (
                <View style={[styles.completedBadge, { backgroundColor: C.sageBg, borderColor: C.sageLight, borderWidth: 1 }]}>
                  <Sparkles size={11} color={C.sage} />
                  <Text style={[styles.completedBadgeText, { color: C.sageDark }]}>{completedDays}/30</Text>
                </View>
              )}
            </View>
            <Text style={[styles.screenSubtitle, { color: C.textSecondary, fontFamily: Fonts.italic }]}>
              {completedDays === 0
                ? 'Your story begins today.'
                : `${completedDays} day${completedDays > 1 ? 's' : ''} of faithfulness.`}
            </Text>
          </Animated.View>

          <View style={styles.statsRow}>
            <AnimatedStatCard
              value={completedDays}
              label="Days"
              icon={Calendar}
              iconBg={C.accentBg}
              iconColor={C.accentDark}
              delay={100}
            />
            <AnimatedStatCard
              value={state.streakCount}
              label="Streak"
              icon={Flame}
              iconBg={C.warmLight}
              iconColor={C.warmDeep}
              delay={200}
            />
            <AnimatedStatCard
              value={totalMinutes}
              label="Minutes"
              icon={Clock}
              iconBg={C.sageBg}
              iconColor={C.sageDark}
              delay={300}
            />
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={[styles.overallProgressCard, { backgroundColor: C.surface, borderColor: C.borderLight }]}>
              <View style={styles.overallProgressHeader}>
                <View style={[styles.overallProgressIconWrap, { backgroundColor: C.accentBg }]}>
                  <TrendingUp size={14} color={C.accentDark} />
                </View>
                <Text style={[styles.overallProgressLabel, { color: C.accentDark }]}>OVERALL PROGRESS</Text>
                <Text style={[styles.overallProgressPercent, { color: C.text }]}>{progressPercent}%</Text>
              </View>
              <View style={[styles.overallProgressTrack, { backgroundColor: C.borderLight }]}>
                <Animated.View
                  style={[
                    styles.overallProgressFill,
                    {
                      backgroundColor: C.accentDark,
                      width: `${progressPercent}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.overallProgressNote, { color: C.textMuted }]}>
                {completedDays === 0
                  ? 'Begin your first session to start tracking'
                  : `${30 - completedDays} day${30 - completedDays !== 1 ? 's' : ''} remaining`}
              </Text>
            </View>

            {showGrace && (
              <View style={[
                styles.graceWindowCard,
                {
                  backgroundColor: graceUrgent ? (state.darkMode ? '#3D1A1A' : '#FFF0F0') : (state.darkMode ? '#3A2C14' : '#FFF8EC'),
                  borderColor: graceUrgent ? (state.darkMode ? '#7A2020' : '#E8AAAA') : (state.darkMode ? '#7A5820' : '#E8C870'),
                },
              ]}>
                <View style={styles.graceWindowHeader}>
                  <View style={[
                    styles.graceWindowDot,
                    { backgroundColor: graceUrgent ? '#E07070' : '#D4A050' },
                  ]} />
                  <Text style={[
                    styles.graceWindowTitle,
                    { color: graceUrgent ? (state.darkMode ? '#E07070' : '#C05050') : (state.darkMode ? '#D4A050' : '#9A7020') },
                  ]}>
                    {graceUrgent ? 'Streak at risk. pray today' : 'Grace window active'}
                  </Text>
                </View>
                <View style={styles.graceWindowRow}>
                  <View style={[styles.graceWindowPip, { backgroundColor: state.darkMode ? '#5A3A3A' : '#FFCCCC' }]}>
                    <View style={[styles.graceWindowPipFill, { backgroundColor: graceUrgent ? '#E07070' : 'transparent' }]} />
                  </View>
                  <View style={[
                    styles.graceWindowPip,
                    { backgroundColor: graceUrgent ? (state.darkMode ? '#5A3A3A' : '#FFCCCC') : (state.darkMode ? '#5A4A20' : '#FFE8A0') },
                  ]}>
                    <View style={[
                      styles.graceWindowPipFill,
                      { backgroundColor: graceUrgent ? 'transparent' : '#D4A050' },
                    ]} />
                  </View>
                </View>
                <Text style={[
                  styles.graceWindowNote,
                  { color: graceUrgent ? (state.darkMode ? '#C05050' : '#904040') : (state.darkMode ? '#B07030' : '#806010') },
                ]}>
                  {graceUrgent
                    ? "This is your last grace day. Missed days don't define you. showing up does."
                    : "You missed yesterday. That's okay. You still have 1 grace day before your streak resets."}
                </Text>
              </View>
            )}

            {nextMilestone && (
              <View style={[styles.nextMilestoneCard, { backgroundColor: C.surface, borderColor: C.borderLight }]}>
                <View style={styles.nextMilestoneHeader}>
                  <Award size={16} color={C.accentDark} />
                  <Text style={[styles.nextMilestoneLabel, { color: C.accentDark }]}>Next milestone</Text>
                </View>
                <Text style={[styles.nextMilestoneDay, { color: C.text }]}>Day {nextMilestone.day}</Text>
                <View style={[styles.nextMilestoneProgress, { backgroundColor: C.borderLight }]}>
                  <View
                    style={[
                      styles.nextMilestoneBar,
                      {
                        width: `${Math.min((completedDays / nextMilestone.day) * 100, 100)}%`,
                        backgroundColor: C.accentDark,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.nextMilestoneText, { color: C.textSecondary }]}>
                  {nextMilestone.day - completedDays} day{nextMilestone.day - completedDays !== 1 ? 's' : ''} to go
                </Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: Fonts.titleBold }]}>Progress</Text>

            <View style={styles.weeksContainer}>
              <WeekSection
                label="Week 1"
                subtitle="Fully Scripted"
                start={1}
                end={7}
                progress={state.progress}
                currentDay={state.currentDay}
              />
              <WeekSection
                label="Week 2"
                subtitle="Partially Guided"
                start={8}
                end={14}
                progress={state.progress}
                currentDay={state.currentDay}
              />
              <WeekSection
                label="Week 3"
                subtitle="Minimal Scripting"
                start={15}
                end={21}
                progress={state.progress}
                currentDay={state.currentDay}
              />
              <WeekSection
                label="Week 4+"
                subtitle="You Lead"
                start={22}
                end={30}
                progress={state.progress}
                currentDay={state.currentDay}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: Fonts.titleBold }]}>Milestones</Text>
            <View style={styles.milestonesContainer}>
              {milestones.map((m, idx) => {
                const reached = completedDays >= m.day;
                const isNext = !reached && (idx === 0 || completedDays >= milestones[idx - 1].day);
                return (
                  <View
                    key={m.day}
                    style={styles.milestoneRow}
                  >
                    <View style={styles.milestoneLeft}>
                      <View
                        style={[
                          styles.milestoneBadge,
                          { backgroundColor: C.surfaceAlt, borderColor: C.border },
                          reached && { backgroundColor: C.sage, borderColor: C.sage },
                          isNext && { borderColor: C.accentDark, backgroundColor: C.accentBg },
                        ]}
                      >
                        {reached ? (
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                          <Text style={[
                            styles.milestoneBadgeText,
                            { color: C.textMuted },
                            isNext && { color: C.accentDark },
                          ]}>{m.day}</Text>
                        )}
                      </View>
                      {idx < milestones.length - 1 && (
                        <View
                          style={[
                            styles.milestoneConnector,
                            { backgroundColor: C.border },
                            reached && { backgroundColor: C.sageLight },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.milestoneContent}>
                      <Text
                        style={[
                          styles.milestoneTitle,
                          { color: C.textSecondary },
                          reached && { color: C.sageDark },
                        ]}
                      >
                        Day {m.day}
                      </Text>
                      <Text
                        style={[
                          styles.milestoneMessage,
                          { color: C.textMuted },
                          reached && { color: C.textSecondary },
                        ]}
                      >
                        {m.message}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[styles.graceNote, { backgroundColor: C.accentBg, borderColor: C.accentLight }]}>
              <View style={[styles.graceNoteAccent, { backgroundColor: C.accentDark }]} />
              <Text style={[styles.graceNoteText, { color: C.accentDeep, fontFamily: Fonts.italic }]}>
                Missed a day? That{"'"}s okay.{'\n'}Grace means starting again isn{"'"}t failure. it{"'"}s growth.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function WeekSection({
  label,
  subtitle,
  start,
  end,
  progress,
  currentDay,
}: {
  label: string;
  subtitle: string;
  start: number;
  end: number;
  progress: DayProgress[];
  currentDay: number;
}) {
  const C = useColors();
  const weekCompleted = progress.filter(p => p.day >= start && p.day <= end && p.completed).length;
  const weekTotal = end - start + 1;

  return (
    <View style={[styles.weekSection, { backgroundColor: C.surface, borderColor: C.borderLight }]}>
      <View style={styles.weekHeader}>
        <View>
          <Text style={[styles.weekLabel, { color: C.text }]}>{label}</Text>
          <Text style={[styles.weekSubtitle, { color: C.textMuted }]}>{subtitle}</Text>
        </View>
        <View style={styles.weekCountWrap}>
          <Text style={[styles.weekCount, { color: C.accentDark, backgroundColor: C.accentBg }]}>
            {weekCompleted}/{weekTotal}
          </Text>
        </View>
      </View>
      <View style={[styles.weekProgressTrack, { backgroundColor: C.borderLight }]}>
        <View
          style={[
            styles.weekProgressFill,
            {
              width: `${(weekCompleted / weekTotal) * 100}%`,
              backgroundColor: weekCompleted === weekTotal ? C.sage : C.accentDark,
            },
          ]}
        />
      </View>
      <View style={styles.daysGrid}>
        {renderDays(start, end, progress, currentDay, C)}
      </View>
    </View>
  );
}

function renderDays(
  start: number,
  end: number,
  progress: DayProgress[],
  currentDay: number,
  C: ReturnType<typeof useColors>
) {
  const days = [];
  for (let i = start; i <= end; i++) {
    const isCompleted = progress.some(p => p.day === i && p.completed);
    const isCurrent = i === currentDay;
    const isLocked = i > currentDay;

    days.push(
      <View
        key={i}
        style={[
          styles.dayCell,
          { backgroundColor: C.surfaceElevated, borderColor: C.borderLight },
          isCompleted && { backgroundColor: C.sage, borderColor: C.sage },
          isCurrent && { borderColor: C.accentDark, borderWidth: 2, backgroundColor: C.accentBg },
          isLocked && { backgroundColor: C.surfaceAlt, borderColor: 'transparent' },
        ]}
      >
        {isCompleted ? (
          <Check size={13} color="#FFFFFF" strokeWidth={2.5} />
        ) : isLocked ? (
          <Lock size={9} color={C.textMuted} />
        ) : (
          <Text
            style={[
              styles.dayCellText,
              { color: C.textSecondary },
              isCurrent && { color: C.accentDark, fontWeight: '700' as const },
            ]}
          >
            {i}
          </Text>
        )}
      </View>
    );
  }
  return days;
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
    paddingTop: 12,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  screenSubtitle: {
    fontSize: 15,
    marginBottom: 24,
    fontWeight: '500' as const,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  statIconOuter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  overallProgressCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  overallProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overallProgressIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallProgressLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    flex: 1,
  },
  overallProgressPercent: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  overallProgressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overallProgressNote: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  graceWindowCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  graceWindowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  graceWindowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  graceWindowTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  graceWindowRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  graceWindowPip: {
    width: 28,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  graceWindowPipFill: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
  graceWindowNote: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  nextMilestoneCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  nextMilestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  nextMilestoneLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  nextMilestoneDay: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  nextMilestoneProgress: {
    height: 5,
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  nextMilestoneBar: {
    height: '100%',
    borderRadius: 3,
  },
  nextMilestoneText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700' as const,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  weeksContainer: {
    gap: 16,
    marginBottom: 28,
  },
  weekSection: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  weekLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  weekSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  weekCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekCount: {
    fontSize: 13,
    fontWeight: '700' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  weekProgressTrack: {
    height: 3,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  weekProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 7,
    flexWrap: 'wrap',
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  dayCellText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  milestonesContainer: {
    marginBottom: 24,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 20,
  },
  milestoneLeft: {
    alignItems: 'center',
    width: 28,
  },
  milestoneBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  milestoneBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  milestoneConnector: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  milestoneContent: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  milestoneMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  graceNote: {
    borderRadius: 22,
    padding: 24,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  graceNoteAccent: {
    width: 3,
    borderRadius: 2,
  },
  graceNoteText: {
    fontSize: 14,
    lineHeight: 24,
    flex: 1,
    fontWeight: '500' as const,
    fontStyle: 'italic' as const,
    letterSpacing: 0.1,
  },
});
