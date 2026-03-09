import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useApp, scheduleReminderNotification } from '@/providers/AppProvider';
import { UserProfile } from '@/types';
import { Fonts } from '@/constants/fonts';

type Step = 'splash' | 'name' | 'blocker' | 'promise' | 'framework' | 'reminder';

const BLOCKER_OPTIONS = [
  "I don't know the right words to pray",
  'It feels one-sided. Like talking to a wall.',
  "I can't stay consistent. I keep forgetting.",
  'I feel too broken or far from God to start',
];

const TRIAD_ITEMS = [
  { emoji: '🙏', name: 'Thank & Praise', desc: "Start with what's true about who God is" },
  { emoji: '🤍', name: 'Repent & Forgive', desc: 'Honesty that brings freedom, not shame' },
  { emoji: '🕊️', name: 'Invite Holy Spirit', desc: 'Welcome His presence into your whole day' },
  { emoji: '🙌', name: 'Ask & Receive', desc: 'Bring your real needs to a loving Father' },
  { emoji: '✨', name: 'Declare', desc: 'Speak your identity in Christ out loud' },
];

const REMINDER_TIMES = [
  { label: 'Early Morning', value: '6:00 AM', emoji: '🌅' },
  { label: 'Morning', value: '8:00 AM', emoji: '☀️' },
  { label: 'Midday', value: '12:00 PM', emoji: '🌤️' },
  { label: 'Evening', value: '7:00 PM', emoji: '🌇' },
  { label: 'Night', value: '9:00 PM', emoji: '🌙' },
];

const BLOCKER_TO_PRAYER: Record<string, UserProfile['prayerLife']> = {
  "I don't know the right words to pray": 'new',
  'It feels one-sided. Like talking to a wall.': 'inconsistent',
  "I can't stay consistent. I keep forgetting.": 'inconsistent',
  'I feel too broken or far from God to start': 'new',
};

