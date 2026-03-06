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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, RefreshCw, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { Fonts } from '@/constants/fonts';

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
  emoji: string;
  title: string;
  badge?: string;
  badgeColor?: string;
  check: string;
  price: string;
  period: string;
  desc: string;
  btnStyle: 'outline' | 'amber' | 'moss';
  featured?: boolean;
  pkg?: PurchasesPackage;
}

export default function PaywallScreen() {
  const router = useRouter();
  const C = useColors();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const offeringsQuery = useQuery({
    queryKey: ['offerings'],
    queryFn: async (): Promise<PurchasesOffering | null> => {
      if (!Purchases) {
        console.log('[Paywall] RevenueCat not available');
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
      Alert.alert('Thank you! 🙏', "Your support means everything.", [
        { text: 'Continue', onPress: () => router.back() },
      ]);
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
    onSuccess: (customerInfo) => {
      const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
      if (hasActive) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Restored!', 'Your support has been restored.', [
          { text: 'Continue', onPress: () => router.back() },
        ]);
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
      emoji: '🤍',
      title: 'Support Development',
      check: 'Keep the app free for all',
      price: '$0.99',
      period: '/mo',
      desc: 'Help us keep building and improving this app for everyone who needs it.',
      btnStyle: 'outline',
      pkg: packages[0],
    },
    {
      id: 'missions',
      emoji: '🌍',
      title: 'Share the Gospel',
      badge: 'MISSIONS',
      check: 'Fund global missions',
      price: '$9.99',
      period: '/mo',
      desc: '100% goes toward missions around the world to share the Gospel of Jesus Christ.',
      btnStyle: 'amber',
      featured: true,
      pkg: packages[1],
    },
    {
      id: 'partner',
      emoji: '🌱',
      title: 'Kingdom Partner',
      badge: 'PARTNER',
      badgeColor: 'moss',
      check: 'Development + missions combined',
      price: '$24.99',
      period: '/mo',
      desc: 'Split between keeping the app free and funding missions. For those who want to do both.',
      btnStyle: 'moss',
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
      <View style={[styles.glowT, { backgroundColor: C.accent }]} />
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: C.overlayLight }]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID="paywall-close"
        >
          <X size={18} color={C.textMuted} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[styles.eyebrow, { color: C.accent, fontFamily: Fonts.titleMedium }]}>SUPPORT THIS CAUSE</Text>
            <Text style={[styles.title, { color: C.text, fontFamily: Fonts.serifLight }]}>
              This app is free.{'\n'}
              <Text style={{ color: C.accentDark, fontFamily: Fonts.italicMedium, fontSize: 32 }}>Always will be.</Text>
            </Text>
            <View style={[styles.titleRule, { backgroundColor: C.accent }]} />

            <Text style={[styles.mission, { color: C.textSecondary, fontFamily: Fonts.italic }]}>
              Your support keeps it alive and helps{' '}
              <Text style={{ color: C.text }}>
                share the Gospel of Jesus Christ with the world.
              </Text>
            </Text>

            {offeringsQuery.isLoading ? (
              <ActivityIndicator color={C.accent} style={{ marginVertical: 40 }} />
            ) : (
              <View style={styles.tiersContainer}>
                {tiers.map((tier) => (
                  <View
                    key={tier.id}
                    style={[
                      styles.tierCard,
                      { borderColor: C.border },
                      tier.featured && { borderColor: 'rgba(200,137,74,0.45)' },
                    ]}
                  >
                    <LinearGradient
                      colors={tier.featured
                        ? [C.surfaceElevated, C.surface]
                        : [C.surfaceElevated, C.surface]
                      }
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={styles.tierCardInner}
                    >
                      <View style={[styles.tierCardTopLine, { backgroundColor: C.accent, opacity: tier.featured ? 0.45 : 0.25 }]} />

                      <View style={styles.tierTop}>
                        <View style={[
                          styles.tierIco,
                          { backgroundColor: C.accentBg, borderColor: C.border },
                          tier.featured && { backgroundColor: 'rgba(200,137,74,0.15)', borderColor: 'rgba(200,137,74,0.35)' },
                          tier.badgeColor === 'moss' && { backgroundColor: 'rgba(62,130,80,0.15)', borderColor: 'rgba(62,130,80,0.32)' },
                        ]}>
                          <Text style={styles.tierEmojiText}>{tier.emoji}</Text>
                        </View>
                        <View style={styles.tierNameWrap}>
                          <View style={styles.tierNameRow}>
                            <Text style={[styles.tierName, { color: C.text, fontFamily: Fonts.titleSemiBold }]}>{tier.title}</Text>
                            {tier.badge && (
                              <View style={[
                                styles.tierBadge,
                                { backgroundColor: 'rgba(200,137,74,0.18)', borderColor: 'rgba(200,137,74,0.35)' },
                                tier.badgeColor === 'moss' && { backgroundColor: 'rgba(62,130,80,0.18)', borderColor: 'rgba(62,130,80,0.38)' },
                              ]}>
                                <Text style={[
                                  styles.tierBadgeText,
                                  { color: C.accentDark },
                                  tier.badgeColor === 'moss' && { color: '#8ED09A' },
                                ]}>{tier.badge}</Text>
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
                        <Text style={[styles.tierPrice, { color: C.text, fontFamily: Fonts.serifLight }]}>{tier.price}</Text>
                        <Text style={[styles.tierPeriod, { color: C.textMuted, fontFamily: Fonts.titleLight }]}>{tier.period}</Text>
                      </View>

                      <Text style={[styles.tierDesc, { color: C.textSecondary, fontFamily: Fonts.titleLight }]}>{tier.desc}</Text>

                      <TouchableOpacity
                        style={[
                          styles.tierBtn,
                          tier.btnStyle === 'outline' && { borderWidth: 1, borderColor: 'rgba(200,137,74,0.3)', backgroundColor: 'transparent' },
                        ]}
                        onPress={() => handlePurchase(tier)}
                        activeOpacity={0.82}
                        disabled={purchaseMutation.isPending || restoreMutation.isPending}
                        testID={`purchase-${tier.id}`}
                      >
                        {tier.btnStyle === 'amber' ? (
                          <LinearGradient
                            colors={['#C8894A', '#A06228']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.tierBtnGradient}
                          >
                            <Text style={[styles.tierBtnText, { color: '#fff' }]}>Subscribe</Text>
                            <ArrowRight size={14} color="#fff" />
                          </LinearGradient>
                        ) : tier.btnStyle === 'moss' ? (
                          <LinearGradient
                            colors={['#4A9E5C', '#2E7040']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.tierBtnGradient}
                          >
                            <Text style={[styles.tierBtnText, { color: '#fff' }]}>Subscribe</Text>
                            <ArrowRight size={14} color="#fff" />
                          </LinearGradient>
                        ) : (
                          <View style={styles.tierBtnGradient}>
                            <Text style={[styles.tierBtnText, { color: C.accentDark }]}>Subscribe</Text>
                            <ArrowRight size={14} color={C.accentDark} />
                          </View>
                        )}
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                ))}
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
              testID="restore-purchases"
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
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  content: {},
  eyebrow: {
    fontSize: 9,
    fontWeight: '500' as const,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '300' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  titleRule: {
    width: 44,
    height: 1.5,
    opacity: 0.55,
    marginBottom: 18,
  },
  mission: {
    fontSize: 17,
    fontStyle: 'italic' as const,
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
  tierCardTopLine: {
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
  tierEmojiText: {
    fontSize: 20,
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
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  tierBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  tierCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tierCheck: {
    fontSize: 13,
    fontStyle: 'italic' as const,
  },
  tierPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 46,
    fontWeight: '100' as const,
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  tierPeriod: {
    fontSize: 18,
    fontWeight: '300' as const,
  },
  tierDesc: {
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 18,
  },
  tierBtn: {
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
    fontWeight: '500' as const,
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
    fontStyle: 'italic' as const,
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
