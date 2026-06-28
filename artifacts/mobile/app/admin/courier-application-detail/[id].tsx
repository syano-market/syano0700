import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
import { t } from "../../../src/i18n";

interface CourierDetail {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userCreatedAt: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  active: boolean;
  phone: string;
  vehicleType: string;
  district: string | null;
  rating: number | null;
  completedDeliveries: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "#F59E0B",
  approved:  "#10B981",
  rejected:  "#EF4444",
  suspended: "#F97316",
};

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value != null ? String(value) : t("admin.no_data")}</Text>
    </View>
  );
}

export default function AdminCourierApplicationDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const colors = useColors();
  const { topPad } = useScreenLayout();
  const { token } = useAuth();

  const [courier, setCourier] = useState<CourierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/couriers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCourier((await res.json()) as CourierDetail);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [id, token]);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (status: string) => {
    setActing(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/couriers/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const successKey = status === "approved" ? "admin.application_approved" : "admin.application_rejected";
        Alert.alert(t(successKey as Parameters<typeof t>[0]));
        await load();
      } else {
        Alert.alert(t("admin.action_error"));
      }
    } catch {
      Alert.alert(t("admin.action_error"));
    } finally {
      setActing(false);
    }
  };

  const confirmAction = (status: string, labelKey: string) => {
    const descKey = status === "approved" ? "admin.confirm_approve" : "admin.confirm_reject";
    Alert.alert(
      t(labelKey as Parameters<typeof t>[0]),
      t(descKey as Parameters<typeof t>[0]),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t(labelKey as Parameters<typeof t>[0]),
          style: status === "rejected" || status === "suspended" ? "destructive" : "default",
          onPress: () => void updateStatus(status),
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={16}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("admin.application_detail")}</Text>
        </View>
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      </View>
    );
  }

  if (!courier) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={16}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("admin.application_detail")}</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("admin.no_data")}</Text>
        </View>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[courier.status] ?? colors.mutedForeground;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={16}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("admin.application_detail")}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "22", borderColor: statusColor + "44" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{courier.status}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      >
        {/* Avatar / name block */}
        <View style={[styles.profileBlock, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="person-circle-outline" size={56} color={colors.primary} />
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{courier.userName}</Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]}>{courier.userEmail}</Text>
        </View>

        {/* Info section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("admin.contact_info")}</Text>
          <InfoRow label={t("admin.applicant")} value={courier.userName} />
          <InfoRow label={t("admin.contact_info")} value={courier.phone} />
          <InfoRow label={t("admin.vehicle")} value={courier.vehicleType} />
          <InfoRow label={t("admin.district")} value={courier.district} />
          <InfoRow label={t("admin.rating")} value={courier.rating != null ? courier.rating.toFixed(1) : null} />
          <InfoRow label={t("admin.completed")} value={courier.completedDeliveries} />
          <InfoRow label={t("admin.notes")} value={courier.notes} />
          <InfoRow label={t("admin.applied")} value={new Date(courier.createdAt).toLocaleDateString()} />
          <InfoRow label={t("admin.updated")} value={new Date(courier.updatedAt).toLocaleDateString()} />
        </View>

        {/* Actions */}
        <View style={styles.actionsBlock}>
          {courier.status === "pending" && (
            <>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: "#10B981", opacity: acting ? 0.6 : 1 }]}
                onPress={() => confirmAction("approved", "admin.approve_application")}
                disabled={acting}
              >
                {acting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.actionBtnText}>{t("admin.approve_application")}</Text>
                }
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: "#EF4444", opacity: acting ? 0.6 : 1 }]}
                onPress={() => confirmAction("rejected", "admin.reject_application")}
                disabled={acting}
              >
                {acting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.actionBtnText}>{t("admin.reject_application")}</Text>
                }
              </Pressable>
            </>
          )}
          {courier.status === "approved" && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: "#F97316", opacity: acting ? 0.6 : 1 }]}
              onPress={() => confirmAction("suspended", "admin_dash.suspend")}
              disabled={acting}
            >
              {acting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.actionBtnText}>{t("admin_dash.suspend")}</Text>
              }
            </Pressable>
          )}
          {(courier.status === "rejected" || courier.status === "suspended") && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: "#10B981", opacity: acting ? 0.6 : 1 }]}
              onPress={() => confirmAction("approved", "admin.approve_application")}
              disabled={acting}
            >
              {acting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.actionBtnText}>{t("admin.approve_application")}</Text>
              }
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
  profileBlock: { alignItems: "center", padding: 24, gap: 4, borderBottomWidth: 1 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  name: { fontSize: 18, fontWeight: "800" },
  email: { fontSize: 13 },
  section: { margin: 16, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  sectionTitle: { fontSize: 14, fontWeight: "700", padding: 14, paddingBottom: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  infoLabel: { fontSize: 13, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },
  actionsBlock: { marginHorizontal: 16, gap: 10 },
  actionBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