export default function OnboardingScreen() {
  const router = useRouter();
  const C = useColors();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState<Step>('splash');
  const [firstName, setFirstName] = useState('');
  const [selectedBlocker, setSelectedBlocker] = useState<string | null>(null);
  const [reminderTime, setReminderTime] = useState<string>('8:00 AM');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const splashFade = useRef(new Animated.Value(0)).current;
  const splashSlide = useRef(new Animated.Value(20)).current;
  const splashRuleFade = useRef(new Animated.Value(0)).current;
  const splashBtnFade = useRef(new Animated.Value(0)).current;
  const splashBtnSlide = useRef(new Animated.Value(20)).current;

  const orbPulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (step !== 'splash') return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(orbPulse, { toValue: 0.6, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    Animated.stagger(400, [
      Animated.parallel([
        Animated.timing(splashFade, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.spring(splashSlide, { toValue: 0, tension: 40, friction: 10, useNativeDriver: true }),
      ]),
      Animated.timing(splashRuleFade, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(splashBtnFade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(splashBtnSlide, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, [step, orbPulse, splashFade, splashSlide, splashRuleFade, splashBtnFade, splashBtnSlide]);

  const transitionTo = (nextStep: Step) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'splash') {
      transitionTo('name');
    } else if (step === 'name' && firstName.trim()) {
      transitionTo('blocker');
    } else if (step === 'blocker' && selectedBlocker) {
      transitionTo('promise');
    } else if (step === 'promise') {
      transitionTo('framework');
    } else if (step === 'framework') {
      transitionTo('reminder');
    } else if (step === 'reminder') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const prayerLife = BLOCKER_TO_PRAYER[selectedBlocker ?? ''] ?? 'new';
      const blockerIdx = selectedBlocker ? BLOCKER_OPTIONS.indexOf(selectedBlocker) : -1;
      completeOnboarding({
        firstName: firstName.trim(),
        prayerLife,
        reminderTime,
        onboardingComplete: true,
        blocker: blockerIdx,
      });
      void scheduleReminderNotification(reminderTime);
      router.replace('/');
    }
  };

  const canProceed = () => {
    if (step === 'splash') return true;
    if (step === 'name') return firstName.trim().length > 0;
    if (step === 'blocker') return selectedBlocker !== null;
    if (step === 'promise') return true;
    if (step === 'framework') return true;
    return true;
  };

  const displayName = firstName.trim() || 'Friend';

  const stepMap: Record<Step, number> = { splash: -1, name: 0, blocker: 1, promise: 2, framework: 3, reminder: 4 };
  const stepIndex = stepMap[step];
  const totalDots = 5;

  const renderDots = () => {
    if (step === 'splash') return null;
    return (
      <View style={styles.dotsRow}>
        {Array.from({ length: totalDots }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: 'rgba(200,154,90,0.2)' },
              i === stepIndex && [styles.dotActive, { backgroundColor: C.accent }],
            ]}
          />
        ))}
      </View>
    );
  };

  const getButtonLabel = () => {
    if (step === 'name') return "THAT'S ME  →";
    if (step === 'blocker') return 'CONTINUE  →';
    if (step === 'promise') return "I'M READY  →";
    return 'CONTINUE  →';
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.root, { backgroundColor: C.background }]}>
        <LinearGradient
          colors={['rgba(60,36,18,0.4)', 'transparent', 'rgba(60,36,18,0.2)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={[styles.glowT, { backgroundColor: C.accent }]} />
        <View style={[styles.glowB, { backgroundColor: C.accent }]} />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {step === 'splash' ? (
              <View style={styles.splashContainer}>
                <View style={styles.splashGlowContainer}>
                  <Animated.View style={[styles.splashGlowBottom, { backgroundColor: C.accent, opacity: orbPulse }]} />
                  <Animated.View style={[styles.splashGlowCenter, { backgroundColor: C.accent }]} />
                </View>

                <Animated.View
                  style={[
                    styles.splashBrand,
                    { opacity: splashFade, transform: [{ translateY: splashSlide }] },
                  ]}
                >
                  <Text style={[styles.splashWordmark, { color: C.text, fontFamily: Fonts.serifLight }]}>Amen</Text>
                </Animated.View>

                <Animated.View style={[styles.splashRuleWrap, { opacity: splashRuleFade }]}>
                  <LinearGradient
                    colors={['transparent', C.accent, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.splashRule}
                  />
                </Animated.View>

                <Animated.View
                  style={[
                    styles.splashTagWrap,
                    { opacity: splashRuleFade, transform: [{ translateY: splashSlide }] },
                  ]}
                >
                  <Text style={[styles.splashTag, { color: C.textSecondary, fontFamily: Fonts.italic }]}>
                    God is <Text style={[styles.splashTagEm, { color: C.accentDark, fontFamily: Fonts.italicMedium }]}>much closer</Text> than you think.
                  </Text>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.splashActions,
                    { opacity: splashBtnFade, transform: [{ translateY: splashBtnSlide }] },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.ghostBtn, { borderColor: C.accent }]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    testID="onboarding-begin"
                  >
                    <Text style={[styles.ghostBtnText, { color: C.text, fontFamily: Fonts.titleLight }]}>BEGIN YOUR 30 DAYS</Text>
                  </TouchableOpacity>
                  <Text style={[styles.splashSub, { color: C.textMuted, fontFamily: Fonts.italic }]}>
                    No experience needed. No perfect words required.
                  </Text>
                </Animated.View>
              </View>
            ) : (
              <>
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Animated.View
                    style={[
                      styles.content,
                      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                  >
                    {step === 'name' && (
                      <View>
                        <Text style={[styles.eyebrow, { color: C.accent, fontFamily: Fonts.titleMedium }]}>A NEW BEGINNING</Text>
                        <Text style={[styles.screenTitle, { color: C.text, fontFamily: Fonts.serifLight }]}>
                          What do people{'\n'}call <Text style={{ color: C.accentDark, fontFamily: Fonts.italicSemiBold }}>you?</Text>
                        </Text>
                        <View style={[styles.screenRule, { backgroundColor: C.accent }]} />
                        <Text style={[styles.screenBody, { color: C.textSecondary, fontFamily: Fonts.serifRegular }]}>
                          God has known your name since before the foundations of the earth. He calls you beloved. We just want to say it back.
                        </Text>
                        <View style={styles.nameInputWrap}>
                          <TextInput
                            style={[styles.nameInput, { color: C.text, borderBottomColor: C.accent, fontFamily: Fonts.italic }]}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Your first name"
                            placeholderTextColor={C.textMuted}
                            autoFocus
                            autoCapitalize="words"
                            returnKeyType="next"
                            onSubmitEditing={handleNext}
                            testID="onboarding-name-input"
                          />
                          <Text style={[styles.nameHelp, { color: C.accent, fontFamily: Fonts.italic }]}>
                            This is just between you and God, and us.
                          </Text>
                        </View>
                      </View>
                    )}

                    {step === 'blocker' && (
                      <View>
                        <Text style={[styles.eyebrow, { color: C.accent, fontFamily: Fonts.titleMedium }]}>BE HONEST WITH US</Text>
                        <Text style={[styles.screenTitle, { color: C.text, fontFamily: Fonts.serifLight }]}>
                          What usually{'\n'}holds back your{'\n'}
                          <Text style={{ color: C.accentDark, fontFamily: Fonts.italicSemiBold }}>prayer life, {displayName}?</Text>
                        </Text>
                        <Text style={[styles.screenBody, { color: C.textSecondary, fontFamily: Fonts.serifRegular }]}>
                          No wrong answers here.{' '}
                          <Text style={{ color: C.accentDark, fontFamily: Fonts.italicMedium }}>Every struggle is a doorway</Text>.
                          {' '}Freedom is on the other side of this one.
                        </Text>
                        <View style={styles.choices}>
                          {BLOCKER_OPTIONS.map((option) => {
                            const isSelected = selectedBlocker === option;
                            return (
                              <TouchableOpacity
                                key={option}
                                style={[
                                  styles.choiceBtn,
                                  { backgroundColor: 'transparent', borderColor: 'rgba(200,154,90,0.25)' },
                                  isSelected && { backgroundColor: C.accentBg, borderColor: C.accent },
                                ]}
                                onPress={() => {
                                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setSelectedBlocker(option);
                                }}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.choiceBtnText,
                                    { color: C.textSecondary, fontFamily: Fonts.serifRegular },
                                    isSelected && { color: C.text },
                                  ]}
                                >
                                  {option}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {step === 'promise' && (
                      <View>
                        <Text style={[styles.eyebrow, { color: C.accent, fontFamily: Fonts.titleMedium }]}>YOUR INHERITANCE</Text>
                        <Text style={[styles.screenTitle, { color: C.text, fontFamily: Fonts.serifLight }]}>
                          Not a program.{'\n'}A <Text style={{ color: C.accentDark, fontFamily: Fonts.italicSemiBold }}>journey into wholeness.</Text>
                        </Text>
                        <View style={[styles.screenRule, { backgroundColor: C.accent }]} />
                        <Text style={[styles.screenBody, { color: C.textSecondary, fontFamily: Fonts.serifRegular }]}>
                          Thirty days from now, you will pray without a script. You'll know your voice with God, and His voice in return.{'\n\n'}You weren't meant to live stuck in prayerless silence.{' '}
                          <Text style={{ color: C.text, fontFamily: Fonts.serifSemiBold }}>
                            Freedom is possible. A deeper relationship with God is possible.
                          </Text>
                          {'\n\n'}You are not too far gone. Not too ordinary. Not starting too late.{' '}
                          <Text style={{ color: C.accentDark, fontFamily: Fonts.italicMedium }}>
                            You are exactly the kind of person this was made for.
                          </Text>
                        </Text>
                      </View>
                    )}

                    {step === 'framework' && (
                      <View>
                        <Text style={[styles.eyebrow, { color: C.accent, fontFamily: Fonts.titleMedium }]}>YOUR DAILY GUIDE</Text>
                        <Text style={[styles.screenTitle, { color: C.text, fontFamily: Fonts.serifLight }]}>
                          The TRIAD{'\n'}
                          <Text style={{ color: C.accentDark, fontFamily: Fonts.italicSemiBold }}>framework</Text>
                        </Text>
                        <View style={[styles.screenRule, { backgroundColor: C.accent }]} />
                        <Text style={[styles.screenBody, { color: C.textSecondary, fontFamily: Fonts.serifRegular, marginBottom: 22 }]}>
                          Five anchors covering the full range of authentic prayer: spirit, soul, and body. You learn them by doing, not by studying.
                        </Text>
                        <View style={styles.triadList}>
                          {TRIAD_ITEMS.map((item) => (
                            <View
                              key={item.name}
                              style={[
                                styles.triadItem,
                                { backgroundColor: C.accentBg, borderColor: 'rgba(200,154,90,0.15)' },
                              ]}
                            >
                              <Text style={styles.triadEmoji}>{item.emoji}</Text>
                              <View style={styles.triadTextWrap}>
                                <Text style={[styles.triadName, { color: C.accent, fontFamily: Fonts.titleSemiBold }]}>{item.name.toUpperCase()}</Text>
                                <Text style={[styles.triadDesc, { color: C.textSecondary, fontFamily: Fonts.serifRegular }]}>{item.desc}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {step === 'reminder' && (
                      <View>
                        <Text style={[styles.eyebrow, { color: C.accent, fontFamily: Fonts.titleMedium }]}>NEVER MISS A DAY</Text>
                        <Text style={[styles.screenTitle, { color: C.text, fontFamily: Fonts.serifLight }]}>
                          When should we{'\n'}remind{' '}
                          <Text style={{ color: C.accentDark, fontFamily: Fonts.italicSemiBold }}>you?</Text>
                        </Text>
                        <View style={[styles.screenRule, { backgroundColor: C.accent }]} />
                        <Text style={[styles.screenBody, { color: C.textSecondary, fontFamily: Fonts.serifRegular }]}>
                          A gentle nudge at the right moment is the difference between a habit and a wish.
                        </Text>
                        <View style={styles.reminderOptions}>
                          {REMINDER_TIMES.map((time) => {
                            const isSelected = reminderTime === time.value;
                            return (
                              <TouchableOpacity
                                key={time.value}
                                style={[
                                  styles.reminderCard,
                                  { backgroundColor: 'transparent', borderColor: 'rgba(200,154,90,0.2)' },
                                  isSelected && { backgroundColor: C.accentBg, borderColor: C.accent },
                                ]}
                                onPress={() => {
                                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setReminderTime(time.value);
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.reminderEmoji}>{time.emoji}</Text>
                                <View style={styles.reminderTextWrap}>
                                  <Text style={[styles.reminderLabel, { color: isSelected ? C.text : C.textSecondary, fontFamily: Fonts.titleRegular }]}>
                                    {time.label}
                                  </Text>
                                  <Text style={[styles.reminderValue, { color: isSelected ? C.accentDark : C.textMuted, fontFamily: Fonts.titleLight }]}>
                                    {time.value}
                                  </Text>
                                </View>
                                <View style={[styles.reminderRadio, { borderColor: isSelected ? C.accent : 'rgba(200,154,90,0.25)' }]}>
                                  {isSelected && <View style={[styles.reminderRadioDot, { backgroundColor: C.accent }]} />}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <View style={[styles.graceBadge, { backgroundColor: C.accentBg, borderColor: 'rgba(200,154,90,0.2)' }]}>
                          <Text style={styles.graceEmoji}>🛡️</Text>
                          <Text style={[styles.graceBadgeText, { color: C.accent, fontFamily: Fonts.titleMedium }]}>
                            Grace day: one miss forgiven per week
                          </Text>
                        </View>
                      </View>
                    )}

                    {renderDots()}
                  </Animated.View>
                </ScrollView>

                <View style={styles.footer}>
                  {step === 'framework' ? (
                    <TouchableOpacity
                      style={[styles.amberBtn, !canProceed() && styles.btnDisabled]}
                      onPress={handleNext}
                      disabled={!canProceed()}
                      activeOpacity={0.8}
                      testID="onboarding-next"
                    >
                      <LinearGradient
                        colors={['#C89A5A', '#A06228']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.amberBtnInner}
                      >
                        <Text style={[styles.amberBtnText, { fontFamily: Fonts.titleMedium }]}>STEP INTO DAY 1</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : step === 'reminder' ? (
                    <View style={styles.reminderActions}>
                      <TouchableOpacity
                        style={styles.amberBtn}
                        onPress={handleNext}
                        activeOpacity={0.8}
                        testID="onboarding-next"
                      >
                        <LinearGradient
                          colors={['#C89A5A', '#A06228']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.amberBtnInner}
                        >
                          <Text style={[styles.amberBtnText, { fontFamily: Fonts.titleMedium }]}>SET MY REMINDER</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.skipBtn}
                        onPress={handleNext}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.skipBtnText, { color: C.textMuted, fontFamily: Fonts.titleRegular }]}>Skip for now</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.ghostBtn,
                        { borderColor: C.accent },
                        !canProceed() && styles.btnDisabled,
                      ]}
                      onPress={handleNext}
                      disabled={!canProceed()}
                      activeOpacity={0.8}
                      testID="onboarding-next"
                    >
                      <Text style={[styles.ghostBtnText, { color: C.text, fontFamily: Fonts.titleLight }]}>
                        {getButtonLabel()}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
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
  flex: {
    flex: 1,
  },
  glowT: {
    position: 'absolute',
    top: -120,
    left: '50%',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.04,
    transform: [{ translateX: -200 }],
  },
  glowB: {
    position: 'absolute',
    bottom: -100,
    left: '50%',
    width: 380,
    height: 380,
    borderRadius: 190,
    opacity: 0.03,
    transform: [{ translateX: -190 }],
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashGlowContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  splashGlowBottom: {
    position: 'absolute',
    bottom: -80,
    left: '50%',
    width: 380,
    height: 380,
    borderRadius: 190,
    opacity: 0.08,
    transform: [{ translateX: -190 }],
  },
  splashGlowCenter: {
    position: 'absolute',
    top: '36%',
    left: '50%',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.025,
    transform: [{ translateX: -140 }, { translateY: -140 }],
  },
  splashBrand: {
    alignItems: 'center',
    marginBottom: 20,
  },
  splashWordmark: {
    fontSize: 82,
    letterSpacing: 16,
    lineHeight: 90,
  },
  splashRuleWrap: {
    marginBottom: 22,
  },
  splashRule: {
    width: 200,
    height: 1,
  },
  splashTagWrap: {
    marginBottom: 60,
  },
  splashTag: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  splashTagEm: {},
  splashActions: {
    position: 'absolute',
    bottom: 60,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 16,
  },
  splashSub: {
    fontSize: 13,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 100,
  },
  content: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 3.5,
    textTransform: 'uppercase' as const,
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  screenRule: {
    width: 44,
    height: 1.5,
    opacity: 0.55,
    marginBottom: 20,
  },
  screenBody: {
    fontSize: 19,
    lineHeight: 34,
  },
  nameInputWrap: {
    marginTop: 40,
  },
  nameInput: {
    fontSize: 30,
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  nameHelp: {
    fontSize: 14,
    marginTop: 12,
    opacity: 0.7,
  },
  choices: {
    gap: 12,
    marginTop: 30,
  },
  choiceBtn: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  choiceBtnText: {
    fontSize: 18,
    lineHeight: 26,
  },
  scriptureCard: {
    borderLeftWidth: 3,
    borderRadius: 4,
    paddingLeft: 20,
    paddingVertical: 18,
    marginTop: 32,
  },
  scriptureRef: {
    fontSize: 10,
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  scriptureText: {
    fontSize: 18,
    lineHeight: 30,
  },
  triadList: {
    gap: 8,
  },
  triadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  triadEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  triadTextWrap: {
    flex: 1,
  },
  triadName: {
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 3,
  },
  triadDesc: {
    fontSize: 15,
    lineHeight: 22,
  },
  reminderOptions: {
    gap: 10,
    marginTop: 24,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  reminderEmoji: {
    fontSize: 20,
    width: 30,
    textAlign: 'center',
  },
  reminderTextWrap: {
    flex: 1,
  },
  reminderLabel: {
    fontSize: 15,
  },
  reminderValue: {
    fontSize: 12,
    marginTop: 1,
  },
  reminderRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  graceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    marginTop: 18,
    alignSelf: 'flex-start',
  },
  graceEmoji: {
    fontSize: 14,
  },
  graceBadgeText: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 28,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    borderRadius: 3,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    paddingTop: 8,
  },
  ghostBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
  },
  amberBtn: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#C89A5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  amberBtnInner: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  amberBtnText: {
    fontSize: 12.5,
    letterSpacing: 2,
    color: '#1A120B',
  },
  btnDisabled: {
    opacity: 0.3,
  },
  reminderActions: {
    gap: 12,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipBtnText: {
    fontSize: 13,
  },
});
