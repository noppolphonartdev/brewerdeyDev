import { NavLink, useNavigate } from "react-router-dom";
import { logoutAdmin } from "../utils/auth";

const SidebarLink = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`
    }
  >
    <span>{label}</span>
  </NavLink>
);

export default function AdminSidebar({ sideOpen, setSideOpen }) {
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/95 backdrop-blur-md shadow-xl
                  transform transition-transform duration-200
                  ${
                    sideOpen ? "translate-x-0" : "-translate-x-full"
                  } md:translate-x-0
                  flex flex-col`}
      aria-label="Sidebar"
    >
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-sm font-bold text-white shadow">
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Admin Panel</p>
          <p className="text-xs text-slate-500">จัดการระบบคอร์ส</p>
        </div>
        <button
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden"
          onClick={() => setSideOpen(false)}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <nav className="space-y-1 px-3">
        <SidebarLink to="/admin/dashboard" label="แดชบอร์ด" />
        <SidebarLink to="/admin/members" label="สมาชิก" />
        <SidebarLink to="/admin/orders" label="คำสั่งซื้อ" />
        <SidebarLink to="/admin/courses" label="จัดการคอร์สเรียน" />
      </nav>

      <div className="mt-auto p-4">
        <button
          onClick={() => {
            logoutAdmin();
            navigate("/admin/login");
          }}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
