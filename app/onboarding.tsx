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
import { ChevronRight, Clock, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useApp, scheduleReminderNotification } from '@/providers/AppProvider';
import { prayerLifeOptions } from '@/mocks/content';
import { UserProfile } from '@/types';

type Step = 'name' | 'prayerLife' | 'reminder';

const REMINDER_TIMES = [
  { label: 'Early Morning', value: '6:00 AM', description: 'Before the day begins', emoji: '🌅' },
  { label: 'Morning', value: '8:00 AM', description: 'Start your day right', emoji: '☀️' },
  { label: 'Midday', value: '12:00 PM', description: 'A peaceful pause', emoji: '🌤️' },
  { label: 'Evening', value: '7:00 PM', description: 'Wind down with God', emoji: '🌇' },
  { label: 'Night', value: '9:00 PM', description: 'End the day in peace', emoji: '🌙' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState<Step>('name');
  const [firstName, setFirstName] = useState('');
  const [prayerLife, setPrayerLife] = useState<UserProfile['prayerLife'] | null>(null);
  const [reminderTime, setReminderTime] = useState<string>('8:00 AM');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [glowAnim]);

  const transitionTo = (nextStep: Step) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -40, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(40);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'name' && firstName.trim()) {
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
    if (step === 'name') return firstName.trim().length > 0;
    if (step === 'prayerLife') return prayerLife !== null;
    return true;
  };

  const stepNumber = step === 'name' ? 1 : step === 'prayerLife' ? 2 : 3;

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
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.stepIndicator}>
                {[1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.stepDot,
                      i === stepNumber && styles.stepDotActive,
                      i < stepNumber && styles.stepDotComplete,
                    ]}
                  />
                ))}
              </View>

              <Animated.View
                style={[
                  styles.content,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
              >
                {step === 'name' && (
                  <View>
                    <Animated.View style={[styles.welcomeGlow, { opacity: glowAnim }]} />
                    <View style={styles.brandRow}>
                      <Sparkles size={16} color={Colors.accentDark} />
                      <Text style={styles.label}>Welcome to</Text>
                    </View>
                    <Text style={styles.title}>First 30</Text>
                    <Text style={styles.subtitle}>
                      30 days to build a prayer life{'\n'}that stays with you.
                    </Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>What's your first name?</Text>
                      <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Your name"
                        placeholderTextColor={Colors.textMuted}
                        autoFocus
                        autoCapitalize="words"
                        returnKeyType="next"
                        onSubmitEditing={handleNext}
                        testID="onboarding-name-input"
                      />
                    </View>
                  </View>
                )}

                {step === 'prayerLife' && (
                  <View>
                    <Text style={styles.title}>Hi, {firstName}.</Text>
                    <Text style={styles.subtitle}>
                      How would you describe{'\n'}your prayer life right now?
                    </Text>
                    <View style={styles.optionsContainer}>
                      {prayerLifeOptions.map(option => {
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
                            <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                              {isSelected && <View style={styles.optionRadioDot} />}
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
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {step === 'reminder' && (
                  <View>
                    <Text style={styles.title}>When works best?</Text>
                    <Text style={styles.subtitle}>
                      We'll send a gentle reminder{'\n'}to keep your rhythm going.
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
                            <View style={styles.timeLeft}>
                              <View style={[styles.timeIconWrap, isSelected && styles.timeIconWrapSelected]}>
                                <Clock
                                  size={16}
                                  color={isSelected ? Colors.accentDark : Colors.textMuted}
                                />
                              </View>
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
                            </View>
                            <Text
                              style={[
                                styles.timeValue,
                                isSelected && styles.timeValueSelected,
                              ]}
                            >
                              {time.value}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </Animated.View>
            </ScrollView>

            <View style={styles.footer}>
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
                    {step === 'reminder' ? "Let's Begin" : 'Continue'}
                  </Text>
                  <ChevronRight size={20} color={Colors.white} />
                </LinearGradient>
              </TouchableOpacity>
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
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 44,
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
  welcomeGlow: {
    position: 'absolute' as const,
    top: -40,
    left: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.accentBg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    fontWeight: '500' as const,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.8,
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
  inputLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    letterSpacing: 0.3,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  input: {
    fontSize: 22,
    color: Colors.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentDark,
    paddingVertical: 14,
    paddingHorizontal: 0,
    fontWeight: '500' as const,
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionCardSelected: {
    borderColor: Colors.accentDark,
    backgroundColor: Colors.accentBg,
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
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.accentDeep,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  optionDescriptionSelected: {
    color: Colors.accentDark,
  },
  timeCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  timeCardSelected: {
    borderColor: Colors.accentDark,
    backgroundColor: Colors.accentBg,
  },
  timeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeIconWrapSelected: {
    backgroundColor: Colors.accentLight,
  },
  timeTextContainer: {
    gap: 1,
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
  timeValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  timeValueSelected: {
    color: Colors.accentDark,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    paddingTop: 8,
  },
  nextButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.accentDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.35,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonInner: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
