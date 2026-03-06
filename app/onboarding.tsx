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
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useApp, scheduleReminderNotification } from '@/providers/AppProvider';
import { UserProfile } from '@/types';

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
      completeOnboarding({
        firstName: firstName.trim(),
        prayerLife,
        reminderTime,
        onboardingComplete: true,
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
              { backgroundColor: C.border },
              i === stepIndex && [styles.dotActive, { backgroundColor: C.accent }],
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.root, { backgroundColor: C.background }]}>
        <View style={[styles.glowT, { backgroundColor: C.accent }]} />

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
                  <Text style={[styles.splashWordmark, { color: C.text }]}>Amen</Text>
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
                  <Text style={[styles.splashTag, { color: C.textSecondary }]}>
                    God is <Text style={[styles.splashTagEm, { color: C.accentDark }]}>much closer</Text> than you think.
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
                    <Text style={[styles.ghostBtnText, { color: C.text }]}>BEGIN YOUR 30 DAYS</Text>
                  </TouchableOpacity>
                  <Text style={[styles.splashSub, { color: C.textMuted }]}>
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
                        <Text style={[styles.eyebrow, { color: C.accent }]}>A NEW BEGINNING</Text>
                        <Text style={[styles.screenTitle, { color: C.text }]}>
                          What do people{'\n'}call <Text style={[styles.titleEm, { color: C.accentDark }]}>you?</Text>
                        </Text>
                        <View style={[styles.screenRule, { backgroundColor: C.accent }]} />
                        <Text style={[styles.screenBody, { color: C.textSecondary }]}>
                          God has known your name since before the foundations of the earth. He calls you beloved. We just want to say it back.
                        </Text>
                        <View style={styles.nameInputWrap}>
                          <TextInput
                            style={[styles.nameInput, { color: C.text, borderBottomColor: C.border }]}
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
                          <Text style={[styles.nameHelp, { color: C.textMuted }]}>
                            This is just between you and God, and us.
                          </Text>
                        </View>
                      </View>
                    )}

                    {step === 'blocker' && (
                      <View>
                        <Text style={[styles.eyebrow, { color: C.accent }]}>BE HONEST WITH US</Text>
                        <Text style={[styles.screenTitle, { color: C.text }]}>
                          What usually{'\n'}holds back your{'\n'}
                          <Text style={[styles.titleEm, { color: C.accentDark }]}>prayer life?</Text>
                        </Text>
                        <View style={[styles.screenRule, { backgroundColor: C.accent }]} />
                        <Text style={[styles.screenBody, { color: C.textSecondary }]}>
                          No wrong answers here.{' '}
                          <Text style={{ color: C.accentDark, fontStyle: 'italic' }}>Every struggle is a doorway</Text>.
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
                                  { backgroundColor: C.surface, borderColor: C.border },
                                  isSelected && { backgroundColor: C.accentBg, borderColor: C.accent, transform: [{ translateX: 4 }] },
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
                                    { color: C.textSecondary },
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
                        <Text style={[styles.eyebrow, { color: C.accent }]}>YOUR INHERITANCE</Text>
                        <Text style={[styles.screenTitle, { color: C.text }]}>
                          Not a program.{'\n'}A{' '}
                          <Text style={[styles.titleEm, { color: C.accentDark }]}>journey into wholeness.</Text>
                        </Text>
                        <View style={[styles.screenRule, { backgroundColor: C.accent }]} />
                        <Text style={[styles.screenBody, { color: C.textSecondary }]}>
                          Thirty days from now, you will pray without a script. You'll know your voice with God, and{' '}
                          <Text style={{ fontStyle: 'italic', color: C.accentDark }}>His</Text> voice in return.
                        </Text>
                        <Text style={[styles.screenBody, { color: C.textSecondary, marginTop: 16 }]}>
                          You weren't meant to live stuck in prayerless silence.{' '}
                          <Text style={{ color: C.text, fontWeight: '500' as const }}>
                            Freedom is possible. A deeper relationship with God is possible.
                          </Text>
                        </Text>
                        <Text style={[styles.screenBody, { color: C.textSecondary, marginTop: 16 }]}>
                          You are not too far gone. Not too ordinary. Not starting too late. You are exactly the kind of person this was made for.
                        </Text>
                      </View>
                    )}

                    {step === 'framework' && (
                      <View>
                        <Text style={[styles.eyebrow, { color: C.accent }]}>YOUR DAILY GUIDE</Text>
                        <Text style={[styles.screenTitle, { color: C.text }]}>
                          The TRIAD{'\n'}
                          <Text style={[styles.titleEm, { color: C.accentDark }]}>framework</Text>
                        </Text>
                        <View style={[styles.screenRule, { backgroundColor: C.accent }]} />
                        <Text style={[styles.screenBody, { color: C.textSecondary, marginBottom: 22 }]}>
                          Five anchors covering the full range of authentic prayer: spirit, soul, and body. You learn them by doing, not by studying.
                        </Text>
                        <View style={styles.triadList}>
                          {TRIAD_ITEMS.map((item) => (
                            <Animated.View
                              key={item.name}
                              style={[
                                styles.triadItem,
                                { backgroundColor: C.accentBg, borderColor: C.border },
                              ]}
                            >
                              <Text style={styles.triadEmoji}>{item.emoji}</Text>
                              <View style={styles.triadTextWrap}>
                                <Text style={[styles.triadName, { color: C.accent }]}>{item.name.toUpperCase()}</Text>
                                <Text style={[styles.triadDesc, { color: C.textSecondary }]}>{item.desc}</Text>
                              </View>
                            </Animated.View>
                          ))}
                        </View>
                      </View>
                    )}

                    {step === 'reminder' && (
                      <View>
                        <Text style={[styles.eyebrow, { color: C.accent }]}>NEVER MISS A DAY</Text>
                        <Text style={[styles.screenTitle, { color: C.text }]}>
                          When should we{'\n'}remind{' '}
                          <Text style={[styles.titleEm, { color: C.accentDark }]}>you?</Text>
                        </Text>
                        <View style={[styles.screenRule, { backgroundColor: C.accent }]} />
                        <Text style={[styles.screenBody, { color: C.textSecondary }]}>
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
                                  { backgroundColor: C.surface, borderColor: C.border },
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
                                  <Text style={[styles.reminderLabel, { color: isSelected ? C.text : C.textSecondary }]}>
                                    {time.label}
                                  </Text>
                                  <Text style={[styles.reminderValue, { color: isSelected ? C.accentDark : C.textMuted }]}>
                                    {time.value}
                                  </Text>
                                </View>
                                <View style={[styles.reminderRadio, { borderColor: isSelected ? C.accent : C.border }]}>
                                  {isSelected && <View style={[styles.reminderRadioDot, { backgroundColor: C.accent }]} />}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <View style={[styles.graceBadge, { backgroundColor: C.accentBg, borderColor: C.border }]}>
                          <Text style={styles.graceEmoji}>🛡️</Text>
                          <Text style={[styles.graceBadgeText, { color: C.accent }]}>
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
                        colors={['#D49550', '#A86B2A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.amberBtnInner}
                      >
                        <Text style={styles.amberBtnText}>STEP INTO DAY 1</Text>
                        <ChevronRight size={16} color="#180C02" />
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
                          colors={['#D49550', '#A86B2A']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.amberBtnInner}
                        >
                          <Text style={styles.amberBtnText}>SET MY REMINDER</Text>
                          <ChevronRight size={16} color="#180C02" />
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.skipBtn}
                        onPress={handleNext}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.skipBtnText, { color: C.textMuted }]}>Skip for now</Text>
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
                      <Text style={[styles.ghostBtnText, { color: C.text }]}>
                        {step === 'name'
                          ? "THAT'S ME →"
                          : step === 'blocker'
                            ? 'CONTINUE →'
                            : "I'M READY →"}
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
    top: -50,
    left: '50%',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.07,
    transform: [{ translateX: -140 }],
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
    bottom: -60,
    left: '50%',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.12,
    transform: [{ translateX: -160 }],
  },
  splashGlowCenter: {
    position: 'absolute',
    top: '36%',
    left: '50%',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.04,
    transform: [{ translateX: -120 }, { translateY: -120 }],
  },
  splashBrand: {
    alignItems: 'center',
    marginBottom: 20,
  },
  splashWordmark: {
    fontSize: 76,
    fontWeight: '200' as const,
    letterSpacing: 11,
    lineHeight: 80,
  },
  splashRuleWrap: {
    marginBottom: 22,
  },
  splashRule: {
    width: 180,
    height: 1.5,
  },
  splashTagWrap: {
    marginBottom: 60,
  },
  splashTag: {
    fontSize: 16.5,
    fontStyle: 'italic' as const,
    textAlign: 'center',
    lineHeight: 24,
  },
  splashTagEm: {
    fontStyle: 'normal' as const,
    fontWeight: '500' as const,
  },
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
    fontStyle: 'italic' as const,
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
    fontSize: 9,
    fontWeight: '500' as const,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 42,
    fontWeight: '300' as const,
    lineHeight: 46,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  titleEm: {
    fontStyle: 'italic' as const,
  },
  screenRule: {
    width: 44,
    height: 1.5,
    opacity: 0.55,
    marginBottom: 18,
  },
  screenBody: {
    fontSize: 18,
    lineHeight: 32,
    fontWeight: '300' as const,
  },
  nameInputWrap: {
    marginTop: 36,
  },
  nameInput: {
    fontSize: 30,
    fontWeight: '300' as const,
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    fontStyle: 'italic' as const,
  },
  nameHelp: {
    fontSize: 13,
    fontStyle: 'italic' as const,
    marginTop: 10,
    opacity: 0.48,
  },
  choices: {
    gap: 10,
    marginTop: 28,
  },
  choiceBtn: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
  },
  choiceBtnText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '300' as const,
  },
  triadList: {
    gap: 8,
  },
  triadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 13,
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
    fontWeight: '600' as const,
    letterSpacing: 2,
    marginBottom: 3,
  },
  triadDesc: {
    fontSize: 14,
    fontWeight: '300' as const,
    lineHeight: 20,
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
    fontWeight: '500' as const,
  },
  reminderValue: {
    fontSize: 12,
    fontWeight: '300' as const,
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
    fontWeight: '500' as const,
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
    paddingVertical: 17,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontSize: 12.5,
    fontWeight: '300' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  amberBtn: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#C8894A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  amberBtnInner: {
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  amberBtnText: {
    fontSize: 12.5,
    fontWeight: '500' as const,
    letterSpacing: 2,
    color: '#180C02',
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
    fontWeight: '400' as const,
  },
});
