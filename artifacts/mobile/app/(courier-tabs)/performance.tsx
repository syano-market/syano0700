import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getBaseUrl } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useScreenLayout } from "@/hooks/useScreenLayout";
import { t } from "../../src/i18n";

interface PerformanceSummary {
  completedDeliveries: number;
  failedDeliveries: number;
  totalAssigned: number;
  successRate: number;
  avgDeliveryTimeMinutes: number | null;
  rating: number | null;
  acceptanceRate: number | null;
}

interface RatingRecord {
  id: number;
  missionId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

function StatCard({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function CourierPerformanceScreen() {
  const colors = useColors();
  const { topPad, tabBarHeight } = useScreenLayout();
  const { token } = useAuth();
  const [perf, setPerf] = useState<PerformanceSummary | null>(null);
  const [ratings, setRatings] = useState<RatingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [perfRes, ratRes] = await Promise.all([
        fetch(`${getBaseUrl()}/api/couriers/performance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getBaseUrl()}/api/couriers/ratings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (perfRes.ok) setPerf((await perfRes.json()) as PerformanceSummary);
      if (ratRes.ok) setRatings((await ratRes.json()) as RatingRecord[]);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const successRate = perf
    ? perf.successRate != null
      ? `${perf.successRate.toFixed(0)}%`
      : perf.totalAssigned > 0
        ? `${((perf.completedDeliveries / perf.totalAssigned) * 100).toFixed(0)}%`
        : "—"
    : "—";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Ionicons name="bar-chart-outline" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("courier.performance")}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          <View style={styles.statsGrid}>
            <StatCard
              label={t("courier.success_rate")}
              value={successRate}
              icon="checkmark-circle-outline"
              colors={colors}
            />
            <StatCard
              label={t("courier.completed_missions")}
              value={String(perf?.completedDeliveries ?? 0)}
              icon="bicycle-outline"
              colors={colors}
            />
            <StatCard
              label={t("courier.avg_rating")}
              value={perf?.rating != null ? perf.rating.toFixed(1) : "—"}
              icon="star-outline"
              colors={colors}
            />
            <StatCard
              label={t("courier.avg_delivery_time")}
              value={perf?.avgDeliveryTimeMinutes != null ? `${perf.avgDeliveryTimeMinutes} ${t("courier.minutes")}` : "—"}
              icon="time-outline"
              colors={colors}
            />
            <StatCard
              label={t("courier.acceptance_rate")}
              value={perf?.acceptanceRate != null ? `${perf.acceptanceRate.toFixed(0)}%` : "—"}
              icon="thumbs-up-outline"
              colors={colors}
            />
            <StatCard
              label={t("courier.total_failed")}
              value={String(perf?.failedDeliveries ?? 0)}
              icon="close-circle-outline"
              colors={colors}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("courier.recent_ratings")}</Text>
          {ratings.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="star-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("courier.no_ratings")}</Text>
            </View>
          ) : (
            <FlatList
              data={ratings}
              keyExtractor={(r) => String(r.id)}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.ratingTop}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= item.rating ? "star" : "star-outline"}
                          size={16}
                          color={s <= item.rating ? "#F59E0B" : colors.mutedForeground}
                        />
                      ))}
                    </View>
                    <Text style={[styles.ratingDate, { color: colors.mutedForeground }]}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {item.comment ? (
                    <Text style={[styles.ratingComment, { color: colors.foreground }]}>{item.comment}</Text>
                  ) : null}
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
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginBottom: 24 },
  statCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 6, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 12, textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginHorizontal: 16, marginBottom: 10 },
  emptyWrap: { alignItems: "center", gap: 12, padding: 32 },
  emptyText: { fontSize: 14 },
  ratingCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  ratingTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  starsRow: { flexDirection: "row", gap: 2 },
  ratingDate: { fontSize: 12 },
  ratingComment: { fontSize: 13 },
});
