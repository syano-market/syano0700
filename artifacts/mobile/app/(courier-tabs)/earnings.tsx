import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  pendingPayout: number;
  completedDeliveries: number;
}

interface EarningRecord {
  id: number;
  orderId: number;
  yourCut: number;
  status: string;
  completedAt: string | null;
  createdAt: string;
}

type Period = "today" | "thisWeek" | "thisMonth" | "allTime";

const PERIODS: { key: Period; labelKey: string }[] = [
  { key: "today",      labelKey: "courier.period_today" },
  { key: "thisWeek",   labelKey: "courier.period_this_week" },
  { key: "thisMonth",  labelKey: "courier.period_this_month" },
  { key: "allTime",    labelKey: "courier.period_all_time" },
];

export default function CourierEarningsScreen() {
  const colors = useColors();
  const { topPad, tabBarHeight } = useScreenLayout();
  const { token } = useAuth();
  const { formatPrice } = useSettings();
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [sumRes, histRes] = await Promise.all([
        fetch(`${getBaseUrl()}/api/couriers/earnings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getBaseUrl()}/api/couriers/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (sumRes.ok) setSummary((await sumRes.json()) as EarningsSummary);
      if (histRes.ok) setRecords((await histRes.json()) as EarningRecord[]);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const periodValue = summary
    ? period === "today" ? summary.today
    : period === "thisWeek" ? summary.thisWeek
    : period === "thisMonth" ? summary.thisMonth
    : summary.allTime
    : 0;

  const filteredRecords = records.filter((r) => r.status === "delivered");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Ionicons name="cash-outline" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("courier.earnings_title")}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          {/* Period Selector */}
          <View style={[styles.periodRow, { borderBottomColor: colors.border }]}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodBtn, period === p.key && { backgroundColor: colors.primary + "22", borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setPeriod(p.key)}
              >
                <Text style={[styles.periodLabel, { color: period === p.key ? colors.primary : colors.mutedForeground }]}>
                  {t(p.labelKey as Parameters<typeof t>[0])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Big earnings number */}
          <View style={[styles.earningsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.earningsLabel, { color: colors.mutedForeground }]}>{t("courier.total_earnings")}</Text>
            <Text style={[styles.earningsAmount, { color: colors.primary }]}>{formatPrice(periodValue)}</Text>
            {summary && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{summary.completedDeliveries}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t("courier.deliveries")}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{formatPrice(summary.pendingPayout)}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t("courier.pending_payout")}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {summary.completedDeliveries > 0 ? formatPrice(summary.allTime / summary.completedDeliveries) : "—"}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t("courier.per_mission")}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Recent deliveries */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("courier_dash.history")}</Text>
          {filteredRecords.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="cash-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("courier_dash.no_history")}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecords}
              keyExtractor={(r) => String(r.id)}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <View style={[styles.recordCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.recordRef, { color: colors.foreground }]}>
                    {t("courier_dash.order_ref", { id: String(item.orderId) })}
                  </Text>
                  <View style={styles.recordBottom}>
                    <Text style={[styles.recordDate, { color: colors.mutedForeground }]}>
                      {new Date(item.completedAt ?? item.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.recordAmount, { color: colors.primary }]}>{formatPrice(item.yourCut)}</Text>
                  </View>
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
  periodRow: { flexDirection: "row", borderBottomWidth: 1 },
  periodBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  periodLabel: { fontSize: 12, fontWeight: "600" },
  earningsCard: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 20, gap: 8 },
  earningsLabel: { fontSize: 13 },
  earningsAmount: { fontSize: 36, fontWeight: "800" },
  statsRow: { flexDirection: "row", marginTop: 8 },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginHorizontal: 16, marginBottom: 10, marginTop: 4 },
  emptyWrap: { alignItems: "center", gap: 12, padding: 32 },
  emptyText: { fontSize: 14 },
  recordCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  recordRef: { fontSize: 14, fontWeight: "600" },
  recordBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recordDate: { fontSize: 12 },
  recordAmount: { fontSize: 15, fontWeight: "700" },
});
