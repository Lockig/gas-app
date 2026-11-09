"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "vi" | "en";

const dict = {
  vi: {
    appName: "Gas App",
    tabRecord: "Ghi xăng",
    tabAccount: "Cá nhân",
    tabStations: "Cây xăng",
    fillTankNotice: "Để tính mức tiêu thụ xăng chính xác nhất, vui lòng đổ đầy bình mỗi lần đổ.",
    addRecord: "Thêm lần đổ xăng",
    editRecord: "Sửa lần đổ xăng",
    save: "Lưu",
    saving: "Đang lưu…",
    cancel: "Huỷ",
    edit: "Sửa",
    delete: "Xoá",
    deleteTitle: "Xoá lần đổ xăng này?",
    deleteDesc: "Hành động này không thể hoàn tác.",
    date: "Ngày đổ",
    pickDate: "Chọn ngày",
    today: "Hôm nay",
    details: "Chi tiết",
    fuelType: "Loại xăng",
    pickFuelType: "Chọn loại xăng",
    pricePerLiter: "Giá xăng (đồng/lít)",
    amount: "Số tiền đã đổ (đồng)",
    odometer: "Số km trên đồng hồ (không bắt buộc)",
    odometerShort: "Km đồng hồ",
    priceLoading: "Đang lấy giá xăng…",
    priceFromApi: "Giá gần nhất từ {source}{updated} (chỉ mang tính tham khảo)",
    priceSelectFirst: "Chọn loại xăng để xem giá.",
    priceUpdated: ", cập nhật {date}",
    priceManual: "Giá nhập thủ công",
    priceNotConfigured: "Chưa cấu hình nguồn giá xăng. Vui lòng nhập giá thủ công.",
    priceNoData: "Không có giá xăng cho ngày này. Vui lòng nhập giá thủ công.",
    priceNetwork: "Không lấy được giá xăng (lỗi mạng hoặc nguồn dữ liệu). Vui lòng nhập giá thủ công.",
    preview: "Kết quả tính",
    liters: "Số lít",
    distance: "Quãng đường",
    litersPer100: "Lít/100 km",
    costPerKm: "Tiền/km",
    notEnoughData: "Chưa đủ dữ liệu",
    firstRecordHint: "Cần nhập số km ở lần này và lần đổ liền trước để tính lít/100 km và tiền/km.",
    history: "Lịch sử",
    tabHistory: "Lịch sử đổ xăng",
    tabCharts: "Biểu đồ",
    chartBarTitle: "Chi phí xăng theo tháng (biểu đồ cột)",
    chartLineTitle: "Chi phí xăng theo tháng (biểu đồ đường)",
    chartEmpty: "Chưa có dữ liệu để vẽ biểu đồ. Hãy thêm lần đổ xăng đầu tiên.",
    viewAs: "Hiển thị",
    viewTable: "Bảng",
    viewBar: "Biểu đồ cột",
    viewLine: "Biểu đồ đường",
    monthCol: "Tháng",
    fillCount: "Số lần đổ",
    filterMonth: "Lọc theo tháng",
    clearFilter: "Xoá bộ lọc",
    month: "Tháng",
    totalCost: "Tổng chi phí",
    totalLiters: "Tổng số lít",
    records: "{n} lần đổ",
    emptyTitle: "Chưa có lần đổ xăng nào",
    emptyDesc: "Bấm “Thêm lần đổ xăng” để ghi lần đầu tiên.",
    emptyFiltered: "Không có lần đổ xăng nào trong khoảng đã chọn.",
    loading: "Đang tải…",
    retry: "Thử lại",
    loadError: "Không tải được dữ liệu. Kiểm tra kết nối rồi thử lại.",
    saved: "Đã lưu",
    deleted: "Đã xoá",
    comingSoon: "Sắp ra mắt",
    comingSoonDesc: "Tính năng thông tin cá nhân sẽ có trong giai đoạn sau.",
    findNearby: "Tìm cây xăng gần tôi",
    searching: "Đang tìm…",
    manualPlace: "Hoặc nhập địa điểm",
    manualPlaceHolder: "VD: Quận 1, TP. Hồ Chí Minh",
    search: "Tìm",
    locationDenied: "Bạn đã từ chối quyền vị trí. Hãy nhập địa điểm thủ công bên dưới.",
    locationUnavailable: "Không lấy được vị trí hiện tại. Hãy nhập địa điểm thủ công bên dưới.",
    locationUnsupported: "Trình duyệt không hỗ trợ định vị. Hãy nhập địa điểm thủ công.",
    noStations: "Không tìm thấy cây xăng nào trong bán kính 5 km.",
    stationsError: "Không tìm được cây xăng (lỗi mạng hoặc dịch vụ). Vui lòng thử lại.",
    placeNotFound: "Không tìm thấy địa điểm này.",
    notConfigured: "Dịch vụ bản đồ chưa được cấu hình (thiếu API key).",
    mapUnavailable: "Không tải được bản đồ. Danh sách vẫn hiển thị bên dưới.",
    openNow: "Đang mở cửa",
    closedNow: "Đã đóng cửa",
    fuelTypes: "Nhiên liệu",
    nearbyList: "Cây xăng gần nhất",
    you: "Vị trí của bạn",
    openInMaps: "Chỉ đường",
    language: "Ngôn ngữ",
    errors: {
      invalid_date: "Ngày không hợp lệ.",
      future_date: "Không thể chọn ngày trong tương lai.",
      invalid_price: "Giá xăng phải là số lớn hơn 0.",
      invalid_amount: "Số tiền phải là số lớn hơn 0.",
      invalid_odometer: "Số km phải là số không âm.",
      odometer_not_greater: "Số km phải lớn hơn số km của lần đổ trước đó.",
      odometer_not_less: "Số km phải nhỏ hơn số km của lần đổ sau đó.",
      required_date: "Vui lòng chọn ngày.",
      db_error: "Lỗi cơ sở dữ liệu. Vui lòng thử lại.",
      generic: "Có lỗi xảy ra. Vui lòng thử lại.",
    } as Record<string, string>,
  },
  en: {
    appName: "Gas App",
    tabRecord: "Fuel log",
    tabAccount: "Account",
    tabStations: "Stations",
    fillTankNotice: "For the most accurate fuel calculation, please fill the tank completely every time.",
    addRecord: "Add fill-up",
    editRecord: "Edit fill-up",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    deleteTitle: "Delete this fill-up?",
    deleteDesc: "This action cannot be undone.",
    date: "Fill-up date",
    pickDate: "Pick a date",
    today: "Today",
    details: "Details",
    fuelType: "Fuel type",
    pickFuelType: "Select fuel type",
    pricePerLiter: "Fuel price (VND/liter)",
    amount: "Amount paid (VND)",
    odometer: "Odometer, km (optional)",
    odometerShort: "Odometer",
    priceLoading: "Fetching fuel price…",
    priceFromApi: "Latest price from {source}{updated} (for reference only)",
    priceSelectFirst: "Select a fuel type to see the price.",
    priceUpdated: ", updated {date}",
    priceManual: "Manually entered price",
    priceNotConfigured: "No fuel price source is configured. Please enter the price manually.",
    priceNoData: "No fuel price for this date. Please enter the price manually.",
    priceNetwork: "Could not fetch the fuel price (network or data source error). Please enter it manually.",
    preview: "Calculation",
    liters: "Liters",
    distance: "Distance",
    litersPer100: "L/100 km",
    costPerKm: "Cost/km",
    notEnoughData: "Not enough data",
    firstRecordHint: "Enter the odometer for this and the previous fill-up to calculate L/100 km and cost/km.",
    history: "History",
    tabHistory: "Fill-up history",
    tabCharts: "Charts",
    chartBarTitle: "Fuel spending by month (bar chart)",
    chartLineTitle: "Fuel spending by month (line chart)",
    chartEmpty: "No data to chart yet. Add your first fill-up.",
    viewAs: "View",
    viewTable: "Table",
    viewBar: "Bar chart",
    viewLine: "Line chart",
    monthCol: "Month",
    fillCount: "Fill-ups",
    filterMonth: "Filter by month",
    clearFilter: "Clear filter",
    month: "Month",
    totalCost: "Total cost",
    totalLiters: "Total liters",
    records: "{n} fill-ups",
    emptyTitle: "No fill-ups yet",
    emptyDesc: "Tap “Add fill-up” to log your first one.",
    emptyFiltered: "No fill-ups in the selected range.",
    loading: "Loading…",
    retry: "Retry",
    loadError: "Could not load data. Check your connection and try again.",
    saved: "Saved",
    deleted: "Deleted",
    comingSoon: "Coming soon",
    comingSoonDesc: "Account features will arrive in a later phase.",
    findNearby: "Find stations near me",
    searching: "Searching…",
    manualPlace: "Or enter a place",
    manualPlaceHolder: "e.g. District 1, Ho Chi Minh City",
    search: "Search",
    locationDenied: "Location permission was denied. Enter a place manually below.",
    locationUnavailable: "Could not get your current location. Enter a place manually below.",
    locationUnsupported: "Your browser does not support geolocation. Enter a place manually.",
    noStations: "No gas stations found within 5 km.",
    stationsError: "Could not find stations (network or service error). Please try again.",
    placeNotFound: "Place not found.",
    notConfigured: "Map service is not configured (missing API key).",
    mapUnavailable: "Could not load the map. The list is still shown below.",
    openNow: "Open now",
    closedNow: "Closed",
    fuelTypes: "Fuel",
    nearbyList: "Nearest stations",
    you: "Your location",
    openInMaps: "Directions",
    language: "Language",
    errors: {
      invalid_date: "Invalid date.",
      future_date: "You can't pick a future date.",
      invalid_price: "Price must be a number greater than 0.",
      invalid_amount: "Amount must be a number greater than 0.",
      invalid_odometer: "Odometer must be a non-negative number.",
      odometer_not_greater: "Odometer must be greater than the previous fill-up's.",
      odometer_not_less: "Odometer must be less than the next fill-up's.",
      required_date: "Please pick a date.",
      db_error: "Database error. Please try again.",
      generic: "Something went wrong. Please try again.",
    } as Record<string, string>,
  },
};

export type Dict = typeof dict.vi;
type StrKey = { [K in keyof Dict]: Dict[K] extends string ? K : never }[keyof Dict];

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StrKey, vars?: Record<string, string | number>) => string;
  err: (code: string | undefined) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "vi" || saved === "en") queueMicrotask(() => setLangState(saved));
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  }, []);

  const value = useMemo<Ctx>(() => {
    const d = dict[lang];
    return {
      lang,
      setLang,
      t: (key, vars) => {
        let s = d[key] as string;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
        return s;
      },
      err: (code) => (code && d.errors[code]) || d.errors.generic,
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function fmtMoney(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₫";
}

export function fmtNum(n: number, lang: Lang, digits = 2): string {
  return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: digits }).format(n);
}

export function fmtDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-GB", { dateStyle: "medium" }).format(new Date(y, m - 1, d));
}

export function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dateFromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
