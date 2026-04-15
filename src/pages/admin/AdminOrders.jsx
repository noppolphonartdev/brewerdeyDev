import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const parsePageParam = (rawPage) => {
  const parsed = Number.parseInt(String(rawPage || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parsePageParam(searchParams.get("page"));
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    order: null,
  });
  const previousFilterSearchRef = useRef({
    statusFilter: "all",
    search: "",
  });

  const itemsPerPage = 10;
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();
  const [slipModal, setSlipModal] = useState({
    open: false,
    url: "",
    orderId: "",
  });

  const updatePageInUrl = useCallback(
    (nextPage, { replace = false, removeOrderId = false } = {}) => {
      const safePage = Math.max(1, parsePageParam(nextPage));
      setSearchParams(
        (prevParams) => {
          const nextParams = new URLSearchParams(prevParams);
          nextParams.set("page", String(safePage));
          if (removeOrderId) nextParams.delete("orderId");
          return nextParams;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  const goToPage = useCallback(
    (nextPage, options = {}) => {
      const safePage = Math.max(1, parsePageParam(nextPage));
      updatePageInUrl(safePage, options);
    },
    [updatePageInUrl],
  );

  const openSlip = (order) => {
    if (!order?.slipUrl) return;
    setSlipModal({
      open: true,
      url: resolveMediaUrl(order.slipUrl),
      orderId: order._id,
    });
  };

  const fmtTime = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleTimeString("th-TH");
    } catch {
      return "-";
    }
  };

  const fetchOrders = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const res = await axios.get(
          "http://localhost:5000/api/orders/admin/all",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setOrders(res.data || []);
      } catch (err) {
        console.error(err);
        if (!silent) {
          alert("Session หมดอายุ หรือไม่มีสิทธิ์เข้าถึง");
          navigate("/admin/login");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [navigate, token],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOrders({ silent: true });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  useEffect(() => {
    const handleFocus = () => fetchOrders({ silent: true });
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchOrders({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchOrders]);

  const updateStatus = async (id, newStatus) => {
    if (updatingOrderId === id) return;

    setUpdatingOrderId(id);
    try {
      const { data } = await axios.patch(
        `http://localhost:5000/api/orders/${id}/update-status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setOrders((prev) =>
        prev.map((o) =>
          o._id === id
            ? {
                ...o,
                ...data,
                paymentStatus: data?.paymentStatus || newStatus,
              }
            : o,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setUpdatingOrderId((current) => (current === id ? "" : current));
    }
  };

  const openDeleteConfirm = (order) => {
    if (!order?._id || updatingOrderId === order._id || deletingOrderId) return;
    setDeleteModal({ open: true, order });
  };

  const closeDeleteConfirm = () => {
    if (deletingOrderId) return;
    setDeleteModal({ open: false, order: null });
  };

  const deleteOrder = async () => {
    const id = deleteModal.order?._id;
    if (!id) return;

    setDeletingOrderId(id);
    try {
      await axios.delete(`http://localhost:5000/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) => prev.filter((o) => o._id !== id));
      setDeleteModal({ open: false, order: null });
    } catch (err) {
      console.error(err);
      alert("ลบไม่สำเร็จ");
    } finally {
      setDeletingOrderId((current) => (current === id ? "" : current));
    }
  };

  const filtered = useMemo(() => {
    let list = [...orders];
    if (statusFilter !== "all")
      list = list.filter(
        (o) => (o.paymentStatus || "").toLowerCase() === statusFilter,
      );
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => {
        const t1 = o?.courseId?.title?.toLowerCase() || "";
        const t2 = o?.userId?.email?.toLowerCase() || "";
        const t3 = o?.userId?.name?.toLowerCase() || "";
        return (
          t1.includes(q) ||
          t2.includes(q) ||
          t3.includes(q) ||
          (o._id || "").toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [orders, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageData = filtered.slice(pageStart, pageStart + itemsPerPage);

  useEffect(() => {
    if (!searchParams.get("page")) {
      updatePageInUrl(currentPage, { replace: true });
    }
  }, [searchParams, currentPage, updatePageInUrl]);

  useEffect(() => {
    if (loading) return;

    const linkedOrderId = searchParams.get("orderId");
    if (!linkedOrderId) return;

    const orderIndex = orders.findIndex((order) => order._id === linkedOrderId);
    const targetPage =
      orderIndex >= 0 ? Math.floor(orderIndex / itemsPerPage) + 1 : 1;

    if (targetPage !== currentPage || linkedOrderId) {
      updatePageInUrl(targetPage, { replace: true, removeOrderId: true });
    }
  }, [
    loading,
    orders,
    searchParams,
    itemsPerPage,
    currentPage,
    updatePageInUrl,
  ]);

  useEffect(() => {
    if (loading) return;

    if (currentPage > totalPages) {
      updatePageInUrl(totalPages, { replace: true });
    }
  }, [loading, currentPage, totalPages, updatePageInUrl]);

  useEffect(() => {
    const previous = previousFilterSearchRef.current;
    if (previous.statusFilter === statusFilter && previous.search === search) {
      return;
    }

    previousFilterSearchRef.current = { statusFilter, search };
    updatePageInUrl(1, { replace: true, removeOrderId: true });
  }, [statusFilter, search, updatePageInUrl]);

  const StatusBadge = ({ status }) => (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium " +
        (status === "paid"
          ? "bg-green-100 text-green-700"
          : status === "failed"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700")
      }
    >
      {status === "paid"
        ? "ชำระแล้ว"
        : status === "failed"
          ? "ยกเลิก"
          : "รอดำเนินการ"}
    </span>
  );

  return (
    <DashboardLayout title="Order">
      {/* Controls */}
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-3 sm:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา: ชื่อคอร์ส / อีเมล / ชื่อผู้ใช้ / รหัสออเดอร์"
              className="w-full rounded-xl border bg-white px-3 py-2 pr-8 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 20l-3-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">สถานะ: ทั้งหมด</option>
            <option value="paid">ชำระแล้ว</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="failed">ยกเลิก</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/courses"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            ไปหน้าจัดการคอร์ส
          </Link>
          <button
            onClick={() => fetchOrders()}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm text-white hover:brightness-95"
          >
            โหลดข้อมูลอีกครั้ง
          </button>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="max-h-auto overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">คอร์ส</th>
                <th className="px-4 py-3">ผู้สั่งซื้อ</th>
                <th className="px-4 py-3">วันที่และเวลา</th>
                <th className="px-6 py-3">ราคา</th>
                <th className="px-3 py-3">สถานะ</th>
                <th className="px-4 py-3">สลิป</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6" colSpan={7}>
                    กำลังโหลด...
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={7}>
                    ไม่พบข้อมูลตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                pageData.map((o) => {
                  const hasSlip = !!o.slipUrl;
                  const isUpdatingRow = updatingOrderId === o._id;
                  const isDeletingRow = deletingOrderId === o._id;
                  const isBusyRow = isUpdatingRow || isDeletingRow;

                  return (
                    <tr key={o._id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {o.courseId?.title || "-"}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              รหัส: {o._id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {o.userId?.name || "-"}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {o.userId?.email || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {o.purchaseDate
                          ? new Date(o.purchaseDate).toLocaleDateString("th-TH")
                          : "-"}
                        <p>{fmtTime(o.slipUploadedAt)}</p>
                      </td>
                      <td className="px-4 py-6">
                        {(o.totalPrice || 0).toLocaleString()} ฿
                      </td>
                      <td className="px-2 py-3">
                        <StatusBadge status={o.paymentStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openSlip(o)}
                            className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            ดูสลิป
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => updateStatus(o._id, "paid")}
                            disabled={!hasSlip || isBusyRow}
                            className="rounded-lg bg-green-600 text-white px-2 py-1 text-xs hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                            title={!hasSlip ? "ต้องมีสลิปก่อน" : "อนุมัติ"}
                          >
                            {isUpdatingRow ? "กำลังอัปเดต..." : "อนุมัติ"}
                          </button>

                          <button
                            onClick={() => updateStatus(o._id, "failed")}
                            disabled={isBusyRow}
                            className="rounded-lg bg-red-600 text-white px-2 py-1 text-xs hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            ปฏิเสธ
                          </button>

                          <button
                            onClick={() => openDeleteConfirm(o)}
                            disabled={isBusyRow}
                            className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeletingRow ? "กำลังลบ..." : "ลบ"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <p>
            หน้า <span className="font-medium">{currentPage}</span> /{" "}
            {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </section>

      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-indigo-100">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">
                Confirm Delete
              </p>
              <h3 className="mt-1 text-base font-semibold">
                ยืนยันการลบคำสั่งซื้อ
              </h3>
            </div>

            <div className="space-y-4 px-5 py-4">
              <p className="text-sm text-gray-700">
                คุณกำลังจะลบคำสั่งซื้อรายการนี้ การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>

              <div className="rounded-xl border border-red-100 bg-red-50/70 p-3 text-xs text-red-700">
                <p className="font-semibold text-red-800">
                  Order ID: {deleteModal.order?._id || "-"}
                </p>
                <p className="mt-1">
                  คอร์ส: {deleteModal.order?.courseId?.title || "-"}
                </p>
                <p className="mt-1">
                  ผู้สั่งซื้อ: {deleteModal.order?.userId?.name || "-"}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={closeDeleteConfirm}
                  disabled={!!deletingOrderId}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={deleteOrder}
                  disabled={!!deletingOrderId}
                  className="rounded-lg bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingOrderId ? "กำลังลบ..." : "ยืนยันการลบ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {slipModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold">
                สลิปคำสั่งซื้อ: {slipModal.orderId}
              </p>
              <button
                onClick={() =>
                  setSlipModal({ open: false, url: "", orderId: "" })
                }
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                ปิด
              </button>
            </div>
            <div className="p-4">
              <img
                src={slipModal.url}
                alt="slip"
                className="max-h-[75vh] w-full rounded-xl border object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
