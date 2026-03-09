import React, { useRef, useEffect } from 'react';
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



export default function JournalScreen() {
  const { state } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const reflections = state.reflections ?? [];

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
            <Text style={[styles.eyebrow, { fontFamily: Fonts.titleMedium }]}>YOUR JOURNEY</Text>
            <Text style={[styles.title, { fontFamily: Fonts.serifLight }]}>
              Prayer{'\n'}
              <Text style={{ color: '#E0A868', fontFamily: Fonts.italicMedium }}>Journal</Text>
            </Text>
            <View style={styles.rule} />
            <Text style={[styles.subtitle, { fontFamily: Fonts.italic }]}>
              Your weekly reflections. A record of how God moved.
            </Text>
          </Animated.View>

          {reflections.length === 0 ? (
            <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={[styles.emptyTitle, { fontFamily: Fonts.serifRegular }]}>Nothing written yet.</Text>
              <Text style={[styles.emptySub, { fontFamily: Fonts.italic }]}>
                Complete a week of prayer and you'll be prompted with three questions. Your answers live here.
              </Text>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.entriesContainer, { opacity: fadeAnim }]}>
              {[...reflections].reverse().map((r) => (
                <View key={`r-${r.week}`} style={styles.entry}>
                  <LinearGradient
                    colors={['transparent', 'rgba(200,137,74,0.3)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.entryTopLine}
                  />
                  <Text style={[styles.entryWeek, { fontFamily: Fonts.titleSemiBold }]}>Week {r.week}</Text>
                  <Text style={[styles.entryDate, { fontFamily: Fonts.titleLight }]}>{r.date}</Text>
                  {r.q1 ? (
                    <View style={styles.entryQ}>
                      <Text style={[styles.entryQLabel, { fontFamily: Fonts.titleSemiBold }]}>WHAT SHIFTED THIS WEEK?</Text>
                      <Text style={[styles.entryAns, { fontFamily: Fonts.italic }]}>{r.q1}</Text>
                    </View>
                  ) : null}
                  {r.q2 ? (
                    <View style={styles.entryQ}>
                      <Text style={[styles.entryQLabel, { fontFamily: Fonts.titleSemiBold }]}>WHAT DO YOU WANT MORE OF?</Text>
                      <Text style={[styles.entryAns, { fontFamily: Fonts.italic }]}>{r.q2}</Text>
                    </View>
                  ) : null}
                  {r.q3 ? (
                    <View style={styles.entryQ}>
                      <Text style={[styles.entryQLabel, { fontFamily: Fonts.titleSemiBold }]}>WHAT ARE YOU CARRYING INTO NEXT WEEK?</Text>
                      <Text style={[styles.entryAns, { fontFamily: Fonts.italic }]}>{r.q3}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </Animated.View>
          )}
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
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 26,
    color: 'rgba(244,237,224,0.55)',
    marginBottom: 28,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 38,
    opacity: 0.45,
  },
  emptyTitle: {
    fontSize: 24,
    color: 'rgba(244,237,224,0.55)',
  },
  emptySub: {
    fontSize: 15,
    lineHeight: 26,
    color: 'rgba(244,237,224,0.28)',
    textAlign: 'center',
    maxWidth: 280,
  },
  entriesContainer: {
    gap: 16,
  },
  entry: {
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.13)',
    borderRadius: 20,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1A1006',
  },
  entryTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  entryWeek: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: '#C8894A',
    marginBottom: 3,
  },
  entryDate: {
    fontSize: 9,
    letterSpacing: 1,
    color: 'rgba(244,237,224,0.28)',
    marginBottom: 16,
  },
  entryQ: {
    marginBottom: 14,
  },
  entryQLabel: {
    fontSize: 8,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    color: 'rgba(200,137,74,0.5)',
    marginBottom: 6,
  },
  entryAns: {
    fontSize: 16,
    lineHeight: 28,
    color: 'rgba(244,237,224,0.55)',
  },
});
