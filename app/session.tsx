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
import { X, ChevronRight, Pause, Play, Check, Heart, Volume2, VolumeX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/providers/AppProvider';
import { useColors } from '@/hooks/useColors';
import { getDayContent, getPhaseInstruction, milestones } from '@/mocks/content';
import { SessionPhase, TriadItem } from '@/types';
import AnimatedPressable from '@/components/AnimatedPressable';
import CelebrationParticles from '@/components/CelebrationParticles';

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

    const isOpenTimer = dayContent.silence.durationSeconds === 0;
    s.push({
      type: 'silence',
      title: 'Silence',
      subtitle: isOpenTimer ? 'No timer today' : `${Math.floor(dayContent.silence.durationSeconds / 60)} min`,
      content: dayContent.silence.prompt,
      timerSeconds: dayContent.silence.durationSeconds,
      isOpenTimer,
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
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [completedDay, setCompletedDay] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [openTimerElapsed, setOpenTimerElapsed] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0.6)).current;
  const anchorScaleAnim = useRef(new Animated.Value(0.65)).current;
  const anchorGlowAnim = useRef(new Animated.Value(0.15)).current;
  const anchorRingAnim = useRef(new Animated.Value(0.65)).current;
  const [breathLabel, setBreathLabel] = useState<string>('Breathe in');
  const breathLabelTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const breathLoopAnim = useRef<Animated.CompositeAnimation | null>(null);
  const completeScaleAnim = useRef(new Animated.Value(0.8)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

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

  const sectionGradientMap: Record<SessionPhase, [string, string]> = useMemo(() => ({
    settle: [C.sageBg, state.darkMode ? '#1E2C1E' : '#E8F0E7'],
    teach: [C.accentBg, state.darkMode ? '#2E2318' : '#EDE3D6'],
    triad: [C.warmLight, state.darkMode ? '#3A2818' : '#F5E6D6'],
    silence: [C.surfaceAlt, C.gradientEnd],
    act: [C.sageBg, state.darkMode ? '#1E2C1E' : '#ECF2EB'],
  }), [C, state.darkMode]);

  const audioUrl = SOUNDSCAPE_URLS[state.soundscape] ?? null;

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
            shouldPlay: !state.ambientMuted,
            isLooping: true,
            volume: state.ambientMuted ? 0 : 0.3,
          }
        );
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        console.log('[Session] Ambient audio loaded:', state.soundscape);
      } catch (e) {
        console.log('[Session] Failed to load ambient audio:', e);
      }
    };
    loadAudio();
    return () => {
      mounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const updateVolume = async () => {
      if (!soundRef.current) return;
      try {
        if (state.ambientMuted) {
          await soundRef.current.setVolumeAsync(0);
        } else {
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
    updateVolume();
  }, [state.ambientMuted]);

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
    handlePause();
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
      fadeOut();
    }
  }, [isComplete]);

  const handleToggleMute = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleAmbientMute();
  }, [toggleAmbientMute]);

  useEffect(() => {
    if (currentStep?.type === 'silence' && currentStep.timerSeconds && currentStep.timerSeconds > 0) {
      setTimeRemaining(currentStep.timerSeconds);
    } else {
      setTimeRemaining(0);
    }
    setOpenTimerElapsed(0);
  }, [currentStepIndex]);

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
    if (currentStep?.type === 'silence' && !isPaused && !isComplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
          Animated.timing(breatheAnim, { toValue: 0.6, duration: 3000, useNativeDriver: true }),
        ])
      ).start();
    }
    return () => breatheAnim.stopAnimation();
  }, [currentStepIndex, isPaused, isComplete, currentStep?.type, breatheAnim]);

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

  useEffect(() => {
    if (currentStep?.type !== 'silence' || isPaused || isComplete) return;

    if (currentStep.isOpenTimer) {
      const interval = setInterval(() => {
        setOpenTimerElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }

    if (!currentStep.timerSeconds || currentStep.timerSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, currentStepIndex, isComplete, currentStep?.type, currentStep?.isOpenTimer, currentStep?.timerSeconds]);

  useEffect(() => {
    if (currentStep?.type !== 'silence' || !currentStep.timerSeconds || currentStep.timerSeconds <= 0) return;
    const total = currentStep.timerSeconds;
    const elapsed = total - timeRemaining;
    const newProgress = total > 0 ? elapsed / total : 0;
    Animated.timing(progressAnim, {
      toValue: newProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [timeRemaining, currentStep, progressAnim]);

  const handleNextStep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      const duration = Math.round((Date.now() - sessionStartTime) / 1000);
      const dayNum = Math.min(Math.max(state.currentDay, 1), 30);
      setCompletedDay(dayNum);
      completeDay(dayNum, duration);
      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const isMilestoneDay = milestones.some(m => m.day === dayNum);
      if (isMilestoneDay) {
        setTimeout(() => setShowCelebration(true), 400);
      }
    }
  }, [currentStepIndex, totalSteps, sessionStartTime, completeDay, state.currentDay]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sectionColor = currentStep ? sectionColorMap[currentStep.type] : C.accent;
  const sectionBg = currentStep ? sectionBgMap[currentStep.type] : C.accentBg;
  const sectionGradient = currentStep ? sectionGradientMap[currentStep.type] : sectionGradientMap.teach;

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
                  <View style={[styles.completeBadge, { backgroundColor: C.sageLight }]}>
                    <Heart size={26} color={C.sage} fill={C.sage} />
                  </View>
                </View>

                <Text style={[styles.completeTitle, { color: C.text }]}>
                  Day {completedDay} Complete
                </Text>
                <Text style={[styles.completeSubtitle, { color: C.textSecondary }]}>
                  {encouragementForDay(completedDay)}
                </Text>

                {isMilestoneDay && milestone && (
                  <View style={[styles.milestoneRecapCard, { backgroundColor: C.accentBg, borderColor: C.accentLight }]}>
                    <Text style={styles.milestoneRecapEmoji}>&#127942;</Text>
                    <View style={styles.milestoneRecapTextWrap}>
                      <Text style={[styles.milestoneRecapLabel, { color: C.accentDark }]}>MILESTONE REACHED</Text>
                      <Text style={[styles.milestoneRecapMessage, { color: C.text }]}>{milestone.message}</Text>
                    </View>
                  </View>
                )}

                <View style={[styles.recapSection, { borderColor: C.border }]}>
                  <Text style={[styles.recapSectionTitle, { color: C.textMuted }]}>WHAT YOU COVERED</Text>
                  {[
                    { label: 'Settle', color: sectionColorMap.settle, bg: sectionBgMap.settle },
                    { label: 'Teach', color: sectionColorMap.teach, bg: sectionBgMap.teach },
                    { label: 'TRIAD Prayer', color: sectionColorMap.triad, bg: sectionBgMap.triad },
                    { label: 'Silence', color: sectionColorMap.silence, bg: sectionBgMap.silence },
                    { label: 'Activate', color: sectionColorMap.act, bg: sectionBgMap.act },
                  ].map((item, i) => (
                    <View key={i} style={styles.recapPhaseRow}>
                      <View style={[styles.recapPhaseCheck, { backgroundColor: item.bg }]}>
                        <Check size={12} color={item.color} strokeWidth={2.5} />
                      </View>
                      <Text style={[styles.recapPhaseTitle, { color: C.text }]}>{item.label}</Text>
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
                    <Text style={[styles.doneButtonText, { color: '#FFFFFF' }]}>Done</Text>
                  </LinearGradient>
                </AnimatedPressable>
              </Animated.View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  const isSilenceStep = currentStep?.type === 'silence';
  const hasTimer = isSilenceStep && currentStep.timerSeconds && currentStep.timerSeconds > 0;
  const isOpenTimerStep = isSilenceStep && currentStep.isOpenTimer;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={sectionGradient as [string, string]}
        style={styles.root}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: C.overlayLight }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={C.textSecondary} />
            </TouchableOpacity>
            <View style={styles.phaseIndicator}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.phaseDot,
                    { backgroundColor: C.border },
                    i === currentStepIndex && [styles.phaseDotActive, { backgroundColor: sectionColor }],
                    i < currentStepIndex && { backgroundColor: C.accentLight },
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={handleToggleMute}
              style={[styles.muteButton, { backgroundColor: C.overlayLight }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              testID="ambient-mute-toggle"
            >
              {state.ambientMuted || state.soundscape === 'silence' ? (
                <VolumeX size={18} color={C.textMuted} />
              ) : (
                <Volume2 size={18} color={sectionColor} />
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
              <View style={[styles.phaseTag, { backgroundColor: sectionBg }]}>
                <View style={[styles.phaseTagDot, { backgroundColor: sectionColor }]} />
                <Text style={[styles.phaseTagText, { color: sectionColor }]}>
                  {currentStep.title}
                </Text>
              </View>

              {currentStep.subtitle ? (
                <Text style={[styles.phaseSubtitle, { color: C.text }, largeFontSize && styles.phaseSubtitleLarge]}>
                  {currentStep.subtitle}
                </Text>
              ) : null}

              <Text style={[styles.phaseText, { color: C.textSecondary }, largeFontSize && styles.phaseTextLarge]}>
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
                  <Text style={[styles.breathLabelText, { color: sectionColor }]}>{breathLabel}</Text>
                  <Text style={[styles.breathHintText, { color: C.textMuted }]}>Follow the circle</Text>
                </View>
              )}

              {isSilenceStep && (
                <View style={styles.silenceIndicator}>
                  <Animated.View
                    style={[
                      styles.silencePulseOuter,
                      { backgroundColor: sectionBg, opacity: breatheAnim },
                    ]}
                  />
                  <View style={[styles.silencePulse, { backgroundColor: sectionBg }]} />
                  <Text style={[styles.silenceText, { color: C.textMuted }]}>Be still</Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>

          <View style={styles.bottomBar}>
            {isSilenceStep && (hasTimer || isOpenTimerStep) && (
              <View style={styles.timerRow}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsPaused(!isPaused);
                  }}
                  style={[styles.pauseButton, { backgroundColor: sectionBg }]}
                  activeOpacity={0.7}
                >
                  {isPaused ? (
                    <Play size={14} color={sectionColor} />
                  ) : (
                    <Pause size={14} color={sectionColor} />
                  )}
                </TouchableOpacity>
                <Text style={[styles.timerText, { color: C.textMuted }]}>
                  {isOpenTimerStep ? formatTime(openTimerElapsed) : formatTime(timeRemaining)}
                </Text>
                {hasTimer && (
                  <View style={[styles.progressBarContainer, { backgroundColor: C.border }]}>
                    <Animated.View
                      style={[
                        styles.progressBar,
                        {
                          backgroundColor: sectionColor,
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            )}

            <AnimatedPressable
              style={[styles.nextButton, { shadowColor: C.accentDeep }]}
              onPress={handleNextStep}
              scaleValue={0.97}
              hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
            >
              <LinearGradient
                colors={[sectionColor, sectionColor]}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>
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
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  phaseDotActive: {
    width: 28,
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
    marginBottom: 24,
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
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 20,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  phaseSubtitleLarge: {
    fontSize: 28,
    lineHeight: 38,
  },
  phaseText: {
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: 0.15,
  },
  phaseTextLarge: {
    fontSize: 21,
    lineHeight: 34,
  },
  silenceIndicator: {
    alignItems: 'center',
    marginTop: 40,
    gap: 14,
  },
  silencePulseOuter: {
    position: 'absolute' as const,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  silencePulse: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  silenceText: {
    fontSize: 13,
    letterSpacing: 1.5,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
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
    fontWeight: '600' as const,
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
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700' as const,
    width: 42,
    fontVariant: ['tabular-nums'],
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  nextButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  nextButtonGradient: {
    paddingVertical: 18,
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
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  completeBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontSize: 30,
    fontWeight: '700' as const,
    marginBottom: 8,
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
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  milestoneRecapEmoji: {
    fontSize: 28,
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
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 32,
    gap: 14,
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
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  doneButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});
