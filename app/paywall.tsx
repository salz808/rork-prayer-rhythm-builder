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
import { X, Heart, Globe, RefreshCw, Check, Sparkles, ArrowRight, Cross } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';

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

interface PackageInfo {
  pkg: PurchasesPackage;
  title: string;
  price: string;
  description: string;
  impact: string;
  icon: typeof Heart;
  highlight: boolean;
}

const Purchases = getPurchases();

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
        console.log('[Paywall] RevenueCat not available on this platform');
        return null;
      }
      console.log('[Paywall] Fetching offerings...');
      const offerings = await Purchases.getOfferings();
      console.log('[Paywall] Current offering:', offerings.current?.identifier);
      return offerings.current ?? null;
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      if (!Purchases) throw new Error('Purchases not available');
      console.log('[Paywall] Purchasing package:', pkg.identifier);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Thank you! 🙏',
        "Your support means everything. This is more than a transaction. It's partnership.",
        [{ text: 'Continue', onPress: () => router.back() }]
      );
    },
    onError: (error: unknown) => {
      const err = error as { userCancelled?: boolean; message?: string };
      if (!err.userCancelled) {
        console.log('[Paywall] Purchase error:', err.message);
        Alert.alert('Something went wrong', 'Please try again or restore your purchases.');
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!Purchases) throw new Error('Purchases not available');
      console.log('[Paywall] Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
      if (hasActive) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Restored!', 'Your support has been restored. Thank you.', [
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

  const buildPackageInfo = (pkgs: PurchasesPackage[]): PackageInfo[] => {
    return pkgs.map((pkg) => {
      const price = pkg.product.priceString;
      const id = pkg.product.identifier;
      const isMissions = id.includes('missions');
      return {
        pkg,
        title: isMissions ? 'Share the Gospel' : 'Support Development',
        price,
        description: isMissions
          ? '$9.99/mo. 100% goes toward missions around the world to share the Gospel of Jesus Christ.'
          : '$0.99/mo. Help us keep building and improving this app for everyone.',
        impact: isMissions
          ? 'Fund global missions'
          : 'Keep the app free for all',
        icon: isMissions ? Globe : Heart,
        highlight: isMissions,
      };
    });
  };

  const packages = offeringsQuery.data?.availablePackages ?? [];
  const packageInfos = buildPackageInfo(packages);

  return (
    <LinearGradient
      colors={[C.gradientStart, C.gradientMid, C.gradientEnd]}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: C.overlayLight }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            <View style={styles.iconOuter}>
              <View style={[styles.iconGlow, { backgroundColor: C.accentBg }]} />
              <View style={[styles.iconGlowInner, { backgroundColor: C.accentBg }]} />
              <View style={[styles.iconWrap, { backgroundColor: C.accentBg, borderColor: C.accentLight, borderWidth: 1.5 }]}>
                <Sparkles size={28} color={C.accentDark} />
              </View>
            </View>

            <Text style={[styles.title, { color: C.text }]}>Support This Cause</Text>
            <View style={styles.subtitleDecorator}>
              <View style={[styles.subtitleDecorLine, { backgroundColor: C.accentLight }]} />
              <Cross size={10} color={C.accentDark} style={{ opacity: 0.3 }} />
              <View style={[styles.subtitleDecorLine, { backgroundColor: C.accentLight }]} />
            </View>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              This app is free and always will be. Your support keeps it alive and helps share the Gospel of Jesus Christ with the world.
            </Text>

            <View style={[styles.divider, { backgroundColor: C.border }]} />

            {offeringsQuery.isLoading ? (
              <ActivityIndicator color={C.accent} style={{ marginVertical: 40 }} />
            ) : offeringsQuery.isError ? (
              <View style={[styles.errorBox, { backgroundColor: C.roseBg }]}>
                <Text style={[styles.errorText, { color: C.rose }]}>
                  Couldn{"'"}t load options. Please check your connection.
                </Text>
              </View>
            ) : (
              <View style={styles.cards}>
                {packageInfos.map((info) => {
                  const Icon = info.icon;
                  const isPurchasing = purchaseMutation.isPending &&
                    purchaseMutation.variables?.identifier === info.pkg.identifier;

                  return (
                    <TouchableOpacity
                      key={info.pkg.identifier}
                      style={[
                        styles.card,
                        {
                          backgroundColor: info.highlight ? C.accentBg : C.surface,
                          borderColor: info.highlight ? C.accentDark : C.border,
                          borderWidth: info.highlight ? 1.5 : 1,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        purchaseMutation.mutate(info.pkg);
                      }}
                      activeOpacity={0.82}
                      disabled={purchaseMutation.isPending || restoreMutation.isPending}
                      testID={`purchase-${info.pkg.identifier}`}
                    >
                      <View style={styles.cardTop}>
                        <View style={[
                          styles.cardIcon,
                          { backgroundColor: info.highlight ? C.accentLight : C.accentBg }
                        ]}>
                          <Icon size={20} color={info.highlight ? C.white : C.accentDark} />
                        </View>
                        <View style={styles.cardTitleGroup}>
                          <View style={styles.titleRow}>
                            <Text style={[styles.cardTitle, { color: C.text }]}>{info.title}</Text>
                            {info.highlight && (
                              <View style={[styles.badge, { backgroundColor: C.accentDark }]}>
                                <Text style={styles.badgeText}>MISSIONS</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.impactRow}>
                            <Check size={11} color={C.sage} strokeWidth={2.5} />
                            <Text style={[styles.cardImpact, { color: C.sageDark }]}>{info.impact}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: info.highlight ? C.accentDark : C.text }]}>
                          {info.price}
                        </Text>
                        <Text style={[styles.priceFreq, { color: C.textMuted }]}>/mo</Text>
                      </View>

                      <Text style={[styles.cardDesc, { color: C.textSecondary }]}>{info.description}</Text>

                      <View style={[
                        styles.cardButton,
                        { backgroundColor: info.highlight ? C.accentDark : C.accentBg }
                      ]}>
                        {isPurchasing ? (
                          <ActivityIndicator color={info.highlight ? C.white : C.accentDark} size="small" />
                        ) : (
                          <View style={styles.cardButtonInner}>
                            <Text style={[
                              styles.cardButtonText,
                              { color: info.highlight ? C.white : C.accentDark }
                            ]}>
                              Subscribe
                            </Text>
                            <ArrowRight size={14} color={info.highlight ? C.white : C.accentDark} />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={[styles.noteBox, { backgroundColor: C.sageBg, borderColor: C.sageLight }]}>
              <Text style={[styles.noteText, { color: C.sageDark }]}>
                No investors. No ads. Every dollar goes directly to app development or global missions. Just people who pray, supporting people who pray.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                  <Text style={[styles.restoreText, { color: C.textMuted }]}>Restore purchases</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.legal, { color: C.textMuted }]}>
              Subscriptions renew monthly. Cancel anytime in your device settings.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute' as const,
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
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
  },
  iconOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  iconGlow: {
    position: 'absolute' as const,
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.4,
  },
  iconGlowInner: {
    position: 'absolute' as const,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.6,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleDecorator: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  subtitleDecorLine: {
    width: 28,
    height: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -1,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 24,
  },
  cards: {
    width: '100%',
    gap: 14,
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    padding: 22,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleGroup: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  impactRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
  },
  cardImpact: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 6,
  },
  price: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  priceFreq: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: -2,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonInner: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
  },
  cardButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  noteBox: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 23,
    textAlign: 'center',
    fontStyle: 'italic' as const,
    letterSpacing: 0.15,
  },
  restoreBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    marginBottom: 12,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  legal: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 16,
  },
  errorBox: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginVertical: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
