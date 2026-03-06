import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, RefreshCw, ArrowRight, Heart, Globe, Sprout } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';

type PurchasesPackage = {
  identifier: string;
  product: {
    identifier: string;
    priceString: string;
  };
};

type PurchasesOffering = {
  identifier: string;
  availablePackages: PurchasesPackage[];
};

const getPurchases = () => {
  try {
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
};

const Purchases = getPurchases();

interface TierInfo {
  id: string;
  icon: typeof Heart;
  title: string;
  badge?: string;
  check: string;
  price: string;
  period: string;
  desc: string;
  gradient: [string, string];
  iconBg: string;
  pkg?: PurchasesPackage;
}

export default function GiveScreen() {
  const C = useColors();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.55, duration: 3500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.25, duration: 3500, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, glowPulse]);

  const offeringsQuery = useQuery({
    queryKey: ['offerings'],
    queryFn: async (): Promise<PurchasesOffering | null> => {
      if (!Purchases) {
        console.log('[Give] RevenueCat not available');
        return null;
      }
      const offerings = await Purchases.getOfferings();
      return offerings.current ?? null;
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      if (!Purchases) throw new Error('Purchases not available');
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Thank you! 🙏', 'Your support means everything.');
    },
    onError: (error: unknown) => {
      const err = error as { userCancelled?: boolean; message?: string };
      if (!err.userCancelled) {
        Alert.alert('Something went wrong', 'Please try again.');
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!Purchases) throw new Error('Purchases not available');
      return await Purchases.restorePurchases();
    },
    onSuccess: (customerInfo: { entitlements: { active: Record<string, unknown> } }) => {
      const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
      if (hasActive) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Restored!', 'Your support has been restored.');
      } else {
        Alert.alert('Nothing to restore', 'No active subscriptions found.');
      }
    },
    onError: () => {
      Alert.alert('Restore failed', 'Please try again later.');
    },
  });

  const packages = offeringsQuery.data?.availablePackages ?? [];

  const tiers: TierInfo[] = [
    {
      id: 'free',
      icon: Heart,
      title: 'Support Development',
      check: 'Keep the app free for all',
      price: '$0.99',
      period: '/mo',
      desc: 'Help us keep building and improving this app for everyone who needs it.',
      gradient: ['#C8894A', '#A06228'],
      iconBg: 'rgba(200,137,74,0.15)',
      pkg: packages[0],
    },
    {
      id: 'missions',
      icon: Globe,
      title: 'Share the Gospel',
      badge: 'MISSIONS',
      check: 'Fund global missions',
      price: '$9.99',
      period: '/mo',
      desc: '100% goes toward missions around the world to share the Gospel of Jesus Christ.',
      gradient: ['#D49550', '#A86B2A'],
      iconBg: 'rgba(212,149,80,0.18)',
      pkg: packages[1],
    },
    {
      id: 'partner',
      icon: Sprout,
      title: 'Kingdom Partner',
      badge: 'PARTNER',
      check: 'Development + missions combined',
      price: '$24.99',
      period: '/mo',
      desc: 'Split between keeping the app free and funding missions. For those who want to do both.',
      gradient: ['#C8894A', '#8E5522'],
      iconBg: 'rgba(200,137,74,0.15)',
      pkg: packages[2],
    },
  ];

  const handlePurchase = (tier: TierInfo) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (tier.pkg) {
      purchaseMutation.mutate(tier.pkg);
    } else {
      Alert.alert('Coming Soon', 'Subscriptions will be available when the app launches.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <Animated.View style={[styles.glowTop, { opacity: glowPulse, backgroundColor: C.accent }]} />
      <Animated.View style={[styles.glowBottom, { opacity: Animated.multiply(glowPulse, 0.5), backgroundColor: C.accent }]} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.headerSection}>
              <View style={[styles.headerIconWrap, { backgroundColor: C.accentBg }]}>
                <Heart size={20} color={C.accent} fill={C.accent} />
              </View>
              <Text style={[styles.eyebrow, { color: C.accent, fontFamily: Fonts.titleMedium }]}>
                SUPPORT THIS CAUSE
              </Text>
              <Text style={[styles.title, { color: C.text, fontFamily: Fonts.serifLight }]}>
                This app is free.{'\n'}
                <Text style={{ color: C.accentDark, fontFamily: Fonts.italicMedium, fontSize: 32 }}>
                  Always will be.
                </Text>
              </Text>
              <View style={[styles.titleRule, { backgroundColor: C.accent }]} />
              <Text style={[styles.mission, { color: C.textSecondary, fontFamily: Fonts.italic, fontSize: 18 }]}>
                Your support keeps it alive and helps{' '}
                <Text style={{ color: C.text }}>
                  share the Gospel of Jesus Christ with the world.
                </Text>
              </Text>
            </View>

            {offeringsQuery.isLoading ? (
              <ActivityIndicator color={C.accent} style={{ marginVertical: 40 }} />
            ) : (
              <View style={styles.tiersContainer}>
                {tiers.map((tier, idx) => {
                  const Icon = tier.icon;
                  return (
                    <AnimatedPressable
                      key={tier.id}
                      style={[styles.tierCard, { borderColor: C.border }]}
                      onPress={() => handlePurchase(tier)}
                      scaleValue={0.97}
                      testID={`give-${tier.id}`}
                    >
                      <LinearGradient
                        colors={[C.surfaceElevated, C.surface]}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={styles.tierCardInner}
                      >
                        <View style={[styles.tierCardAccent, { backgroundColor: C.accent, opacity: idx === 1 ? 0.5 : 0.25 }]} />

                        <View style={styles.tierTop}>
                          <View style={[styles.tierIco, { backgroundColor: tier.iconBg, borderColor: C.border }]}>
                            <Icon size={18} color={C.accentDark} />
                          </View>
                          <View style={styles.tierNameWrap}>
                            <View style={styles.tierNameRow}>
                              <Text style={[styles.tierName, { color: C.text, fontFamily: Fonts.titleSemiBold }]}>{tier.title}</Text>
                              {tier.badge && (
                                <View style={[styles.tierBadge, { backgroundColor: C.accentBg, borderColor: C.accent + '40' }]}>
                                  <Text style={[styles.tierBadgeText, { color: C.accentDark, fontFamily: Fonts.titleBold }]}>{tier.badge}</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.tierCheckRow}>
                              <Check size={11} color={C.accent} strokeWidth={2} />
                              <Text style={[styles.tierCheck, { color: C.textSecondary, fontFamily: Fonts.italic }]}>{tier.check}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.tierPriceRow}>
                          <Text style={[styles.tierPrice, { color: C.text, fontFamily: Fonts.titleLight }]}>{tier.price}</Text>
                          <Text style={[styles.tierPeriod, { color: C.textMuted, fontFamily: Fonts.titleLight }]}>{tier.period}</Text>
                        </View>

                        <Text style={[styles.tierDesc, { color: C.textSecondary, fontFamily: Fonts.titleLight }]}>{tier.desc}</Text>

                        <View style={styles.tierBtnWrap}>
                          <LinearGradient
                            colors={tier.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.tierBtnGradient}
                          >
                            <Text style={[styles.tierBtnText, { fontFamily: Fonts.titleMedium }]}>Subscribe</Text>
                            <ArrowRight size={14} color="#fff" />
                          </LinearGradient>
                        </View>
                      </LinearGradient>
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}

            <View style={[styles.footerNote, { borderColor: C.border }]}>
              <LinearGradient
                colors={[C.accentBg, 'transparent']}
                style={styles.footerNoteInner}
              >
                <Text style={[styles.footerNoteText, { color: C.textSecondary, fontFamily: Fonts.italic }]}>
                  No investors. No ads. Every dollar goes directly to app development or global missions. Just people who pray, supporting people who pray.
                </Text>
              </LinearGradient>
            </View>

            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                restoreMutation.mutate();
              }}
              disabled={purchaseMutation.isPending || restoreMutation.isPending}
              testID="restore-purchases-tab"
            >
              {restoreMutation.isPending ? (
                <ActivityIndicator color={C.textMuted} size="small" />
              ) : (
                <>
                  <RefreshCw size={13} color={C.textMuted} />
                  <Text style={[styles.restoreText, { color: C.textMuted, fontFamily: Fonts.titleRegular }]}>Restore purchases</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.legal, { color: C.textMuted, fontFamily: Fonts.titleLight }]}>
              Subscriptions renew monthly. Cancel anytime in your device settings.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: '50%',
    width: 500,
    height: 350,
    borderRadius: 250,
    transform: [{ translateX: -250 }],
    opacity: 0.06,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.04,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  content: {},
  headerSection: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  titleRule: {
    width: 44,
    height: 1.5,
    opacity: 0.55,
    marginBottom: 18,
  },
  mission: {
    lineHeight: 30,
    marginBottom: 24,
  },
  tiersContainer: {
    gap: 14,
    marginBottom: 20,
  },
  tierCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tierCardInner: {
    padding: 24,
    position: 'relative',
  },
  tierCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tierTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  tierIco: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tierNameWrap: {
    flex: 1,
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  tierName: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  tierBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 8,
    letterSpacing: 2,
  },
  tierCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tierCheck: {
    fontSize: 13,
  },
  tierPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 46,
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  tierPeriod: {
    fontSize: 18,
  },
  tierDesc: {
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 18,
  },
  tierBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  tierBtnGradient: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tierBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  footerNote: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  footerNoteInner: {
    padding: 22,
  },
  footerNoteText: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginBottom: 12,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  legal: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
});
