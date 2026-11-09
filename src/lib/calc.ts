export type RecordBase = {
  id: number;
  date: string;
  fuelType: string | null;
  pricePerLiter: number;
  priceSource: string;
  amount: number;
  liters: number;
  /** Số km trên đồng hồ; null nếu người dùng không nhập */
  odometer: number | null;
};

export type RecordView = RecordBase & {
  /** Quãng đường so với lần đổ liền trước; null nếu thiếu km hoặc chưa có lần trước */
  distance: number | null;
  litersPer100km: number | null;
  costPerKm: number | null;
};

export function computeLiters(amount: number, price: number): number {
  return amount / price;
}

export function computeMetrics(liters: number, amount: number, distance: number | null) {
  if (distance === null || distance <= 0) {
    return { litersPer100km: null, costPerKm: null };
  }
  return {
    litersPer100km: (liters / distance) * 100,
    costPerKm: amount / distance,
  };
}

/** Thứ tự thời gian: theo ngày rồi theo id. */
export function chronological<T extends { date: string; id: number }>(records: T[]): T[] {
  return [...records].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

/**
 * Quãng đường chỉ tính khi cả lần đổ này và lần đổ liền trước đều có km
 * (nếu bỏ qua một lần ở giữa thì số lít sẽ không tương ứng với quãng đường).
 */
export function withMetrics(records: RecordBase[]): RecordView[] {
  const asc = chronological(records);
  return asc
    .map((r, i) => {
      const prev = i > 0 ? asc[i - 1] : null;
      const distance =
        prev && prev.odometer !== null && r.odometer !== null ? r.odometer - prev.odometer : null;
      return { ...r, distance, ...computeMetrics(r.liters, r.amount, distance) };
    })
    .reverse();
}

/**
 * Kiểm tra km hợp lệ so với các record khác có km (theo thứ tự ngày):
 * phải lớn hơn km của lần đổ trước đó và nhỏ hơn km của lần đổ sau đó.
 */
export function validateOdometer(
  others: Pick<RecordBase, "date" | "odometer">[],
  date: string,
  odometer: number,
): "odometer_not_greater" | "odometer_not_less" | null {
  const withOdo = others.filter((o): o is { date: string; odometer: number } => o.odometer !== null);
  const before = withOdo.filter((o) => o.date <= date);
  const after = withOdo.filter((o) => o.date > date);
  if (before.length && odometer <= Math.max(...before.map((o) => o.odometer))) {
    return "odometer_not_greater";
  }
  if (after.length && odometer >= Math.min(...after.map((o) => o.odometer))) {
    return "odometer_not_less";
  }
  return null;
}
