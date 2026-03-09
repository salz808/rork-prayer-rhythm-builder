import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/providers/AppProvider';
import { Fonts } from '@/constants/fonts';
import { DAYS } from '@/mocks/content';



export default function InsightsScreen() {
  const { state } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const completedDays = state.progress.filter(p => p.completed).length;
  const silenceMins = useMemo(() => {
    return state.progress
      .filter(p => p.completed)
      .reduce((acc, p) => acc + (DAYS[Math.max(0, p.day - 1)]?.silence ?? 0), 0);
  }, [state.progress]);

  const phaseTimings = state.phaseTimings ?? {};
  const phaseLabels: Record<string, string> = {
    focus: 'Focus', thank: 'Thank', repent: 'Repent',
    invite: 'Invite', ask: 'Ask', declare: 'Declare',
  };
  const sorted = useMemo(() =>
    Object.entries(phaseTimings)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]),
    [phaseTimings] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const maxT = sorted[0]?.[1] ?? 1;
  const topPhase = sorted[0] ? (phaseLabels[sorted[0][0]] ?? sorted[0][0]) : '—';

  const reflections = state.reflections ?? [];
  const allText = reflections.map(r => r.q1 + ' ' + r.q2 + ' ' + r.q3).join(' ').toLowerCase();
  const stop = new Set(['the', 'and', 'to', 'a', 'i', 'in', 'of', 'my', 'for', 'is', 'it', 'that', 'this', 'me', 'you', 'with', 'have', 'was', 'on', 'not', 'be', 'we', 'are', 'so', 'but', 'as', 'at', 'by', 'do', 'if', 'or', 'an', 'he', 'she', 'they', 'his', 'her', 'from', 'what', 'when', 'how', 'just', 'more', 'than', 'can', 'get', 'all', 'one', 'would', 'been', 'will', 'had', 'has', 'them', 'then', 'which', 'there', 'their', 'about', 'also', 'into', 'after', 'its', 'our', 'who', 'him', 'did', 'felt', 'feel']);
  const freq: Record<string, number> = {};
  allText.split(/\s+/).forEach(w => {
    const c = w.replace(/[^a-z]/g, '');
    if (c.length > 3 && !stop.has(c)) freq[c] = (freq[c] || 0) + 1;
  });
  const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0D0804', '#1A1006', '#0D0804']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(200,137,74,0.05)', 'transparent']}
        style={styles.ambientTop}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={[styles.eyebrow, { fontFamily: Fonts.titleMedium }]}>SELF-KNOWLEDGE</Text>
            <Text style={[styles.title, { fontFamily: Fonts.serifLight }]}>
              Your Prayer{'\n'}
              <Text style={{ color: '#E0A868', fontFamily: Fonts.italicMedium }}>Insights</Text>
            </Text>
            <View style={styles.rule} />
          </Animated.View>

          <Animated.View style={[styles.grid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.gridRow}>
              <View style={styles.insCard}>
                <Text style={[styles.insLbl, { fontFamily: Fonts.titleSemiBold }]}>DAYS COMPLETE</Text>
                <Text style={[styles.insBig, { fontFamily: Fonts.titleLight }]}>{completedDays}</Text>
                <Text style={[styles.insUnit, { fontFamily: Fonts.italic }]}>of 30 days</Text>
              </View>
              <View style={styles.insCard}>
                <Text style={[styles.insLbl, { fontFamily: Fonts.titleSemiBold }]}>SILENCE THIS MONTH</Text>
                <Text style={[styles.insBig, { fontFamily: Fonts.titleLight }]}>{silenceMins}</Text>
                <Text style={[styles.insUnit, { fontFamily: Fonts.italic }]}>minutes in stillness</Text>
              </View>
            </View>

            <View style={styles.insCardWide}>
              <Text style={[styles.insLbl, { fontFamily: Fonts.titleSemiBold }]}>WHERE YOU LINGER LONGEST</Text>
              {sorted.length > 0 ? (
                <>
                  {sorted.map(([k, v]) => (
                    <View key={k} style={styles.barRow}>
                      <Text style={[styles.barLbl, { fontFamily: Fonts.titleRegular }]}>{phaseLabels[k] ?? k}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.round((v / maxT) * 100)}%` }]} />
                      </View>
                      <Text style={[styles.barVal, { fontFamily: Fonts.titleRegular }]}>{Math.round(v / 60)}m</Text>
                    </View>
                  ))}
                  <View style={styles.insightBar}>
                    <Text style={styles.insightIcon}>✨</Text>
                    <Text style={[styles.insightText, { fontFamily: Fonts.italic }]}>
                      You spend the most time in <Text style={{ color: '#E0A868', fontFamily: Fonts.serifSemiBold }}>{topPhase}</Text> — that&apos;s where your heart is speaking.
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={[styles.insUnit, { fontFamily: Fonts.italic, paddingTop: 4, fontSize: 14 }]}>
                  Open phases during prayer to begin tracking.
                </Text>
              )}
            </View>

            <View style={styles.insCardWide}>
              <Text style={[styles.insLbl, { fontFamily: Fonts.titleSemiBold }]}>30-DAY JOURNEY</Text>
              <View style={styles.pipWrap}>
                {Array.from({ length: 30 }, (_, i) => {
                  const done = state.progress.some(p => p.day === i + 1 && p.completed);
                  return (
                    <View key={i} style={[styles.pip, done && styles.pipDone]} />
                  );
                })}
              </View>
            </View>

            {topWords.length > 0 && (
              <View style={styles.insCardWide}>
                <Text style={[styles.insLbl, { fontFamily: Fonts.titleSemiBold }]}>WORDS FROM YOUR REFLECTIONS</Text>
                <View style={styles.wordChips}>
                  {topWords.map(w => (
                    <View key={w} style={styles.wordChip}>
                      <Text style={[styles.wordChipText, { fontFamily: Fonts.italic }]}>{w}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {reflections.length > 0 && (
              <View style={styles.insCardWide}>
                <Text style={[styles.insLbl, { fontFamily: Fonts.titleSemiBold }]}>
                  WEEKLY REFLECTIONS · {reflections.length} SAVED
                </Text>
                {reflections.map(r => (
                  <View key={`ref-${r.week}`} style={styles.reflectionItem}>
                    <Text style={[styles.reflectionWeek, { fontFamily: Fonts.titleMedium }]}>
                      Week {r.week} · {r.date}
                    </Text>
                    <Text style={[styles.reflectionAns, { fontFamily: Fonts.italic }]}>
                      {r.q1 || '—'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0804',
  },
  safeArea: {
    flex: 1,
  },
  ambientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
  },
  scroll: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 120,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: '#C8894A',
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    color: '#F4EDE0',
    marginTop: 10,
    marginBottom: 14,
  },
  rule: {
    width: 44,
    height: 1.5,
    backgroundColor: '#C8894A',
    opacity: 0.55,
    marginBottom: 20,
  },
  grid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  insCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.13)',
    borderRadius: 18,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  insCardWide: {
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.13)',
    borderRadius: 18,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  insLbl: {
    fontSize: 8,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    color: 'rgba(200,137,74,0.6)',
    marginBottom: 10,
  },
  insBig: {
    fontSize: 46,
    letterSpacing: -1,
    lineHeight: 50,
    color: '#F4EDE0',
  },
  insUnit: {
    fontSize: 13,
    color: 'rgba(244,237,224,0.55)',
    marginTop: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 9,
  },
  barLbl: {
    fontSize: 9,
    letterSpacing: 0.5,
    color: 'rgba(244,237,224,0.55)',
    width: 46,
  },
  barTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(200,137,74,0.09)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#C8894A',
  },
  barVal: {
    fontSize: 9,
    color: 'rgba(200,137,74,0.7)',
    width: 22,
    textAlign: 'right' as const,
  },
  insightBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(200,137,74,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.18)',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  insightIcon: {
    fontSize: 16,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(244,237,224,0.55)',
  },
  pipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  pip: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: 'rgba(200,137,74,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.12)',
  },
  pipDone: {
    backgroundColor: 'rgba(200,137,74,0.22)',
    borderColor: 'rgba(200,137,74,0.38)',
  },
  wordChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 4,
  },
  wordChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.2)',
    borderRadius: 100,
  },
  wordChipText: {
    fontSize: 13,
    color: '#E0A868',
  },
  reflectionItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,137,74,0.08)',
  },
  reflectionWeek: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: '#C8894A',
    marginBottom: 6,
  },
  reflectionAns: {
    fontSize: 15,
    lineHeight: 26,
    color: 'rgba(244,237,224,0.55)',
  },
});
