import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useListProducts,
  useUpdateStock,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useScreenLayout } from "@/hooks/useScreenLayout";
import { t } from "../../src/i18n";

interface Product {
  id: number;
  name: string;
  stock: number | null;
  price: number;
  discountPercent: number | null;
}

export default function SellerInventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { topPad } = useScreenLayout();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stockEdits, setStockEdits] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const { data: products = [], isLoading } = useListProducts(
    { sellerId: user?.id },
    { query: { queryKey: getListProductsQueryKey({ sellerId: user?.id }), enabled: !!user?.id } },
  );

  const updateStock = useUpdateStock({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setSavingId(null);
      },
      onError: () => {
        setSavingId(null);
      },
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return products as Product[];
    const q = search.toLowerCase();
    return (products as Product[]).filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const handleSave = (id: number) => {
    const valStr = stockEdits[id];
    if (valStr === undefined) return;
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;
    setSavingId(id);
    updateStock.mutate({ id, data: { stock: val } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={16}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Ionicons name="layers-outline" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("seller.inventory")}</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder={`${t("admin_dash.search")}`}
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="layers-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("seller.no_products_inventory")}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => {
            const stock = stockEdits[item.id] !== undefined ? stockEdits[item.id] : String(item.stock ?? 0);
            const isSaving = savingId === item.id;
            const stockNum = item.stock ?? 0;
            const isLow = stockNum > 0 && stockNum <= 5;
            const isOut = stockNum === 0;

            return (
              <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: isOut ? "#EF4444" : isLow ? "#F59E0B" : colors.border }]}>
                <View style={styles.productTop}>
                  <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                  {isOut
                    ? <View style={[styles.badge, { backgroundColor: "#EF444422" }]}><Text style={[styles.badgeText, { color: "#EF4444" }]}>{t("seller.out_of_stock")}</Text></View>
                    : isLow
                    ? <View style={[styles.badge, { backgroundColor: "#F59E0B22" }]}><Text style={[styles.badgeText, { color: "#F59E0B" }]}>{t("seller.low_stock_warning")}</Text></View>
                    : <View style={[styles.badge, { backgroundColor: "#10B98122" }]}><Text style={[styles.badgeText, { color: "#10B981" }]}>{t("seller.items_in_stock", { count: stockNum })}</Text></View>
                  }
                </View>

                <Text style={[styles.productPrice, { color: colors.mutedForeground }]}>
                  ${(item.price / 100).toFixed(2)}
                  {item.discountPercent ? ` · ${item.discountPercent}% off` : ""}
                </Text>

                <View style={styles.stockRow}>
                  <Text style={[styles.stockLabel, { color: colors.mutedForeground }]}>{t("seller.stock_level")}</Text>
                  <View style={styles.stockEdit}>
                    <TouchableOpacity
                      style={[styles.stockBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                      onPress={() => {
                        const cur = parseInt(stock, 10) || 0;
                        setStockEdits({ ...stockEdits, [item.id]: String(Math.max(0, cur - 1)) });
                      }}
                    >
                      <Ionicons name="remove" size={18} color={colors.foreground} />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.stockInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={stock}
                      onChangeText={(v) => setStockEdits({ ...stockEdits, [item.id]: v.replace(/[^0-9]/g, "") })}
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      style={[styles.stockBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                      onPress={() => {
                        const cur = parseInt(stock, 10) || 0;
                        setStockEdits({ ...stockEdits, [item.id]: String(cur + 1) });
                      }}
                    >
                      <Ionicons name="add" size={18} color={colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.6 : 1 }]}
                      onPress={() => handleSave(item.id)}
                      disabled={isSaving || stockEdits[item.id] === undefined}
                    >
                      {isSaving
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.saveBtnText}>{t("seller_dash.save")}</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { marginEnd: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, fontSize: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyText: { fontSize: 15, textAlign: "center" },
  productCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 8 },
  productTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  productName: { fontSize: 15, fontWeight: "700", flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  productPrice: { fontSize: 13 },
  stockRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  stockLabel: { fontSize: 13 },
  stockEdit: { flexDirection: "row", alignItems: "center", gap: 6 },
  stockBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stockInput: { width: 52, height: 36, borderRadius: 8, borderWidth: 1, textAlign: "center", fontSize: 15, fontWeight: "600" },
  saveBtn: { paddingHorizontal: 14, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", minWidth: 56 },
  saveBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
