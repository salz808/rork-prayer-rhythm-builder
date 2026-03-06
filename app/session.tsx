import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronRight, Check, Heart, Volume2, VolumeX, Feather } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/providers/AppProvider';
import { useColors } from '@/hooks/useColors';
import { getDayContent, getPhaseInstruction, milestones } from '@/mocks/content';
import { SessionPhase, TriadItem } from '@/types';
import AnimatedPressable from '@/components/AnimatedPressable';
import CelebrationParticles from '@/components/CelebrationParticles';
import { Fonts } from '@/constants/fonts';

const SOUNDSCAPE_URLS: Record<string, string | null> = {
  piano: 'https://cdn.pixabay.com/audio/2024/11/04/audio_4956b4eff1.mp3',
  rain: 'https://cdn.pixabay.com/audio/2022/05/17/audio_1808fbf07a.mp3',
  nature: 'https://cdn.pixabay.com/audio/2022/03/15/audio_5b5f64b1e0.mp3',
  silence: null,
};

interface SessionStep {
  type: SessionPhase;
  title: string;
  subtitle: string;
  content: string;
  triadLabel?: string | null;
  timerSeconds?: number;
  isOpenTimer?: boolean;
}

export default function SessionScreen() {
  const router = useRouter();
  const { state, completeDay, toggleAmbientMute } = useApp();
  const C = useColors();

  const dayContent = useMemo(() => getDayContent(state.currentDay), [state.currentDay]);
  const phaseInstruction = useMemo(() => getPhaseInstruction(state.currentDay), [state.currentDay]);

  const steps = useMemo((): SessionStep[] => {
    const s: SessionStep[] = [];

    s.push({
      type: 'settle',
      title: 'Settle',
      subtitle: 'Arrive in this moment',
      content: dayContent.settle,
    });

    s.push({
      type: 'teach',
      title: 'Teach',
      subtitle: dayContent.title,
      content: dayContent.teach,
    });

    dayContent.triad.forEach((item: TriadItem) => {
      s.push({
        type: 'triad',
        title: item.label ?? 'Pray',
        subtitle: phaseInstruction,
        content: item.text,
        triadLabel: item.label,
      });
    });

    s.push({
      type: 'act',
      title: 'Activate',
      subtitle: 'Carry this into your day',
      content: dayContent.act,
    });

    return s;
  }, [dayContent, phaseInstruction]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPaused] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [completedDay, setCompletedDay] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const decorLineAnim = useRef(new Animated.Value(0)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const anchorScaleAnim = useRef(new Animated.Value(0.65)).current;
  const anchorGlowAnim = useRef(new Animated.Value(0.15)).current;
  const anchorRingAnim = useRef(new Animated.Value(0.65)).current;
  const [breathLabel, setBreathLabel] = useState<string>('Breathe in');
  const breathLabelTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const breathLoopAnim = useRef<Animated.CompositeAnimation | null>(null);
  const completeScaleAnim = useRef(new Animated.Value(0.8)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioStartedRef = useRef(false);
  const fadeInIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;

  const sectionColorMap: Record<SessionPhase, string> = useMemo(() => ({
    settle: C.sage,
    teach: C.accent,
    triad: C.warm,
    silence: C.accentDark,
    act: C.sageDark,
  }), [C]);

  const sectionBgMap: Record<SessionPhase, string> = useMemo(() => ({
    settle: C.sageBg,
    teach: C.accentBg,
    triad: C.warmLight,
    silence: C.surfaceAlt,
    act: C.sageBg,
  }), [C]);

  const sectionGradientMap: Record<SessionPhase, [string, string, string]> = useMemo(() => ({
    settle: [state.darkMode ? '#0E1A0E' : '#EFF5EE', C.sageBg, state.darkMode ? '#121E12' : '#E8F0E7'],
    teach: [state.darkMode ? '#1A1208' : '#F5EDE4', C.accentBg, state.darkMode ? '#1E1508' : '#EDE3D6'],
    triad: [state.darkMode ? '#1E1408' : '#FAF0E4', C.warmLight, state.darkMode ? '#251A0C' : '#F5E6D6'],
    silence: [C.surfaceAlt, C.surfaceAlt, C.gradientEnd],
    act: [state.darkMode ? '#0E1A0E' : '#EFF5EE', C.sageBg, state.darkMode ? '#121E12' : '#ECF2EB'],
  }), [C, state.darkMode]);

  const audioUrl = SOUNDSCAPE_URLS[state.soundscape] ?? null;

  const isInPrayerZone = useMemo(() => {
    const firstTriadIndex = steps.findIndex(s => s.type === 'triad');
    return currentStepIndex >= firstTriadIndex;
  }, [currentStepIndex, steps]);

  useEffect(() => {
    if (!audioUrl) return;
    let mounted = true;
    const loadAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          {
            shouldPlay: false,
            isLooping: true,
            volume: 0,
          }
        );
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        setAudioReady(true);
        console.log('[Session] Ambient audio loaded (waiting for prayer zone):', state.soundscape);
      } catch (e) {
        console.log('[Session] Failed to load ambient audio:', e);
      }
    };
    void loadAudio();
    return () => {
      mounted = false;
      if (fadeInIntervalRef.current) {
        clearInterval(fadeInIntervalRef.current);
        fadeInIntervalRef.current = null;
      }
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [audioUrl, state.soundscape]);

  useEffect(() => {
    if (!isInPrayerZone || audioStartedRef.current || !soundRef.current || !audioReady) return;
    if (state.ambientMuted || state.soundscape === 'silence') {
      audioStartedRef.current = true;
      return;
    }
    audioStartedRef.current = true;
    console.log('[Session] Starting audio with 3s fade-in');
    const fadeIn = async () => {
      try {
        await soundRef.current!.setVolumeAsync(0);
        await soundRef.current!.playAsync();
        const TARGET = 0.3;
        const STEPS = 15;
        let s = 0;
        fadeInIntervalRef.current = setInterval(async () => {
          s++;
          try {
            await soundRef.current?.setVolumeAsync(Math.min((s / STEPS) * TARGET, TARGET));
          } catch {}
          if (s >= STEPS) {
            if (fadeInIntervalRef.current) {
              clearInterval(fadeInIntervalRef.current);
              fadeInIntervalRef.current = null;
            }
          }
        }, 200);
      } catch (e) {
        console.log('[Session] Error fading in audio:', e);
      }
    };
    void fadeIn();
  }, [isInPrayerZone, state.ambientMuted, state.soundscape, audioReady]);

  useEffect(() => {
    const updateVolume = async () => {
      if (!soundRef.current || !audioStartedRef.current) return;
      try {
        if (state.ambientMuted) {
          if (fadeInIntervalRef.current) {
            clearInterval(fadeInIntervalRef.current);
            fadeInIntervalRef.current = null;
          }
          await soundRef.current.setVolumeAsync(0);
        } else if (isInPrayerZone) {
          await soundRef.current.setVolumeAsync(0.3);
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && !status.isPlaying) {
            await soundRef.current.playAsync();
          }
        }
      } catch (e) {
        console.log('[Session] Error updating volume:', e);
      }
    };
    void updateVolume();
  }, [state.ambientMuted, isInPrayerZone]);

  useEffect(() => {
    const handlePause = async () => {
      if (!soundRef.current) return;
      try {
        if (isPaused) {
          await soundRef.current.pauseAsync();
        } else if (!state.ambientMuted) {
          await soundRef.current.playAsync();
        }
      } catch (e) {
        console.log('[Session] Error toggling pause on audio:', e);
      }
    };
    void handlePause();
  }, [isPaused, state.ambientMuted]);

  useEffect(() => {
    if (isComplete && soundRef.current) {
      const fadeOut = async () => {
        try {
          const status = await soundRef.current!.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            for (let v = 0.3; v >= 0; v -= 0.05) {
              await soundRef.current!.setVolumeAsync(Math.max(v, 0));
              await new Promise(r => setTimeout(r, 80));
            }
            await soundRef.current!.pauseAsync();
          }
        } catch (e) {
          console.log('[Session] Error fading out audio:', e);
        }
      };
      void fadeOut();
    }
  }, [isComplete]);

  const handleToggleMute = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleAmbientMute();
  }, [toggleAmbientMute]);

  useEffect(() => {
    decorLineAnim.setValue(0);
    Animated.timing(decorLineAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [currentStepIndex, decorLineAnim]);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [currentStepIndex, fadeAnim, slideAnim]);

  useEffect(() => {
    if (isComplete) {
      fadeAnim.setValue(0);
      completeScaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(completeScaleAnim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
      ]).start();
    }
  }, [isComplete, fadeAnim, completeScaleAnim]);



  useEffect(() => {
    const isSettle = currentStep?.type === 'settle';
    if (!isSettle || isPaused || isComplete) {
      if (breathLoopAnim.current) {
        breathLoopAnim.current.stop();
        breathLoopAnim.current = null;
      }
      breathLabelTimers.current.forEach(t => clearTimeout(t));
      breathLabelTimers.current = [];
      return;
    }

    const INHALE = 4000;
    const HOLD_IN = 2000;
    const EXHALE = 4000;
    const HOLD_OUT = 2000;
    const runCycle = () => {
      anchorScaleAnim.setValue(0.65);
      anchorGlowAnim.setValue(0.15);
      anchorRingAnim.setValue(0.6);
      setBreathLabel('Breathe in');

      breathLabelTimers.current.forEach(t => clearTimeout(t));
      breathLabelTimers.current = [];

      const t1 = setTimeout(() => setBreathLabel('Hold'), INHALE);
      const t2 = setTimeout(() => setBreathLabel('Breathe out'), INHALE + HOLD_IN);
      const t3 = setTimeout(() => setBreathLabel('Rest'), INHALE + HOLD_IN + EXHALE);
      breathLabelTimers.current = [t1, t2, t3];

      breathLoopAnim.current = Animated.parallel([
        Animated.sequence([
          Animated.timing(anchorScaleAnim, { toValue: 1.0, duration: INHALE, useNativeDriver: true }),
          Animated.delay(HOLD_IN),
          Animated.timing(anchorScaleAnim, { toValue: 0.65, duration: EXHALE, useNativeDriver: true }),
          Animated.delay(HOLD_OUT),
        ]),
        Animated.sequence([
          Animated.timing(anchorGlowAnim, { toValue: 0.55, duration: INHALE, useNativeDriver: true }),
          Animated.delay(HOLD_IN),
          Animated.timing(anchorGlowAnim, { toValue: 0.15, duration: EXHALE, useNativeDriver: true }),
          Animated.delay(HOLD_OUT),
        ]),
        Animated.sequence([
          Animated.timing(anchorRingAnim, { toValue: 1.1, duration: INHALE, useNativeDriver: true }),
          Animated.delay(HOLD_IN),
          Animated.timing(anchorRingAnim, { toValue: 0.6, duration: EXHALE, useNativeDriver: true }),
          Animated.delay(HOLD_OUT),
        ]),
      ]);

      breathLoopAnim.current.start(({ finished }) => {
        if (finished) runCycle();
      });
    };

    const startTimer = setTimeout(runCycle, 300);

    return () => {
      clearTimeout(startTimer);
      if (breathLoopAnim.current) {
        breathLoopAnim.current.stop();
        breathLoopAnim.current = null;
      }
      breathLabelTimers.current.forEach(t => clearTimeout(t));
      breathLabelTimers.current = [];
    };
  }, [currentStep?.type, currentStepIndex, isPaused, isComplete, anchorScaleAnim, anchorGlowAnim, anchorRingAnim]);



  const handleNextStep = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      const duration = Math.round((Date.now() - sessionStartTime) / 1000);
      const dayNum = Math.min(Math.max(state.currentDay, 1), 30);
      setCompletedDay(dayNum);
      completeDay(dayNum, duration);
      setIsComplete(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const isMilestoneDay = milestones.some(m => m.day === dayNum);
      if (isMilestoneDay) {
        setTimeout(() => setShowCelebration(true), 400);
      }
    }
  }, [currentStepIndex, totalSteps, sessionStartTime, completeDay, state.currentDay]);

  const handleClose = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const sectionColor = currentStep ? sectionColorMap[currentStep.type] : C.accent;
  const sectionBg = currentStep ? sectionBgMap[currentStep.type] : C.accentBg;
  const sectionGradient = currentStep ? sectionGradientMap[currentStep.type] : sectionGradientMap.teach;

  const stepNumber = currentStepIndex + 1;

  const largeFontSize = state.fontSize === 'large';

  const encouragementForDay = (day: number): string => {
    if (day === 1) return "You showed up. That's the hardest part.";
    if (day <= 3) return "You're building something beautiful.";
    if (day === 7) return "One full week of faithfulness.";
    if (day <= 7) return "Your rhythm is taking shape.";
    if (day === 14) return "Halfway through. Look how far you've come.";
    if (day <= 14) return "Your prayer life is becoming real.";
    if (day === 21) return "Three weeks. Something has changed in you.";
    if (day <= 21) return "Look at the confidence you're carrying.";
    if (day === 30) return "You don't need this app anymore. But you're always welcome.";
    return "Almost there. You're ready for this.";
  };

  if (isComplete) {
    const isMilestoneDay = milestones.some(m => m.day === completedDay);
    const milestone = milestones.find(m => m.day === completedDay);
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[C.gradientStart, C.gradientEnd]}
          style={styles.root}
        >
          <CelebrationParticles active={showCelebration} />
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              contentContainerStyle={styles.recapScroll}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                style={[
                  styles.recapContainer,
                  { opacity: fadeAnim, transform: [{ scale: completeScaleAnim }] },
                ]}
              >
                <View style={[styles.completeBadgeOuter, { backgroundColor: C.sageBg }]}>
                  <View style={[styles.completeBadgeRing, { borderColor: C.sageLight }]}>
                    <View style={[styles.completeBadge, { backgroundColor: C.sageLight }]}>
                      <Heart size={26} color={C.sage} fill={C.sage} />
                    </View>
                  </View>
                </View>

                <Text style={[styles.completeDayLabel, { color: C.textMuted, fontFamily: Fonts.titleMedium }]}>DAY {completedDay}</Text>
                <Text style={[styles.completeTitle, { color: C.text, fontFamily: Fonts.serifLight }]}>
                  Prayer Complete
                </Text>
                <Text style={[styles.completeSubtitle, { color: C.textSecondary, fontFamily: Fonts.italic }]}>
                  {encouragementForDay(completedDay)}
                </Text>

                {isMilestoneDay && milestone && (
                  <View style={[styles.milestoneRecapCard, { backgroundColor: C.accentBg, borderColor: C.accentLight }]}>
                    <LinearGradient
                      colors={[C.accentDark, C.accentDeep]}
                      style={styles.milestoneRecapBadge}
                    >
                      <Text style={styles.milestoneRecapEmoji}>&#127942;</Text>
                    </LinearGradient>
                    <View style={styles.milestoneRecapTextWrap}>
                      <Text style={[styles.milestoneRecapLabel, { color: C.accentDark, fontFamily: Fonts.titleMedium }]}>MILESTONE REACHED</Text>
                      <Text style={[styles.milestoneRecapMessage, { color: C.text, fontFamily: Fonts.titleRegular }]}>{milestone.message}</Text>
                    </View>
                  </View>
                )}

                <View style={[styles.recapSection, { backgroundColor: C.surface, borderColor: C.borderLight }]}>
                  <Text style={[styles.recapSectionTitle, { color: C.textMuted, fontFamily: Fonts.titleMedium }]}>WHAT YOU COVERED</Text>
                  {[
                    { label: 'Settle', color: sectionColorMap.settle, bg: sectionBgMap.settle },
                    { label: 'Teach', color: sectionColorMap.teach, bg: sectionBgMap.teach },
                    { label: 'TRIAD Prayer', color: sectionColorMap.triad, bg: sectionBgMap.triad },
                    { label: 'Activate', color: sectionColorMap.act, bg: sectionBgMap.act },
                  ].map((item, i) => (
                    <View key={i} style={[styles.recapPhaseRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: C.borderLight }]}>
                      <View style={[styles.recapPhaseCheck, { backgroundColor: item.bg }]}>
                        <Check size={12} color={item.color} strokeWidth={2.5} />
                      </View>
                      <Text style={[styles.recapPhaseTitle, { color: C.text, fontFamily: Fonts.titleRegular }]}>{item.label}</Text>
                      <Check size={14} color={C.sage} style={styles.recapCheckmark} />
                    </View>
                  ))}
                </View>

                <AnimatedPressable
                  style={styles.doneButton}
                  onPress={handleClose}
                  scaleValue={0.96}
                  hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
                  testID="session-done"
                >
                  <LinearGradient
                    colors={[C.accentDark, C.accentDeep]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.doneButtonGradient}
                  >
                    <Text style={[styles.doneButtonText, { color: '#FFFFFF', fontFamily: Fonts.titleSemiBold }]}>Done</Text>
                  </LinearGradient>
                </AnimatedPressable>
              </Animated.View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={sectionGradient as [string, string, string]}
        style={styles.root}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: C.overlayLight, borderColor: C.borderLight, borderWidth: 1 }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={C.textSecondary} />
            </TouchableOpacity>
            <View style={styles.phaseIndicatorWrap}>
              <View style={styles.phaseIndicator}>
                {steps.map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.phaseDot,
                      { backgroundColor: C.border },
                      i === currentStepIndex && [styles.phaseDotActive, { backgroundColor: sectionColor }],
                      i < currentStepIndex && { backgroundColor: sectionColor, opacity: 0.4 },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.stepCounter, { color: C.textMuted, fontFamily: Fonts.titleMedium }]}>
                {stepNumber}/{totalSteps}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleToggleMute}
              style={[styles.muteButton, { backgroundColor: C.overlayLight, borderColor: C.borderLight, borderWidth: 1 }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              testID="ambient-mute-toggle"
            >
              {state.ambientMuted || state.soundscape === 'silence' ? (
                <VolumeX size={16} color={C.textMuted} />
              ) : (
                <Volume2 size={16} color={sectionColor} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.phaseContent,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.phaseTagRow}>
                <View style={[styles.phaseTag, { backgroundColor: sectionBg, borderColor: sectionColor + '30', borderWidth: 1 }]}>
                  <View style={[styles.phaseTagDot, { backgroundColor: sectionColor }]} />
                  <Text style={[styles.phaseTagText, { color: sectionColor, fontFamily: Fonts.titleBold }]}>
                    {currentStep.title}
                  </Text>
                </View>
              </View>

              {currentStep.subtitle ? (
                <Text style={[styles.phaseSubtitle, { color: C.text, fontFamily: Fonts.serifRegular }, largeFontSize && styles.phaseSubtitleLarge]}>
                  {currentStep.subtitle}
                </Text>
              ) : null}

              <Animated.View style={[styles.decorativeLine, { backgroundColor: sectionColor, opacity: decorLineAnim, width: decorLineAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '12%'] }) }]} />

              <Text style={[styles.phaseText, { color: C.textSecondary, fontFamily: currentStep.type === 'triad' ? Fonts.italic : undefined }, largeFontSize && styles.phaseTextLarge]}>
                {currentStep.content}
              </Text>

              {currentStep.type === 'settle' && (
                <View style={styles.breathGuide}>
                  <View style={styles.breathCircleWrap}>
                    <Animated.View
                      style={[
                        styles.breathRingOuter,
                        {
                          backgroundColor: sectionColor,
                          opacity: anchorGlowAnim,
                          transform: [{ scale: anchorRingAnim }],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.breathRingMid,
                        {
                          borderColor: sectionColor,
                          opacity: anchorGlowAnim.interpolate({
                            inputRange: [0.15, 0.55],
                            outputRange: [0.3, 0.8],
                          }),
                          transform: [{ scale: anchorScaleAnim.interpolate({
                            inputRange: [0.65, 1.0],
                            outputRange: [0.78, 1.0],
                          }) }],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.breathCircleInner,
                        {
                          backgroundColor: sectionColor,
                          transform: [{ scale: anchorScaleAnim }],
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.breathLabelText, { color: sectionColor, fontFamily: Fonts.titleMedium }]}>{breathLabel}</Text>
                  <Text style={[styles.breathHintText, { color: C.textMuted, fontFamily: Fonts.titleLight }]}>Follow the circle</Text>
                </View>
              )}

              {currentStep.type === 'act' && (
                <View style={styles.actDecorator}>
                  <View style={[styles.actDecorLine, { backgroundColor: sectionColor + '25' }]} />
                  <Feather size={16} color={sectionColor} style={{ opacity: 0.5 }} />
                  <View style={[styles.actDecorLine, { backgroundColor: sectionColor + '25' }]} />
                </View>
              )}
            </Animated.View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <AnimatedPressable
              style={[styles.nextButton, { shadowColor: sectionColor }]}
              onPress={handleNextStep}
              scaleValue={0.97}
              hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
            >
              <LinearGradient
                colors={[sectionColor, sectionColor + 'DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextButtonGradient}
              >
                <Text style={[styles.nextButtonText, { fontFamily: Fonts.titleSemiBold }]}>
                  {currentStepIndex < totalSteps - 1 ? 'Continue' : 'Complete'}
                </Text>
                {currentStepIndex < totalSteps - 1 ? (
                  <ChevronRight size={20} color="#FFFFFF" />
                ) : (
                  <Check size={20} color="#FFFFFF" />
                )}
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseIndicator: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 200,
  },
  phaseDot: {
    width: 18,
    height: 3,
    borderRadius: 2,
  },
  phaseDotActive: {
    width: 32,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
  },
  phaseContent: {
    flex: 1,
  },
  phaseTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  phaseTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  phaseTagText: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  phaseSubtitle: {
    fontSize: 28,
    marginBottom: 16,
    letterSpacing: -0.3,
    lineHeight: 36,
  },
  phaseSubtitleLarge: {
    fontSize: 30,
    lineHeight: 40,
  },
  phaseText: {
    fontSize: 17,
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  phaseTextLarge: {
    fontSize: 21,
    lineHeight: 36,
  },
  phaseIndicatorWrap: {
    alignItems: 'center',
    gap: 6,
  },
  stepCounter: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 1,
  },
  phaseTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  decorativeLine: {
    height: 2,
    borderRadius: 1,
    marginBottom: 20,
  },
  actDecorator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 32,
  },
  actDecorLine: {
    height: 1,
    width: 40,
  },
  breathGuide: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 8,
    gap: 18,
  },
  breathCircleWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathRingOuter: {
    position: 'absolute' as const,
    width: 148,
    height: 148,
    borderRadius: 74,
  },
  breathRingMid: {
    position: 'absolute' as const,
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  breathCircleInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  breathLabelText: {
    fontSize: 15,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  breathHintText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  bottomBar: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    gap: 14,
  },

  nextButton: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  nextButtonGradient: {
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  recapScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  recapContainer: {
    alignItems: 'center',
  },
  completeBadgeOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  completeBadgeRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  completeBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeDayLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 3,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  },
  completeTitle: {
    fontSize: 36,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  completeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  milestoneRecapCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  milestoneRecapBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneRecapEmoji: {
    fontSize: 22,
  },
  milestoneRecapTextWrap: {
    flex: 1,
    gap: 4,
  },
  milestoneRecapLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 1.5,
  },
  milestoneRecapMessage: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 21,
  },
  recapSection: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  recapSectionTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  recapPhaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  recapCheckmark: {
    marginLeft: 'auto' as const,
  },
  recapPhaseCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapPhaseTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
  doneButton: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  doneButtonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});
