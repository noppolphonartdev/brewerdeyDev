import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  IoCartOutline,
  IoBookOutline,
  IoSettingsOutline,
  IoExitOutline,
} from "react-icons/io5";
import avatarDefault from "../assets/img/default-avatar/avatar-default.png";
import { resolveMediaUrl } from "../utils/mediaUrl";

export default function UserProfileDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();

  //ดึง user และฟังก์ชัน logout มาจาก Context
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout(); // ใช้ฟังก์ชัน logout จาก Context
    navigate("/login");
  };

  const fullName = `${user?.name || ""} ${user?.lastname || ""}`.trim();

  // ถ้ายังไม่มี user (เช่น ตอนแรกที่ยังไม่โหลด) ก็ไม่ต้องแสดงอะไร
  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="pressable inline-flex max-w-[220px] items-center gap-2  px-2 py-1 text-left"
      >
        <img
          //ให้ดึงข้อมูลจาก user.avatar ใน context
          src={user.avatar ? resolveMediaUrl(user.avatar) : avatarDefault}
          alt="avatar"
          className="h-10 w-10 bg-cover rounded-full border border-slate-200 object-cover"
        />
        <span className="max-w-[130px] tracking-[0.04em] truncate text-sm font-semibold text-slate-700">
          {fullName || user.email}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="dropdown-enter absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="mb-4 flex flex-col items-center">
            <img
              src={user.avatar ? resolveMediaUrl(user.avatar) : avatarDefault}
              alt="profile"
              className="mb-2 h-14 w-14 rounded-full border border-slate-200 object-cover"
            />
            <div className="text-center text-lg font-bold text-slate-900">
              {user.name} {user.lastname}
            </div>
            <div className="ui-muted text-xs">{user.email}</div>
          </div>

          <hr className="my-2 border-slate-200" />
          {/* เมนู ตั้งค่าบัญชี */}
          <div className="flex flex-col gap-1">
            <button
              className="pressable flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
              onClick={() => {
                setOpen(false);
                navigate("/my-orders");
              }}
            >
              <IoCartOutline />
              การสั่งซื้อของฉัน
            </button>
            <button
              className="pressable flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
              onClick={() => {
                setOpen(false);
                navigate("/my-library");
              }}
            >
              <IoBookOutline />
              คลังความรู้ของฉัน
            </button>
            <button
              className="pressable flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
              onClick={() => {
                setOpen(false);
                navigate("/account");
              }}
            >
              <IoSettingsOutline />
              ตั้งค่าบัญชี
            </button>
          </div>

          <hr className="my-3 border-slate-200" />
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="pressable flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <IoExitOutline />
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}
