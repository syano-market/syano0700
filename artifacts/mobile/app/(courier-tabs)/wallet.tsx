import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getBaseUrl } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useScreenLayout } from "@/hooks/useScreenLayout";
import { t } from "../../src/i18n";

interface WalletData {
  balance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  lifetimePaidOut: number;
}

interface PayoutRecord {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export default function CourierWalletScreen() {
  const colors = useColors();
  const { topPad, tabBarHeight } = useScreenLayout();
  const { token } = useAuth();
  const { formatPrice } = useSettings();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [wRes, pRes, tRes] = await Promise.all([
        fetch(`${getBaseUrl()}/api/courier/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getBaseUrl()}/api/courier/payouts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getBaseUrl()}/api/courier/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (wRes.ok) setWallet((await wRes.json()) as WalletData);
      if (pRes.ok) setPayouts((await pRes.json()) as PayoutRecord[]);
      if (tRes.ok) setTransactions((await tRes.json()) as Transaction[]);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const handleRequestPayout = () => {
    Alert.alert(
      t("courier.payout_confirm"),
      t("courier.payout_confirm_desc"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("courier.request_payout"),
          onPress: async () => {
            setRequesting(true);
            try {
              const res = await fetch(`${getBaseUrl()}/api/courier/payouts`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ amount: wallet?.balance ?? 0 }),
              });
              if (res.ok) {
                Alert.alert(t("courier.payout_success"));
                void load();
              } else {
                Alert.alert(t("courier.payout_error"));
              }
            } catch {
              Alert.alert(t("courier.payout_error"));
            } finally {
              setRequesting(false);
            }
          },
        },
      ],
    );
  };

  const statusColor = (s: string) =>
    s === "approved" || s === "paid" ? "#10B981"
    : s === "rejected" ? "#EF4444"
    : "#F59E0B";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Ionicons name="wallet-outline" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("courier.wallet")}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          {/* Balance card */}
          <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.balanceLabel}>{t("courier.wallet_balance")}</Text>
            <Text style={styles.balanceAmount}>{formatPrice(wallet?.balance ?? 0)}</Text>

            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceSubValue}>{formatPrice(wallet?.pendingBalance ?? 0)}</Text>
                <Text style={styles.balanceSubLabel}>{t("courier.pending_balance")}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceSubValue}>{formatPrice(wallet?.lifetimeEarnings ?? 0)}</Text>
                <Text style={styles.balanceSubLabel}>{t("courier.lifetime_earnings")}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceSubValue}>{formatPrice(wallet?.lifetimePaidOut ?? 0)}</Text>
                <Text style={styles.balanceSubLabel}>{t("courier.lifetime_payouts")}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.payoutBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
              onPress={handleRequestPayout}
              disabled={requesting || !wallet || wallet.balance <= 0}
            >
              {requesting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.payoutBtnText}>{t("courier.request_payout")}</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Payout history */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("courier.payout_history")}</Text>
          {payouts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("courier.no_payouts")}</Text>
            </View>
          ) : (
            <FlatList
              data={payouts}
              keyExtractor={(p) => String(p.id)}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16, marginBottom: 8 }}
              renderItem={({ item }) => (
                <View style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.txTop}>
                    <Text style={[styles.txAmount, { color: colors.foreground }]}>{formatPrice(item.amount)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + "22" }]}>
                      <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                        {t(`courier.status_${item.status}` as Parameters<typeof t>[0]) || item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            />
          )}

          {/* Transaction history */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("courier.transaction_history")}</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("courier.no_transactions")}</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(tx) => String(tx.id)}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <View style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.txTop}>
                    <Text style={[styles.txDesc, { color: colors.foreground }]}>
                      {item.description ?? t(`courier.tx_type_${item.type}` as Parameters<typeof t>[0])}
                    </Text>
                    <Text style={[styles.txAmount, { color: item.amount >= 0 ? "#10B981" : "#EF4444" }]}>
                      {item.amount >= 0 ? "+" : ""}{formatPrice(item.amount)}
                    </Text>
                  </View>
                  <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  balanceCard: { margin: 16, borderRadius: 20, padding: 24, gap: 4 },
  balanceLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  balanceAmount: { fontSize: 40, fontWeight: "800", color: "#fff", marginBottom: 16 },
  balanceRow: { flexDirection: "row", marginBottom: 20 },
  balanceItem: { flex: 1, alignItems: "center", gap: 2 },
  balanceDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)", marginVertical: 4 },
  balanceSubValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
  balanceSubLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  payoutBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  payoutBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginHorizontal: 16, marginBottom: 10, marginTop: 8 },
  emptyWrap: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 16 },
  emptyText: { fontSize: 14 },
  txCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  txTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  txDesc: { fontSize: 14, fontWeight: "500", flex: 1, marginEnd: 8 },
  txAmount: { fontSize: 15, fontWeight: "700" },
  txDate: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: "600" },
});
