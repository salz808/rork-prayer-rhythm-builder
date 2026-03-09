import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Check, ArrowLeft, Volume2, VolumeX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/providers/AppProvider';
import { getHtmlDay, getPhaseLabel, BLOCKER_OPENERS, milestones } from '@/mocks/content';
import { HtmlDayData } from '@/types';
import { SOUNDSCAPE_MAP } from '@/constants/soundscapes';
import AnimatedPressable from '@/components/AnimatedPressable';
import CelebrationParticles from '@/components/CelebrationParticles';
import RadialGlow from '@/components/RadialGlow';
import { Fonts } from '@/constants/fonts';



interface PhaseSection {
  id: string;
  icon: string;
  name: string;
  sub: string;
  content: string | null;
  isPrompt: boolean;
}

interface SessionNavItem {
  id: string;
  label: string;
  opensPhase: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  settle: 'Settle',
  focus: 'Focus',
  thank: 'Thank',
  repent: 'Repent',
  invite: 'Invite',
  ask: 'Ask',
  declare: 'Declare',
  selah: 'Selah',
  act: 'Live It',
  verse: 'Verse',
};

function buildPhases(d: HtmlDayData): PhaseSection[] {
  const phases: PhaseSection[] = [];

  const items: { id: string; icon: string; name: string; sub: string; sc: string | null; pr?: string | null }[] = [
    { id: 'thank', icon: '🙏', name: 'Thank & Praise', sub: "Start with what's true", sc: d.thank, pr: d.thankPrompt },
    { id: 'repent', icon: '🤍', name: 'Repent & Forgive', sub: 'Honesty that brings freedom', sc: d.repent, pr: d.repentPrompt },
    { id: 'invite', icon: '🕊️', name: 'Invite Holy Spirit', sub: 'Into your spirit, soul & body', sc: d.invite, pr: d.invitePrompt },
    { id: 'ask', icon: '🙌', name: 'Ask & Receive', sub: 'A loving Father', sc: d.ask, pr: d.askPrompt },
    { id: 'declare', icon: '✨', name: 'Declare', sub: 'Your identity in Christ', sc: d.declare, pr: d.declarePrompt },
  ];

  for (const p of items) {
    if (p.sc) {
      phases.push({ id: p.id, icon: p.icon, name: p.name, sub: p.sub, content: p.sc, isPrompt: false });
    } else if (p.pr) {
      phases.push({ id: p.id, icon: p.icon, name: p.name, sub: p.sub, content: p.pr, isPrompt: true });
    }
  }

  return phases;
}

