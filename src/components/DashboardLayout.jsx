import { useEffect, useState } from "react";
import axios from "axios";
import DashboardSidebar from "../components/DashboardSidebar";
import AdminNotificationsDropdown from "./AdminNotificationsDropdown";
import { FaRegBell } from "react-icons/fa";

export default function AdminLayout({ title = "Dashboard", children }) {
  const [sideOpen, setSideOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);

  const fetchUnreadNotiCount = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setUnreadNotiCount(0);
        return;
      }

      const res = await axios.get(
        "http://localhost:5000/api/notifications/admin/unread-count",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUnreadNotiCount(res.data?.count ?? 0);
    } catch (err) {
      console.error("fetch admin unread notifications failed:", err);
    }
  };

  const toggleNoti = async () => {
    await fetchUnreadNotiCount();
    setNotiOpen((prev) => !prev);
  };

  useEffect(() => {
    fetchUnreadNotiCount();
    const t = setInterval(fetchUnreadNotiCount, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/80">
      <DashboardSidebar sideOpen={sideOpen} setSideOpen={setSideOpen} />

      <div className="md:ml-72 flex min-h-screen flex-col">
        <header>
          <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
                onClick={() => setSideOpen(true)}
                aria-label="Open sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold tracking-tight pt-2 text-slate-900">
                  {title}
                </h1>
              </div>
            </div>

            <div className="fixed right-4 top-4 z-[80] md:right-6">
              <button
                onClick={toggleNoti}
                className="pressable relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50"
                aria-label="Admin notifications"
                title="แจ้งเตือนแอดมิน"
              >
                <FaRegBell size={18} className="text-slate-700" />
                {unreadNotiCount > 0 && (
                  <span className="badge-pulse absolute -right-1 -top-1 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold text-white">
                    {unreadNotiCount}
                  </span>
                )}
              </button>

              <AdminNotificationsDropdown
                open={notiOpen}
                onClose={() => setNotiOpen(false)}
                onCountChange={setUnreadNotiCount}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-4">
          {children}
        </main>
      </div>

      {sideOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}
    </div>
  );
}
