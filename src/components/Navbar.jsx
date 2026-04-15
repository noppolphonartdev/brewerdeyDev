import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import UserProfileDropdown from "./UserProfileDropdown";
import NotificationsDropdown from "./NotificationsDropdown";
import { useAuth } from "../context/useAuth";
import { FaBars, FaTimes, FaRegBell } from "react-icons/fa";

function Navbar() {
  const { user, unreadNotiCount, fetchUnreadNotiCount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);

  const navItems = [
    { to: "/", label: "หน้าแรก" },
    { to: "/courses", label: "คอร์สทั้งหมด" },
    { to: "/about", label: "เกี่ยวกับเรา" },
    { to: "/contact", label: "ติดต่อเรา" },
  ];

  const toggleNoti = async () => {
    await fetchUnreadNotiCount?.();
    setNotiOpen((v) => !v);
    setIsOpen(false);
  };

  const navClass = ({ isActive }) =>
    [
      "pressable rounded-lg px-3 py-2 text-sm font-medium transition",
      isActive
        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full" />

      <div className="relative mx-auto flex w-full max-w-[1320px] items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 reveal-up"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500 text-sm font-extrabold text-white shadow-md shadow-blue-200">
              B
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight brand-gradient-text">
                BreweryDev
              </p>
              <p className="-mt-1 hidden text-[11px] font-medium text-slate-500 sm:block">
                Learn. Build. Grow.
              </p>
            </div>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={navClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <div className="relative">
                <button
                  onClick={toggleNoti}
                  className="pressable relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50"
                  aria-label="Notifications"
                  title="แจ้งเตือน"
                >
                  <FaRegBell size={19} className="text-slate-700" />
                  {unreadNotiCount > 0 && (
                    <span className="badge-pulse absolute -right-1 -top-1 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold text-white">
                      {unreadNotiCount}
                    </span>
                  )}
                </button>
                <NotificationsDropdown
                  open={notiOpen}
                  onClose={() => setNotiOpen(false)}
                />
              </div>

              <UserProfileDropdown />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="pressable rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="pressable rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </div>

        <div className="relative flex items-center gap-2 md:hidden">
          {user && (
            <>
              <button
                onClick={toggleNoti}
                className="pressable relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50"
                aria-label="Notifications"
                title="แจ้งเตือน"
              >
                <FaRegBell size={18} className="text-slate-700" />
                {unreadNotiCount > 0 && (
                  <span className="badge-pulse absolute -right-1 -top-1 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold text-white">
                    {unreadNotiCount}
                  </span>
                )}
              </button>

              <NotificationsDropdown
                open={notiOpen}
                onClose={() => setNotiOpen(false)}
              />
            </>
          )}

          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setNotiOpen(false);
            }}
            className="pressable grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700"
            aria-label="Menu"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      <div
        className={`${isOpen ? "block" : "hidden"} dropdown-enter border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_16px_28px_rgba(15,23,42,0.08)] md:hidden`}
      >
        <ul className="space-y-1 text-center">
          {navItems.map((item) => (
            <li className="py-2" key={item.to}>
              <NavLink
                to={item.to}
                className={navClass}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </NavLink>
            </li>
          ))}

          {user && (
            <li className="pt-2">
              <button
                onClick={toggleNoti}
                className="pressable flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
              >
                แจ้งเตือน
                {unreadNotiCount > 0 && (
                  <span className="badge-pulse grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-600 px-1 text-[11px] text-white">
                    {unreadNotiCount}
                  </span>
                )}
              </button>
            </li>
          )}
        </ul>

        <div className="mt-4 flex flex-col items-center gap-3 border-t border-slate-200 pt-4">
          {user ? (
            <UserProfileDropdown />
          ) : (
            <>
              <Link
                to="/login"
                className="pressable w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700"
                onClick={() => setIsOpen(false)}
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="pressable w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                onClick={() => setIsOpen(false)}
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
