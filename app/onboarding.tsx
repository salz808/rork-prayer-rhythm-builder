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
import { ChevronRight, Cross } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useApp, scheduleReminderNotification } from '@/providers/AppProvider';
import { prayerLifeOptions } from '@/mocks/content';
import { UserProfile } from '@/types';

type Step = 'welcome' | 'name' | 'prayerLife' | 'reminder';

const REMINDER_TIMES = [
  { label: 'Early Morning', value: '6:00 AM', description: 'Before the day begins', emoji: '🌅' },
  { label: 'Morning', value: '8:00 AM', description: 'Start your day right', emoji: '☀️' },
  { label: 'Midday', value: '12:00 PM', description: 'A peaceful pause', emoji: '🌤️' },
  { label: 'Evening', value: '7:00 PM', description: 'Wind down with God', emoji: '🌇' },
  { label: 'Night', value: '9:00 PM', description: 'End the day in peace', emoji: '🌙' },
];

const OPTION_EMOJIS = ['🌱', '🔄', '⛰️'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState<Step>('welcome');
  const [firstName, setFirstName] = useState('');
  const [prayerLife, setPrayerLife] = useState<UserProfile['prayerLife'] | null>(null);
  const [reminderTime, setReminderTime] = useState<string>('8:00 AM');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const orbScale1 = useRef(new Animated.Value(0.7)).current;
  const orbScale2 = useRef(new Animated.Value(0.5)).current;
  const orbOpacity1 = useRef(new Animated.Value(0.2)).current;
  const orbOpacity2 = useRef(new Animated.Value(0.15)).current;

  const welcomeTitleFade = useRef(new Animated.Value(0)).current;
  const welcomeTitleSlide = useRef(new Animated.Value(30)).current;
  const welcomeSubFade = useRef(new Animated.Value(0)).current;
  const welcomeSubSlide = useRef(new Animated.Value(20)).current;
  const welcomeFeatureFade = useRef(new Animated.Value(0)).current;
  const welcomeButtonFade = useRef(new Animated.Value(0)).current;
  const welcomeButtonSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (step !== 'welcome') return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(orbScale1, { toValue: 1.15, duration: 4000, useNativeDriver: true }),
          Animated.timing(orbScale1, { toValue: 0.7, duration: 4000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(orbScale2, { toValue: 0.95, duration: 3200, useNativeDriver: true }),
          Animated.timing(orbScale2, { toValue: 0.5, duration: 3200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(orbOpacity1, { toValue: 0.45, duration: 4000, useNativeDriver: true }),
          Animated.timing(orbOpacity1, { toValue: 0.2, duration: 4000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(orbOpacity2, { toValue: 0.35, duration: 3200, useNativeDriver: true }),
          Animated.timing(orbOpacity2, { toValue: 0.15, duration: 3200, useNativeDriver: true }),
        ]),
      ])
    ).start();

    Animated.stagger(350, [
      Animated.parallel([
        Animated.timing(welcomeTitleFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.spring(welcomeTitleSlide, { toValue: 0, tension: 40, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(welcomeSubFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(welcomeSubSlide, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
      ]),
      Animated.timing(welcomeFeatureFade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(welcomeButtonFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(welcomeButtonSlide, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, [step, orbScale1, orbScale2, orbOpacity1, orbOpacity2, welcomeTitleFade, welcomeTitleSlide, welcomeSubFade, welcomeSubSlide, welcomeFeatureFade, welcomeButtonFade, welcomeButtonSlide]);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'welcome') {
      transitionTo('name');
    } else if (step === 'name' && firstName.trim()) {
      transitionTo('prayerLife');
    } else if (step === 'prayerLife' && prayerLife) {
      transitionTo('reminder');
    } else if (step === 'reminder') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeOnboarding({
        firstName: firstName.trim(),
        prayerLife: prayerLife!,
        reminderTime,
        onboardingComplete: true,
      });
      scheduleReminderNotification(reminderTime);
      router.replace('/');
    }
  };

  const canProceed = () => {
    if (step === 'welcome') return true;
    if (step === 'name') return firstName.trim().length > 0;
    if (step === 'prayerLife') return prayerLife !== null;
    return true;
  };

  const stepIndex = step === 'welcome' ? 0 : step === 'name' ? 1 : step === 'prayerLife' ? 2 : 3;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={styles.root}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {step !== 'welcome' && (
              <View style={styles.stepIndicator}>
                {[0, 1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.stepDot,
                      i === stepIndex && styles.stepDotActive,
                      i < stepIndex && styles.stepDotComplete,
                    ]}
                  />
                ))}
              </View>
            )}

            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                step === 'welcome' && styles.welcomeScrollContent,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {step === 'welcome' ? (
                <View style={styles.welcomeContainer}>
                  <View style={styles.welcomeOrbContainer}>
                    <Animated.View
                      style={[
                        styles.welcomeOrbOuter,
                        { opacity: orbOpacity1, transform: [{ scale: orbScale1 }] },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.welcomeOrbMid,
                        { opacity: orbOpacity2, transform: [{ scale: orbScale2 }] },
                      ]}
                    />
                    <View style={styles.welcomeOrbCore} />
                  </View>

                  <Animated.View
                    style={[
                      styles.welcomeBrand,
                      { opacity: welcomeTitleFade, transform: [{ translateY: welcomeTitleSlide }] },
                    ]}
                  >
                    <View style={styles.welcomeCrossWrap}>
                      <Cross size={14} color={Colors.accentDark} style={{ opacity: 0.35 }} />
                    </View>
                    <Text style={styles.welcomeFirstLabel}>FIRST</Text>
                    <Text style={styles.welcomeNumber}>30</Text>
                  </Animated.View>

                  <Animated.View
                    style={{ opacity: welcomeSubFade, transform: [{ translateY: welcomeSubSlide }] }}
                  >
                    <Text style={styles.welcomeTagline}>
                      A 30-day guided journey{'\n'}into the heart of prayer
                    </Text>
                  </Animated.View>

                  <Animated.View style={[styles.welcomeFeatures, { opacity: welcomeFeatureFade }]}>
                    <View style={styles.welcomeFeatureLineLeft} />
                    <Text style={styles.welcomeFeatureText}>spirit</Text>
                    <View style={styles.welcomeFeatureDot} />
                    <Text style={styles.welcomeFeatureText}>soul</Text>
                    <View style={styles.welcomeFeatureDot} />
                    <Text style={styles.welcomeFeatureText}>body</Text>
                    <View style={styles.welcomeFeatureLineRight} />
                  </Animated.View>

                  <Animated.View style={[styles.welcomePhases, { opacity: welcomeFeatureFade }]}>
                    {['Guided Prayer', 'Finding Your Voice', 'You Lead', 'Freedom'].map((phase, i) => (
                      <View key={phase} style={styles.welcomePhaseRow}>
                        <View style={[styles.welcomePhaseNum, i === 0 && styles.welcomePhaseNumFirst]}>
                          <Text style={[styles.welcomePhaseNumText, i === 0 && styles.welcomePhaseNumTextFirst]}>
                            {i + 1}
                          </Text>
                        </View>
                        <Text style={[styles.welcomePhaseLabel, i === 0 && styles.welcomePhaseLabelFirst]}>
                          {phase}
                        </Text>
                      </View>
                    ))}
                  </Animated.View>
                </View>
              ) : (
                <Animated.View
                  style={[
                    styles.content,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                  ]}
                >
                  {step === 'name' && (
                    <View>
                      <View style={styles.stepLabelRow}>
                        <View style={styles.stepLabelDot} />
                        <Text style={styles.stepLabel}>WELCOME</Text>
                      </View>
                      <Text style={styles.title}>What should{'\n'}we call you?</Text>
                      <Text style={styles.subtitle}>
                        We{"'"}ll use your name to make{'\n'}this journey personal.
                      </Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          value={firstName}
                          onChangeText={setFirstName}
                          placeholder="Your first name"
                          placeholderTextColor={Colors.textMuted}
                          autoFocus
                          autoCapitalize="words"
                          returnKeyType="next"
                          onSubmitEditing={handleNext}
                          testID="onboarding-name-input"
                        />
                        <Animated.View
                          style={[
                            styles.inputUnderline,
                            {
                              backgroundColor: firstName.trim() ? Colors.accentDark : Colors.border,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.nameEncouragement}>
                        <Text style={styles.nameEncouragementText}>
                          God already knows it. We just want to say it back to you.
                        </Text>
                      </View>
                    </View>
                  )}

                  {step === 'prayerLife' && (
                    <View>
                      <View style={styles.stepLabelRow}>
                        <View style={styles.stepLabelDot} />
                        <Text style={styles.stepLabel}>YOUR JOURNEY</Text>
                      </View>
                      <Text style={styles.title}>Hi, {firstName}.</Text>
                      <Text style={styles.subtitle}>
                        Where are you in your{'\n'}prayer life right now?
                      </Text>
                      <View style={styles.optionsContainer}>
                        {prayerLifeOptions.map((option, index) => {
                          const isSelected = prayerLife === option.value;
                          return (
                            <TouchableOpacity
                              key={option.value}
                              style={[
                                styles.optionCard,
                                isSelected && styles.optionCardSelected,
                              ]}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setPrayerLife(option.value);
                              }}
                              activeOpacity={0.7}
                              testID={`option-${option.value}`}
                            >
                              <View style={[styles.optionEmoji, isSelected && styles.optionEmojiSelected]}>
                                <Text style={styles.optionEmojiText}>{OPTION_EMOJIS[index]}</Text>
                              </View>
                              <View style={styles.optionTextWrap}>
                                <Text
                                  style={[
                                    styles.optionLabel,
                                    isSelected && styles.optionLabelSelected,
                                  ]}
                                >
                                  {option.label}
                                </Text>
                                <Text
                                  style={[
                                    styles.optionDescription,
                                    isSelected && styles.optionDescriptionSelected,
                                  ]}
                                >
                                  {option.description}
                                </Text>
                              </View>
                              <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                                {isSelected && <View style={styles.optionRadioDot} />}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {step === 'reminder' && (
                    <View>
                      <View style={styles.stepLabelRow}>
                        <View style={styles.stepLabelDot} />
                        <Text style={styles.stepLabel}>DAILY RHYTHM</Text>
                      </View>
                      <Text style={styles.title}>When works{'\n'}best for you?</Text>
                      <Text style={styles.subtitle}>
                        We{"'"}ll send a gentle reminder{'\n'}to keep your rhythm going.
                      </Text>
                      <View style={styles.optionsContainer}>
                        {REMINDER_TIMES.map(time => {
                          const isSelected = reminderTime === time.value;
                          return (
                            <TouchableOpacity
                              key={time.value}
                              style={[
                                styles.timeCard,
                                isSelected && styles.timeCardSelected,
                              ]}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setReminderTime(time.value);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.timeEmoji}>{time.emoji}</Text>
                              <View style={styles.timeTextContainer}>
                                <Text
                                  style={[
                                    styles.timeLabel,
                                    isSelected && styles.timeLabelSelected,
                                  ]}
                                >
                                  {time.label}
                                </Text>
                                <Text style={styles.timeDescription}>{time.description}</Text>
                              </View>
                              <View style={styles.timeRight}>
                                <Text
                                  style={[
                                    styles.timeValue,
                                    isSelected && styles.timeValueSelected,
                                  ]}
                                >
                                  {time.value}
                                </Text>
                                <View style={[styles.timeRadio, isSelected && styles.timeRadioSelected]}>
                                  {isSelected && <View style={styles.timeRadioDot} />}
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </Animated.View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              {step === 'welcome' ? (
                <Animated.View
                  style={{ opacity: welcomeButtonFade, transform: [{ translateY: welcomeButtonSlide }] }}
                >
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    testID="onboarding-next"
                  >
                    <LinearGradient
                      colors={[Colors.accentDark, Colors.accentDeep]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.nextButtonInner}
                    >
                      <Text style={styles.nextButtonText}>Begin</Text>
                      <ChevronRight size={20} color={Colors.white} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <TouchableOpacity
                  style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
                  onPress={handleNext}
                  disabled={!canProceed()}
                  activeOpacity={0.8}
                  testID="onboarding-next"
                >
                  <LinearGradient
                    colors={canProceed() ? [Colors.accentDark, Colors.accentDeep] : [Colors.textMuted, Colors.textMuted]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.nextButtonInner}
                  >
                    <Text style={styles.nextButtonText}>
                      {step === 'reminder' ? "Begin Your Journey" : 'Continue'}
                    </Text>
                    <ChevronRight size={20} color={Colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  welcomeScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 28,
    paddingTop: 12,
    marginBottom: 32,
  },
  stepDot: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.accentDark,
    width: 48,
  },
  stepDotComplete: {
    backgroundColor: Colors.accentLight,
  },
  content: {
    flex: 1,
  },

  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  welcomeOrbContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  welcomeOrbOuter: {
    position: 'absolute' as const,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.accentLight,
  },
  welcomeOrbMid: {
    position: 'absolute' as const,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.accent,
  },
  welcomeOrbCore: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.accentDark,
    shadowColor: Colors.accentDeep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 10,
  },
  welcomeBrand: {
    alignItems: 'center',
    marginBottom: 22,
  },
  welcomeCrossWrap: {
    marginBottom: 8,
  },
  welcomeFirstLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 14,
    color: Colors.textMuted,
    marginBottom: -6,
  },
  welcomeNumber: {
    fontSize: 80,
    fontWeight: '200' as const,
    color: Colors.text,
    letterSpacing: -5,
  },
  welcomeTagline: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 32,
    letterSpacing: 0.3,
  },
  welcomeFeatures: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 40,
  },
  welcomeFeatureText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accentDark,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },
  welcomeFeatureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accentLight,
  },
  welcomeFeatureLineLeft: {
    width: 20,
    height: 1,
    backgroundColor: Colors.accentLight,
    opacity: 0.5,
  },
  welcomeFeatureLineRight: {
    width: 20,
    height: 1,
    backgroundColor: Colors.accentLight,
    opacity: 0.5,
  },
  welcomePhases: {
    gap: 14,
    width: '100%',
    maxWidth: 280,
  },
  welcomePhaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  welcomePhaseNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomePhaseNumFirst: {
    backgroundColor: Colors.accentBg,
  },
  welcomePhaseNumText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  welcomePhaseNumTextFirst: {
    color: Colors.accentDark,
  },
  welcomePhaseLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  welcomePhaseLabelFirst: {
    color: Colors.text,
    fontWeight: '600' as const,
  },

  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentDark,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 2,
    color: Colors.accentDark,
  },
  title: {
    fontSize: 38,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: -1.2,
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 25,
    marginBottom: 36,
  },
  inputContainer: {
    marginTop: 8,
  },
  input: {
    fontSize: 24,
    color: Colors.text,
    paddingVertical: 16,
    paddingHorizontal: 0,
    fontWeight: '500' as const,
  },
  inputUnderline: {
    height: 2,
    borderRadius: 1,
  },
  nameEncouragement: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  nameEncouragementText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 22,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  optionCardSelected: {
    borderColor: Colors.accentDark,
    backgroundColor: Colors.accentBg,
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  optionEmoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmojiSelected: {
    backgroundColor: Colors.accentLight,
  },
  optionEmojiText: {
    fontSize: 20,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  optionLabelSelected: {
    color: Colors.accentDeep,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  optionDescriptionSelected: {
    color: Colors.accentDark,
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: {
    borderColor: Colors.accentDark,
  },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accentDark,
  },
  timeCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  timeCardSelected: {
    borderColor: Colors.accentDark,
    backgroundColor: Colors.accentBg,
  },
  timeEmoji: {
    fontSize: 22,
    width: 36,
    textAlign: 'center',
  },
  timeTextContainer: {
    flex: 1,
    gap: 2,
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  timeLabelSelected: {
    color: Colors.accentDeep,
  },
  timeDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  timeRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  timeValueSelected: {
    color: Colors.accentDark,
  },
  timeRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRadioSelected: {
    borderColor: Colors.accentDark,
  },
  timeRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentDark,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    paddingTop: 8,
  },
  nextButton: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: Colors.accentDeep,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  nextButtonDisabled: {
    opacity: 0.35,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonInner: {
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