export default function SessionScreen() {
  const router = useRouter();
  const { state, completeDay, toggleAmbientMute, updatePhaseTimings } = useApp();

  const dayData = useMemo(() => getHtmlDay(state.currentDay), [state.currentDay]);
  const phaseLabel = useMemo(() => getPhaseLabel(state.currentDay), [state.currentDay]);
  const phases = useMemo(() => buildPhases(dayData), [dayData]);

  const [openPhase, setOpenPhase] = useState<string | null>(null);
  const [phaseStart, setPhaseStart] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [completedDay, setCompletedDay] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(dayData.silence * 60);
  const timerTotal = dayData.silence * 60;
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const completeScaleAnim = useRef(new Animated.Value(0.8)).current;
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsetsRef = useRef<Record<string, number>>({});
  const pendingScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const audioStartedRef = useRef(false);
  const fadeInIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSoundscape = SOUNDSCAPE_MAP[state.soundscape];
  const audioUrl = currentSoundscape?.uri ?? null;
  const quickNavItems = useMemo<SessionNavItem[]>(() => {
    const phaseItems: SessionNavItem[] = [
      { id: 'focus', label: SECTION_LABELS.focus, opensPhase: true },
      ...phases.map((phase) => ({
        id: phase.id,
        label: SECTION_LABELS[phase.id] ?? phase.name,
        opensPhase: true,
      })),
    ];

    return [
      { id: 'settle', label: SECTION_LABELS.settle, opensPhase: false },
      ...phaseItems,
      { id: 'selah', label: SECTION_LABELS.selah, opensPhase: false },
      { id: 'act', label: SECTION_LABELS.act, opensPhase: false },
      { id: 'verse', label: SECTION_LABELS.verse, opensPhase: false },
    ];
  }, [phases]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

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
          { shouldPlay: false, isLooping: true, volume: 0 }
        );
        if (!mounted) { await sound.unloadAsync(); return; }
        soundRef.current = sound;
        console.log('[Session] Audio loaded');
        if (!state.ambientMuted) {
          audioStartedRef.current = true;
          await sound.setVolumeAsync(0);
          await sound.playAsync();
          const TARGET = 0.3;
          const STEPS = 15;
          let s = 0;
          fadeInIntervalRef.current = setInterval(async () => {
            s++;
            try { await soundRef.current?.setVolumeAsync(Math.min((s / STEPS) * TARGET, TARGET)); } catch {}
            if (s >= STEPS && fadeInIntervalRef.current) {
              clearInterval(fadeInIntervalRef.current);
              fadeInIntervalRef.current = null;
            }
          }, 200);
        }
      } catch (e) {
        console.log('[Session] Audio load error:', e);
      }
    };
    void loadAudio();
    return () => {
      mounted = false;
      if (fadeInIntervalRef.current) { clearInterval(fadeInIntervalRef.current); fadeInIntervalRef.current = null; }
      if (soundRef.current) { void soundRef.current.unloadAsync(); soundRef.current = null; }
    };
  }, [audioUrl, state.soundscape, state.ambientMuted]);

  useEffect(() => {
    const updateVolume = async () => {
      if (!soundRef.current || !audioStartedRef.current) return;
      try {
        if (state.ambientMuted) {
          if (fadeInIntervalRef.current) { clearInterval(fadeInIntervalRef.current); fadeInIntervalRef.current = null; }
          await soundRef.current.setVolumeAsync(0);
        } else {
          await soundRef.current.setVolumeAsync(0.3);
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && !status.isPlaying) await soundRef.current.playAsync();
        }
      } catch {}
    };
    void updateVolume();
  }, [state.ambientMuted]);

  useEffect(() => {
    if (isComplete && soundRef.current) {
      const fadeOut = async () => {
        try {
          for (let v = 0.3; v >= 0; v -= 0.05) {
            await soundRef.current!.setVolumeAsync(Math.max(v, 0));
            await new Promise(r => setTimeout(r, 80));
          }
          await soundRef.current!.pauseAsync();
        } catch {}
      };
      void fadeOut();
    }
  }, [isComplete]);

  const handleToggleMute = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleAmbientMute();
  }, [toggleAmbientMute]);

  function togglePhase(phaseId: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('[Session] Toggling phase', { phaseId, openPhase });

    if (openPhase && phaseStart) {
      const elapsed = Math.floor((Date.now() - phaseStart) / 1000);
      if (elapsed > 0) {
        updatePhaseTimings(openPhase, elapsed);
      }
    }

    if (openPhase === phaseId) {
      setOpenPhase(null);
      setPhaseStart(null);
    } else {
      setOpenPhase(phaseId);
      setPhaseStart(Date.now());
    }

    scheduleScrollToSection(phaseId);
  }

  const handleStartTimer = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!timerRunning) {
      setTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimerRunning(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [timerRunning]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pendingScrollTimeoutRef.current) {
        clearTimeout(pendingScrollTimeoutRef.current);
        pendingScrollTimeoutRef.current = null;
      }
    };
  }, []);

  const registerSection = useCallback((sectionId: string) => {
    return (event: LayoutChangeEvent) => {
      const nextY = event.nativeEvent.layout.y;
      sectionOffsetsRef.current[sectionId] = nextY;
      console.log('[Session] Registered section layout', { sectionId, y: nextY });
    };
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const nextY = sectionOffsetsRef.current[sectionId];

    if (typeof nextY !== 'number') {
      console.log('[Session] Missing section layout for scroll', { sectionId });
      return;
    }

    const targetY = Math.max(nextY - 20, 0);
    console.log('[Session] Scrolling to section', { sectionId, targetY });
    scrollRef.current?.scrollTo({ y: targetY, animated: true });
  }, []);

  const scheduleScrollToSection = useCallback((sectionId: string) => {
    if (pendingScrollTimeoutRef.current) {
      clearTimeout(pendingScrollTimeoutRef.current);
      pendingScrollTimeoutRef.current = null;
    }

    pendingScrollTimeoutRef.current = setTimeout(() => {
      scrollToSection(sectionId);
      pendingScrollTimeoutRef.current = null;
    }, 90);
  }, [scrollToSection]);

  const handleComplete = useCallback(() => {
    if (openPhase && phaseStart) {
      const elapsed = Math.floor((Date.now() - phaseStart) / 1000);
      if (elapsed > 0) updatePhaseTimings(openPhase, elapsed);
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRunning(false);

    const duration = Math.round((Date.now() - sessionStartTime) / 1000);
    const dayNum = Math.min(Math.max(state.currentDay, 1), 30);
    setCompletedDay(dayNum);
    completeDay(dayNum, duration);
    setIsComplete(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const isMilestone = milestones.some(m => m.day === dayNum);
    if (isMilestone) setTimeout(() => setShowCelebration(true), 400);
  }, [openPhase, phaseStart, sessionStartTime, state.currentDay, completeDay, updatePhaseTimings]);

  function handleSectionNavPress(item: SessionNavItem) {
    console.log('[Session] Quick nav pressed', item);

    if (item.opensPhase) {
      togglePhase(item.id);
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scheduleScrollToSection(item.id);
  }

  const handleClose = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const timerProgress = timerTotal > 0 ? 1 - (timerSeconds / timerTotal) : 0;


  if (isComplete) {
    const isMilestoneDay = milestones.some(m => m.day === completedDay);
    const milestone = milestones.find(m => m.day === completedDay);
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.root}>
          <LinearGradient colors={['#0D0804', '#1A1006', '#0D0804']} style={StyleSheet.absoluteFill} />
          <CelebrationParticles active={showCelebration} />
          <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.recapScroll} showsVerticalScrollIndicator={false}>
              <Animated.View style={[styles.recapContainer, { opacity: fadeAnim, transform: [{ scale: completeScaleAnim }] }]}>
                <View style={styles.completeBadgeOuter}>
                  <View style={styles.completeBadgeInner}>
                    <Check size={28} color="#C89A5A" strokeWidth={2.4} />
                  </View>
                </View>
                <Text style={[styles.completeDayLabel, { fontFamily: Fonts.titleMedium }]}>DAY {completedDay}</Text>
                <Text style={[styles.completeTitle, { fontFamily: Fonts.serifLight }]}>Prayer Complete</Text>
                <Text style={[styles.completeSub, { fontFamily: Fonts.italic }]}>
                  {completedDay === 1 ? "You showed up. That's the hardest part." :
                   completedDay === 7 ? "One full week of faithfulness." :
                   completedDay === 14 ? "Halfway through. Look how far you've come." :
                   completedDay === 21 ? "Three weeks. Something has changed in you." :
                   completedDay === 30 ? "You don't need this app anymore. But you're always welcome." :
                   "You're building something beautiful."}
                </Text>
                {isMilestoneDay && milestone && (
                  <View style={styles.milestoneCard}>
                    <Text style={styles.milestoneEmoji}>🏆</Text>
                    <View style={styles.milestoneTextWrap}>
                      <Text style={[styles.milestoneLabel, { fontFamily: Fonts.titleMedium }]}>MILESTONE REACHED</Text>
                      <Text style={[styles.milestoneMessage, { fontFamily: Fonts.titleRegular }]}>{milestone.message}</Text>
                    </View>
                  </View>
                )}
                <AnimatedPressable style={styles.doneButton} onPress={handleClose} scaleValue={0.96} testID="session-done">
                  <LinearGradient colors={['#C8894A', '#A06228']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.doneButtonGradient}>
                    <Text style={[styles.doneButtonText, { fontFamily: Fonts.titleMedium }]}>DONE</Text>
                  </LinearGradient>
                </AnimatedPressable>
              </Animated.View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </>
    );
  }

  const blockerIdx = state.user?.blocker ?? -1;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        <LinearGradient colors={['#0D0804', '#1A1006', '#0D0804']} style={StyleSheet.absoluteFill} />
        <View style={styles.ambientTopGlowWrap} pointerEvents="none">
          <RadialGlow size={340} maxOpacity={0.07} />
        </View>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleClose} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <ArrowLeft size={18} color="rgba(244,237,224,0.7)" />
              <Text style={[styles.backText, { fontFamily: Fonts.titleLight }]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleMute} style={styles.muteBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              {state.ambientMuted ? (
                <VolumeX size={16} color="rgba(200,137,74,0.4)" />
              ) : (
                <Volume2 size={16} color="#C89A5A" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Text style={[styles.prDayLabel, { fontFamily: Fonts.titleSemiBold }]}>
                {'• Day ' + state.currentDay + ' · ' + phaseLabel}
              </Text>
              <Text style={[styles.prTitle, { fontFamily: Fonts.serifLight }]}>{dayData.title}</Text>
              <Text style={[styles.prSub, { fontFamily: Fonts.italic }]}>Spirit · Soul · Body</Text>
              <Text style={[styles.prSoundscape, { fontFamily: Fonts.titleLight }]}>
                {'Sound · ' + currentSoundscape.label}
              </Text>
            </Animated.View>

            <Animated.View style={[styles.quickNavWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickNavContent}
                testID="session-quick-nav"
              >
                {quickNavItems.map((item) => {
                  const isActive = openPhase === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSectionNavPress(item)}
                      style={({ pressed, hovered }: any) => [
                        styles.quickNavChip,
                        isActive && styles.quickNavChipActive,
                        hovered && styles.quickNavChipHovered,
                        pressed && styles.quickNavChipPressed,
                      ]}
                      testID={`session-nav-${item.id}`}
                    >
                      <Text
                        style={[
                          styles.quickNavChipText,
                          { fontFamily: isActive ? Fonts.titleMedium : Fonts.titleLight },
                          isActive && styles.quickNavChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            <Animated.View style={[styles.phasesContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View onLayout={registerSection('settle')} collapsable={false} testID="section-settle">
                <View style={styles.settleCard}>
                <LinearGradient
                  colors={['rgba(200,137,74,0.25)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.settleCardTopLine}
                />
                <Text style={[styles.settleLbl, { fontFamily: Fonts.titleSemiBold }]}>SETTLE</Text>
                <Text style={[styles.settleTxt, { fontFamily: Fonts.italic }]}>{dayData.settle}</Text>
                </View>
              </View>

              <View onLayout={registerSection('focus')} collapsable={false} testID="section-focus">
              <Pressable
                style={({ pressed, hovered }: any) => [
                  styles.phase,
                  openPhase === 'focus' && styles.phaseOpen,
                  (hovered && openPhase !== 'focus') && styles.phaseHovered,
                  pressed && styles.phasePressed,
                ]}
                onPress={() => togglePhase('focus')}
              >
                <View style={styles.phaseHdr}>
                  <View style={[styles.phaseIco, openPhase === 'focus' && styles.phaseIcoOpen]}>
                    <Text style={styles.phaseIcoText}>🔦</Text>
                  </View>
                  <View style={styles.phaseHdrText}>
                    <Text style={[styles.phaseName, { fontFamily: Fonts.titleSemiBold }]}>FOCUS</Text>
                    <Text style={[styles.phaseSub, { fontFamily: Fonts.italic }]}>Today&apos;s truth</Text>
                  </View>
                  <ChevronDown
                    size={14}
                    color={openPhase === 'focus' ? 'rgba(200,137,74,0.65)' : 'rgba(200,137,74,0.32)'}
                    style={[styles.phaseChev, openPhase === 'focus' && styles.phaseChevOpen]}
                  />
                </View>
                {openPhase === 'focus' && (
                  <View style={styles.phaseBody}>
                    <View style={styles.phaseBodyBorder} />
                    {blockerIdx >= 0 && state.currentDay === 1 && BLOCKER_OPENERS[blockerIdx] && (
                      <View style={styles.identityBar}>
                        <Text style={styles.identityIcon}>💬</Text>
                        <Text style={[styles.identityText, { fontFamily: Fonts.italic }]}>{BLOCKER_OPENERS[blockerIdx]}</Text>
                      </View>
                    )}
                    <Text style={[styles.focusText, { fontFamily: Fonts.serifRegular }]}>{dayData.focus}</Text>
                    {dayData.identity ? (
                      <View style={[styles.identityBar, { marginTop: 12 }]}>
                        <Text style={styles.identityIcon}>🔑</Text>
                        <Text style={[styles.identityTextBold, { fontFamily: Fonts.serifSemiBold }]}>{dayData.identity}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </Pressable>
              </View>

              {phases.map(p => (
                <View key={p.id} onLayout={registerSection(p.id)} collapsable={false} testID={`section-${p.id}`}>
                <Pressable
                  style={({ pressed, hovered }: any) => [
                    styles.phase,
                    openPhase === p.id && styles.phaseOpen,
                    (hovered && openPhase !== p.id) && styles.phaseHovered,
                    pressed && styles.phasePressed,
                  ]}
                  onPress={() => togglePhase(p.id)}
                >
                  <View style={styles.phaseHdr}>
                    <View style={[styles.phaseIco, openPhase === p.id && styles.phaseIcoOpen]}>
                      <Text style={styles.phaseIcoText}>{p.icon}</Text>
                    </View>
                    <View style={styles.phaseHdrText}>
                      <Text style={[styles.phaseName, { fontFamily: Fonts.titleSemiBold }]}>{p.name.toUpperCase()}</Text>
                      <Text style={[styles.phaseSub, { fontFamily: Fonts.italic }]}>{p.sub}</Text>
                    </View>
                    <ChevronDown
                      size={14}
                      color={openPhase === p.id ? 'rgba(200,137,74,0.65)' : 'rgba(200,137,74,0.32)'}
                      style={[styles.phaseChev, openPhase === p.id && styles.phaseChevOpen]}
                    />
                  </View>
                  {openPhase === p.id && (
                    <View style={styles.phaseBody}>
                      <View style={styles.phaseBodyBorder} />
                      {p.isPrompt ? (
                        <View style={styles.promptCard}>
                          <Text style={[styles.promptText, { fontFamily: Fonts.italic }]}>{p.content}</Text>
                        </View>
                      ) : (
                        <View style={styles.prayCard}>
                          <Text style={styles.prayQuote}>❝</Text>
                          <Text style={[styles.prayText, { fontFamily: Fonts.italic }]}>{p.content}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
                </View>
              ))}

              {dayData.silence > 0 ? (
                <View onLayout={registerSection('selah')} collapsable={false} testID="section-selah">
                <View style={styles.timerCard}>
                  <Text style={[styles.timerLbl, { fontFamily: Fonts.titleSemiBold }]}>SELAH</Text>
                  <Text style={[styles.timerEyebrow, { fontFamily: Fonts.italic }]}>
                    You&apos;ve spoken. Now be still and let Him respond.
                  </Text>
                  <View style={styles.timerRingWrap}>
                    <View style={styles.timerRing}>
                      <View style={styles.timerCenter}>
                        <Text style={[styles.timerDisplay, { fontFamily: Fonts.titleLight }]}>
                          {timerSeconds === 0 ? '✓' : formatTimer(timerSeconds)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.timerProgressRing, { borderColor: `rgba(200,137,74,${0.15 + timerProgress * 0.55})` }]}>
                      <View style={[
                        styles.timerProgressFill,
                        { transform: [{ rotate: `${timerProgress * 360}deg` }] },
                      ]} />
                    </View>
                  </View>
                  <Text style={[styles.timerTxt, { fontFamily: Fonts.italic }]}>{dayData.silenceTxt}</Text>
                  <TouchableOpacity style={styles.timerBtn} onPress={handleStartTimer} activeOpacity={0.7}>
                    <Text style={[styles.timerBtnText, { fontFamily: Fonts.titleLight }]}>
                      {timerSeconds === 0 ? 'DONE ✓' : timerRunning ? 'PAUSE' : timerSeconds < timerTotal ? 'RESUME' : 'START'}
                    </Text>
                  </TouchableOpacity>
                </View>
                </View>
              ) : (
                <View onLayout={registerSection('selah')} collapsable={false} testID="section-selah">
                <View style={styles.timerCard}>
                  <Text style={[styles.timerLbl, { fontFamily: Fonts.titleSemiBold }]}>SELAH</Text>
                  <Text style={[styles.timerOpenTxt, { fontFamily: Fonts.italic }]}>{dayData.silenceTxt}</Text>
                </View>
                </View>
              )}

              <View onLayout={registerSection('act')} collapsable={false} testID="section-act">
              <View style={styles.actCard}>
                <LinearGradient
                  colors={['rgba(200,137,74,0.4)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.settleCardTopLine}
                />
                <Text style={[styles.actLbl, { fontFamily: Fonts.titleSemiBold }]}>GO & LIVE IT</Text>
                <Text style={[styles.actTxt, { fontFamily: Fonts.serifRegular }]}>{dayData.act}</Text>
              </View>
              </View>

              <View onLayout={registerSection('verse')} collapsable={false} testID="section-verse">
              <View style={styles.verseBar}>
                <Text style={styles.verseIcon}>📜</Text>
                <Text style={[styles.verseText, { fontFamily: Fonts.italic }]}>{dayData.verse}</Text>
              </View>
              </View>

              <AnimatedPressable
                style={styles.completeBtn}
                onPress={handleComplete}
                scaleValue={0.96}
                hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
                testID="complete-day"
              >
                <LinearGradient
                  colors={['#D49550', '#A86B2A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.completeBtnGradient}
                >
                  <Text style={[styles.completeBtnText, { fontFamily: Fonts.titleMedium }]}>
                    MARK DAY {state.currentDay} COMPLETE ✓
                  </Text>
                </LinearGradient>
              </AnimatedPressable>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
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
  ambientTopGlowWrap: {
    position: 'absolute',
    top: -80,
    left: '50%' as unknown as number,
    marginLeft: -170,
    zIndex: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.7,
  },
  backText: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: '#F4EDE0',
  },
  muteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.15)',
    backgroundColor: 'rgba(200,137,74,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 120,
  },
  prDayLabel: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: '#C8894A',
    marginBottom: 8,
  },
  prTitle: {
    fontSize: 40,
    lineHeight: 44,
    color: '#F4EDE0',
    marginBottom: 6,
  },
  prSub: {
    fontSize: 15,
    color: 'rgba(244,237,224,0.55)',
    marginBottom: 8,
  },
  prSoundscape: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: 'rgba(200,137,74,0.68)',
    marginBottom: 24,
  },
  quickNavWrap: {
    marginBottom: 18,
  },
  quickNavContent: {
    gap: 8,
    paddingRight: 8,
  },
  quickNavChip: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.14)',
    backgroundColor: 'rgba(39,26,10,0.55)',
  },
  quickNavChipActive: {
    borderColor: 'rgba(212,149,80,0.38)',
    backgroundColor: 'rgba(212,149,80,0.14)',
  },
  quickNavChipHovered: {
    borderColor: 'rgba(200,137,74,0.24)',
    backgroundColor: 'rgba(44,30,12,0.84)',
  },
  quickNavChipPressed: {
    opacity: 0.82,
  },
  quickNavChipText: {
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    color: 'rgba(244,237,224,0.6)',
  },
  quickNavChipTextActive: {
    color: '#F4EDE0',
  },
  phasesContainer: {
    gap: 14,
  },
  settleCard: {
    backgroundColor: 'rgba(200,137,74,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.11)',
    borderRadius: 18,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  settleCardTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  settleLbl: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: '#C8894A',
    marginBottom: 12,
    opacity: 0.85,
  },
  settleTxt: {
    fontSize: 17,
    lineHeight: 30,
    color: 'rgba(244,237,224,0.55)',
  },
  phase: {
    backgroundColor: 'rgba(39,26,10,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.13)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  phaseOpen: {
    borderColor: 'rgba(200,137,74,0.28)',
  },
  phaseHovered: {
    borderColor: 'rgba(200,137,74,0.22)',
    backgroundColor: 'rgba(44,30,12,0.8)',
  },
  phasePressed: {
    opacity: 0.85,
  },
  phaseHdr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 18,
    paddingBottom: 16,
  },
  phaseIco: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(200,137,74,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseIcoOpen: {
    backgroundColor: 'rgba(200,137,74,0.15)',
    borderColor: 'rgba(200,137,74,0.32)',
  },
  phaseIcoText: {
    fontSize: 15,
  },
  phaseHdrText: {
    flex: 1,
  },
  phaseName: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#C8894A',
  },
  phaseSub: {
    fontSize: 13,
    color: 'rgba(244,237,224,0.55)',
    marginTop: 2,
  },
  phaseChev: {
    opacity: 0.6,
  },
  phaseChevOpen: {
    transform: [{ rotate: '180deg' }],
    opacity: 1,
  },
  phaseBody: {
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  phaseBodyBorder: {
    height: 1,
    backgroundColor: 'rgba(200,137,74,0.1)',
    marginBottom: 18,
  },
  focusText: {
    fontSize: 17,
    lineHeight: 30,
    color: 'rgba(244,237,224,0.55)',
  },
  identityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(200,137,74,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.18)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  identityIcon: {
    fontSize: 20,
  },
  identityText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(244,237,224,0.55)',
  },
  identityTextBold: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: '#E0A868',
  },
  prayCard: {
    padding: 18,
    paddingLeft: 20,
    backgroundColor: 'rgba(200,137,74,0.04)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(200,137,74,0.38)',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    position: 'relative',
  },
  prayQuote: {
    position: 'absolute',
    top: -6,
    left: 16,
    fontSize: 28,
    color: 'rgba(200,137,74,0.18)',
  },
  prayText: {
    fontSize: 17,
    lineHeight: 30,
    color: '#F4EDE0',
  },
  promptCard: {
    padding: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(200,137,74,0.04)',
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(200,137,74,0.22)',
    borderRadius: 12,
  },
  promptText: {
    fontSize: 17,
    lineHeight: 30,
    color: 'rgba(244,237,224,0.55)',
  },
  timerCard: {
    backgroundColor: 'rgba(39,26,10,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.13)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 16,
  },
  timerLbl: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: '#C8894A',
    opacity: 0.85,
  },
  timerEyebrow: {
    fontSize: 14,
    color: 'rgba(244,237,224,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: -4,
    marginBottom: 4,
  },
  timerRingWrap: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timerRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2.5,
    borderColor: 'rgba(200,137,74,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDisplay: {
    fontSize: 24,
    color: '#F4EDE0',
  },
  timerProgressRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  timerProgressFill: {},
  timerTxt: {
    fontSize: 15,
    color: 'rgba(244,237,224,0.55)',
    textAlign: 'center',
    lineHeight: 26,
  },
  timerOpenTxt: {
    fontSize: 18,
    color: 'rgba(244,237,224,0.55)',
    textAlign: 'center',
    lineHeight: 30,
  },
  timerBtn: {
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.28)',
    borderRadius: 100,
  },
  timerBtnText: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: '#F4EDE0',
  },
  actCard: {
    backgroundColor: 'rgba(200,137,74,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.16)',
    borderRadius: 18,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  actLbl: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: '#C8894A',
    marginBottom: 12,
  },
  actTxt: {
    fontSize: 18,
    lineHeight: 30,
    color: '#F4EDE0',
  },
  verseBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(200,137,74,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.18)',
    borderRadius: 14,
    padding: 16,
  },
  verseIcon: {
    fontSize: 20,
  },
  verseText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(244,237,224,0.55)',
  },
  completeBtn: {
    borderRadius: 100,
    overflow: 'hidden',
    marginTop: 10,
  },
  completeBtnGradient: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnText: {
    fontSize: 12.5,
    letterSpacing: 2,
    color: '#180C02',
  },
  recapScroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapContainer: {
    alignItems: 'center',
    width: '100%',
  },
  completeBadgeOuter: {
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
  completeBadgeInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(200,154,90,0.08)',
  },
  completeDayLabel: {
    fontSize: 11,
    letterSpacing: 2.4,
    marginBottom: 8,
    color: 'rgba(200,154,90,0.5)',
    textTransform: 'uppercase' as const,
  },
  completeTitle: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
    color: '#F5EFE7',
    marginBottom: 10,
    textAlign: 'center',
  },
  completeSub: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    color: 'rgba(216,203,184,0.5)',
    paddingHorizontal: 12,
  },
  milestoneCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(200,137,74,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,137,74,0.25)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
  },
  milestoneEmoji: {
    fontSize: 28,
  },
  milestoneTextWrap: {
    flex: 1,
    gap: 4,
  },
  milestoneLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#C8894A',
    textTransform: 'uppercase' as const,
  },
  milestoneMessage: {
    fontSize: 15,
    lineHeight: 21,
    color: '#F4EDE0',
  },
  doneButton: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 12.5,
    letterSpacing: 2.5,
    color: '#180C02',
  },
});
