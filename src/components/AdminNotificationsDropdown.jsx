import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminNotificationsDropdown({
  open,
  onClose,
  onCountChange,
}) {
  const navigate = useNavigate();
  const boxRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const getHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/notifications/admin/unread-count",
        {
          headers: getHeaders(),
        },
      );
      onCountChange?.(res.data?.count ?? 0);
    } catch (err) {
      console.error("fetch admin unread-count failed:", err);
    }
  };

  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      const el = boxRef.current;
      if (!el) return;
      const path = e.composedPath?.() || [];
      const clickedInside = path.includes(el) || el.contains(e.target);
      if (!clickedInside) onClose?.();
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/notifications/admin", {
          headers: getHeaders(),
        });
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("โหลด admin notifications ไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const markRead = async (id) => {
    await axios.patch(
      `http://localhost:5000/api/notifications/admin/${id}/read`,
      {},
      { headers: getHeaders() },
    );
    setItems((prev) => prev.map((x) => (x._id === id ? { ...x, isRead: true } : x)));
  };

  const markAllRead = async (e) => {
    e?.stopPropagation?.();
    try {
      await axios.patch(
        "http://localhost:5000/api/notifications/admin/read-all",
        {},
        { headers: getHeaders() },
      );
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      onCountChange?.(0);
    } catch (err) {
      console.error("admin read-all failed:", err);
    }
  };

  const handleClickNoti = (n) => {
    const target = n?.link || "/admin/orders";
    navigate(target);
    onClose?.();

    if (!n?.isRead) {
      (async () => {
        try {
          await markRead(n._id);
          await fetchUnreadCount();
        } catch (err) {
          console.error("admin markRead failed:", err);
        }
      })();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={boxRef}
      onClick={(e) => e.stopPropagation()}
      className="dropdown-enter absolute right-0 top-12 z-[60] w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-bold text-slate-900">แจ้งเตือนแอดมิน</p>
        <button
          onClick={markAllRead}
          className="pressable text-xs font-semibold text-blue-700 hover:underline"
        >
          อ่านทั้งหมด
        </button>
      </div>

      <div className="max-h-[420px] overflow-auto">
        {loading ? (
          <div className="space-y-2 p-4">
            <div className="skeleton-shimmer h-3 w-2/3 rounded" />
            <div className="skeleton-shimmer h-3 w-full rounded" />
            <div className="skeleton-shimmer h-3 w-4/5 rounded" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-slate-800">ยังไม่มีแจ้งเตือน</p>
            <p className="mt-1 text-xs text-slate-500">
              เมื่อผู้ใช้แนบสลิปชำระเงิน ระบบจะแจ้งที่นี่
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n, idx) => (
              <li
                key={n._id}
                className={[
                  "reveal-up cursor-pointer px-4 py-3 hover:bg-slate-50",
                  n.isRead ? "opacity-80" : "bg-blue-50/45",
                ].join(" ")}
                style={{ animationDelay: `${Math.min(idx, 6) * 40}ms` }}
                onClick={() => handleClickNoti(n)}
              >
                <div className="flex gap-3">
                  <div
                    className={[
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      n.isRead ? "bg-slate-300" : "bg-blue-600",
                    ].join(" ")}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {n.title}
                    </p>
                    {n.message ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{n.message}</p>
                    ) : null}
                    <span className="mt-1 block text-[11px] text-slate-500">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString("th-TH") : ""}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 px-4 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="pressable w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
