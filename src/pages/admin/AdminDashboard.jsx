import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [topCourses, setTopCourses] = useState([]);
  const [coursePurchaseCount, setCoursePurchaseCount] = useState([]);
  const [salesRows, setSalesRows] = useState([]);
  const [salesSummary, setSalesSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    uniqueBuyers: 0,
    avgOrderValue: 0,
  });
  const [salesPeriod, setSalesPeriod] = useState("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);

  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrderOverview();
    fetchRankingData();
    fetchSalesReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApiError = (err) => {
    console.error(err);
    if ([401, 403].includes(err?.response?.status)) {
      alert("Session หมดอายุ หรือไม่มีสิทธิ์เข้าถึง");
      navigate("/admin/login");
      return;
    }
    alert("โหลดข้อมูลรายงานไม่สำเร็จ");
  };

  const fetchOrderOverview = async () => {
    try {
      setLoading(true);
      const [ordersRes, membersRes] = await Promise.all([
        axios.get("http://localhost:5000/api/orders/admin/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/admin/members", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setMemberCount(
        Array.isArray(membersRes.data) ? membersRes.data.length : 0,
      );
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankingData = async () => {
    try {
      setRankingLoading(true);
      const [topCoursesRes, purchaseRes] = await Promise.all([
        axios.get("http://localhost:5000/api/orders/admin/top-courses", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(
          "http://localhost:5000/api/orders/admin/course-purchase-count",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ]);

      setTopCourses(
        Array.isArray(topCoursesRes.data) ? topCoursesRes.data : [],
      );
      setCoursePurchaseCount(
        Array.isArray(purchaseRes.data) ? purchaseRes.data : [],
      );
    } catch (err) {
      handleApiError(err);
    } finally {
      setRankingLoading(false);
    }
  };

  const fetchSalesReportData = async (overrideFilters = {}) => {
    const resolvedStartDate =
      overrideFilters.startDate !== undefined
        ? overrideFilters.startDate
        : startDate;
    const resolvedEndDate =
      overrideFilters.endDate !== undefined ? overrideFilters.endDate : endDate;
    const resolvedPeriod =
      overrideFilters.period !== undefined
        ? overrideFilters.period
        : salesPeriod;

    const params = { period: resolvedPeriod };
    if (resolvedStartDate) params.startDate = resolvedStartDate;
    if (resolvedEndDate) params.endDate = resolvedEndDate;

    try {
      setSalesLoading(true);
      const salesRes = await axios.get(
        "http://localhost:5000/api/orders/admin/sales-reports",
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        },
      );

      setSalesRows(
        Array.isArray(salesRes.data?.rows) ? salesRes.data.rows : [],
      );
      setSalesSummary({
        totalRevenue: salesRes.data?.summary?.totalRevenue || 0,
        totalOrders: salesRes.data?.summary?.totalOrders || 0,
        uniqueBuyers: salesRes.data?.summary?.uniqueBuyers || 0,
        avgOrderValue: salesRes.data?.summary?.avgOrderValue || 0,
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      setSalesLoading(false);
    }
  };

  // KPI
  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.paymentStatus === "paid")
        .reduce((s, o) => s + (o.totalPrice || 0), 0),
    [orders],
  );
  const countPaid = useMemo(
    () => orders.filter((o) => o.paymentStatus === "paid").length,
    [orders],
  );
  const countPending = useMemo(
    () => orders.filter((o) => o.paymentStatus === "pending").length,
    [orders],
  );
  const countCancelled = useMemo(
    () => orders.filter((o) => o.paymentStatus === "failed").length,
    [orders],
  );
  const periodLabel = useMemo(() => {
    if (salesPeriod === "monthly") return "รายเดือน";
    if (salesPeriod === "yearly") return "รายปี";
    return "รายวัน";
  }, [salesPeriod]);

  const handleApplyFilter = async (e) => {
    e.preventDefault();
    await fetchSalesReportData();
  };

  const handleClearFilter = async () => {
    setStartDate("");
    setEndDate("");
    await fetchSalesReportData({ startDate: "", endDate: "" });
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* ================= KPIs ================= */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">สมาชิกทั้งหมด</p>
          <p className="mt-1 text-2xl font-semibold text-indigo-600">
            {loading ? "-" : memberCount.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-400">ผู้ใช้งานที่สมัครในระบบ</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">คำสั่งซื้อทั้งหมด</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {loading ? "-" : orders.length.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-400">รวมทุกสถานะ</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">ชำระแล้ว</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {loading ? "-" : countPaid.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-400">สถานะ paid</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">รอดำเนินการ</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">
            {loading ? "-" : countPending.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-400">สถานะ pending</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">จำนวนการยกเลิก</p>
          <p className="mt-1 text-2xl font-semibold text-rose-600">
            {loading ? "-" : countCancelled.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-400">สถานะ failed</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">รายได้รวม (ชำระแล้ว)</p>
          <p className="mt-1 text-2xl font-semibold">
            {loading ? "-" : `${revenue.toLocaleString()} ฿`}
          </p>
          <p className="mt-1 text-xs text-gray-400">รวมจากออเดอร์ที่ชำระแล้ว</p>
        </div>
      </section>

      {/* ================= Report Filters ================= */}
      <section className="mt-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-3 text-sm font-medium text-gray-600">
            ตัวกรองรายงาน
          </h3>

          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                รูปแบบรายงาน
              </label>
              <select
                value={salesPeriod}
                onChange={(e) => setSalesPeriod(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="daily">รายวัน</option>
                <option value="monthly">รายเดือน</option>
                <option value="yearly">รายปี</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                ใช้ตัวกรอง
              </button>
              <button
                type="button"
                onClick={handleClearFilter}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                ล้าง
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ================= Sales Report ================= */}
      <section className="mt-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-3 text-sm font-medium text-gray-600">
            รายงานยอดขายคอร์สเรียนแบบ{periodLabel}
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
              <p className="text-xs text-gray-500">ยอดขายรวม</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {(salesSummary.totalRevenue || 0).toLocaleString()} ฿
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
              <p className="text-xs text-gray-500">ออเดอร์ชำระแล้ว</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {(salesSummary.totalOrders || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
              <p className="text-xs text-gray-500">จำนวนผู้ซื้อ</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {(salesSummary.uniqueBuyers || 0).toLocaleString()} คน
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
              <p className="text-xs text-gray-500">มูลค่าเฉลี่ยต่อออเดอร์</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {(salesSummary.avgOrderValue || 0).toLocaleString()} ฿
              </p>
            </div>
          </div>

          <div className="mt-4 h-80">
            {salesLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                กำลังโหลดกราฟยอดขาย...
              </div>
            ) : salesRows.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                ยังไม่มีข้อมูลยอดขายในช่วงเวลานี้
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis
                    tickFormatter={(v) => Number(v || 0).toLocaleString()}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "totalRevenue") {
                        return [
                          `${Number(value || 0).toLocaleString()} ฿`,
                          "ยอดขาย",
                        ];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "totalRevenue" ? "ยอดขาย (บาท)" : value
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {!salesLoading && salesRows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-2 py-2 font-medium">ช่วงเวลา</th>
                    <th className="px-2 py-2 font-medium">ออเดอร์ชำระแล้ว</th>
                    <th className="px-2 py-2 font-medium">ผู้ซื้อ</th>
                    <th className="px-2 py-2 font-medium">ยอดขาย</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRows.map((row) => (
                    <tr key={row.label} className="border-b border-gray-50">
                      <td className="px-2 py-2 text-gray-800">{row.label}</td>
                      <td className="px-2 py-2 text-gray-700">
                        {(row.totalOrders || 0).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-gray-700">
                        {(row.uniqueBuyers || 0).toLocaleString()} คน
                      </td>
                      <td className="px-2 py-2 font-semibold text-green-600">
                        {(row.totalRevenue || 0).toLocaleString()} ฿
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ================= Top Courses ================= */}
      <section className="mt-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-3 text-sm font-medium text-gray-600">
            5 อันดับคอร์สขายดีที่สุด
          </h3>

          {rankingLoading ? (
            <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
          ) : topCourses.length === 0 ? (
            <p className="text-sm text-gray-500">ยังไม่มีข้อมูลการขายคอร์ส</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-2 py-2 font-medium">อันดับ</th>
                    <th className="px-2 py-2 font-medium">ชื่อคอร์ส</th>
                    <th className="px-2 py-2 font-medium">จำนวนที่ขาย</th>
                    <th className="px-2 py-2 font-medium">ราคาคอร์ส</th>
                    <th className="px-2 py-2 font-medium">รายได้รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {topCourses.map((course, index) => (
                    <tr
                      key={`${String(course.courseId || "course")}-${index}`}
                      className="border-b border-gray-50"
                    >
                      <td className="px-2 py-2 font-semibold text-gray-700">
                        #{index + 1}
                      </td>
                      <td className="px-2 py-2 text-gray-800">
                        {course.title}
                      </td>
                      <td className="px-2 py-2 text-gray-700">
                        {course.salesCount || 0}
                      </td>
                      <td className="px-2 py-2 text-gray-700">
                        {(course.price || 0).toLocaleString()} ฿
                      </td>
                      <td className="px-2 py-2 font-semibold text-green-600">
                        {(course.totalRevenue || 0).toLocaleString()} ฿
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ================= Course Purchase Count ================= */}
      <section className="mt-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-3 text-sm font-medium text-gray-600">
            รายงานจำนวนผู้ซื้อคอร์สเรียนต่อคอร์ส
          </h3>

          {rankingLoading ? (
            <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
          ) : coursePurchaseCount.length === 0 ? (
            <p className="text-sm text-gray-500">ยังไม่มีข้อมูลผู้ซื้อคอร์ส</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-2 py-2 font-medium">อันดับ</th>
                    <th className="px-2 py-2 font-medium">ชื่อคอร์ส</th>
                    <th className="px-2 py-2 font-medium">จำนวนผู้ซื้อ</th>
                    <th className="px-2 py-2 font-medium">
                      จำนวนออเดอร์ชำระแล้ว
                    </th>
                    <th className="px-2 py-2 font-medium">รายได้รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {coursePurchaseCount.map((course, index) => (
                    <tr
                      key={`${String(course.courseId || "course")}-${index}`}
                      className="border-b border-gray-50"
                    >
                      <td className="px-2 py-2 font-semibold text-gray-700">
                        #{index + 1}
                      </td>
                      <td className="px-2 py-2 text-gray-800">
                        {course.title}
                      </td>
                      <td className="px-2 py-2 font-semibold text-indigo-600">
                        {course.uniqueBuyers || 0} คน
                      </td>
                      <td className="px-2 py-2 text-gray-700">
                        {course.salesCount || 0} ออเดอร์
                      </td>
                      <td className="px-2 py-2 font-semibold text-green-600">
                        {(course.totalRevenue || 0).toLocaleString()} ฿
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
