import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import toast from "react-hot-toast";
import avatarDefault from "../../assets/img/default-avatar/avatar-default.png";
import { resolveMediaUrl } from "../../utils/mediaUrl";

export default function AccountSetting() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // General UI States
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  // Avatar Upload States
  const [imageFile, setImageFile] = useState(null);

  // Edit Name Modal States
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editLastname, setEditLastname] = useState(user?.lastname || "");
  const [nameError, setNameError] = useState("");

  // Change Password Modal States
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setEditName(user.name || "");
    setEditLastname(user.lastname || "");
  }, [navigate, user]);

  // --- Image Handler ---
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  if (!user) return null;

  // --- Avatar Upload Logic ---
  const handleUploadAvatar = async () => {
    if (!imageFile) {
      toast.error("กรุณาเลือกไฟล์ก่อน");
      return;
    }
    setLoading(true);
    const loadingToast = toast.loading("กำลังอัปโหลด...");
    const formData = new FormData();
    formData.append("avatar", imageFile);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/auth/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      updateUser(res.data); // อัปเดตข้อมูลผ่าน Context
      toast.success("อัปโหลดรูปสำเร็จ!", { id: loadingToast });
      setImageFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "อัปโหลดไม่สำเร็จ", {
        id: loadingToast,
      });
    }
    setLoading(false);
  };

  // --- Edit Name Logic ---
  const handleSubmitEdit = async () => {
    if (!editName.trim() || !editLastname.trim()) {
      return setNameError("กรุณากรอกชื่อและนามสกุล");
    }
    setLoading(true);
    setNameError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://localhost:5000/api/auth/profile",
        { name: editName, lastname: editLastname },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      updateUser(res.data); // อัปเดตข้อมูลผ่าน Context
      toast.success("เปลี่ยนชื่อสำเร็จ");
      setNameModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "เปลี่ยนชื่อไม่สำเร็จ");
    }
    setLoading(false);
  };

  // --- Change Password Logic ---
  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async () => {
    setPasswordError("");
    if (passwords.newPassword.length < 6) {
      return setPasswordError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setPasswordError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/auth/change-password",
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordModalOpen(false);
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ!");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  };

  return (
    <div className="relative px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_14%_12%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_86%_10%,rgba(14,165,233,0.14),transparent_30%)]" />

      <div className="ui-surface reveal-up relative mx-auto max-w-3xl overflow-hidden border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_60%,#eef6ff_100%)] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
          Account Settings
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          บัญชีทั่วไป
        </h2>
        <p className="ui-muted mt-1 text-sm">
          จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชีผู้ใช้งาน
        </p>

        <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center reveal-up reveal-delay-1">
          <img
            src={
              imageFile
                ? URL.createObjectURL(imageFile)
                : user.avatar
                  ? resolveMediaUrl(user.avatar)
                  : avatarDefault
            }
            alt="profile"
            className="h-40 w-40 rounded-sm border border-slate-200 bg-cover"
          />

          <div className="flex-1">
            <p className="text-lg font-bold text-slate-900">
              {user.name} {user.lastname}
            </p>
            <p className="ui-muted text-sm">{user.email}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="pressable rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => fileRef.current.click()}
                type="button"
              >
                {imageFile ? "เปลี่ยนรูปใหม่" : "เลือกรูปโปรไฟล์"}
              </button>

              {imageFile && (
                <button
                  onClick={handleUploadAvatar}
                  disabled={loading}
                  className="pressable flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                  ) : (
                    "บันทึกรูปนี้"
                  )}
                </button>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileRef}
              className="hidden"
            />
            <span className="mt-2 block text-xs text-slate-500">
              รองรับไฟล์ png, jpg, jpeg
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="lift-card reveal-up rounded-xl border border-slate-200 bg-white px-4 py-4 reveal-delay-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Email
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {user.email}
            </p>
          </div>

          <div className="lift-card reveal-up rounded-xl border border-slate-200 bg-white px-4 py-4 reveal-delay-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Display Name
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {user.name} {user.lastname}
                </p>
              </div>
              <button
                className="pressable rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setNameModalOpen(true);
                  setEditName(user.name);
                  setEditLastname(user.lastname);
                  setNameError("");
                }}
              >
                เปลี่ยนชื่อผู้ใช้
              </button>
            </div>
          </div>

          <div className="lift-card reveal-up rounded-xl border border-slate-200 bg-white px-4 py-4 reveal-delay-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Password
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  *********
                </p>
              </div>
              <button
                className="pressable rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setPasswordModalOpen(true);
                  setPasswordError("");
                }}
              >
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </div>
        </div>
      </div>

      {nameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="ui-surface dropdown-enter w-full max-w-md overflow-hidden border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">
              เปลี่ยนชื่อผู้ใช้
            </h3>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="ชื่อ"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <input
                type="text"
                placeholder="นามสกุล"
                value={editLastname}
                onChange={(e) => setEditLastname(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {nameError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {nameError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setNameModalOpen(false)}
                className="pressable rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmitEdit}
                className="pressable flex min-w-[110px] items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                ) : (
                  "ยืนยัน"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="ui-surface dropdown-enter w-full max-w-md overflow-hidden border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">
              เปลี่ยนรหัสผ่าน
            </h3>

            <div className="mt-4 space-y-3">
              <input
                type="password"
                name="currentPassword"
                placeholder="รหัสผ่านปัจจุบัน"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <input
                type="password"
                name="newPassword"
                placeholder="รหัสผ่านใหม่"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {passwordError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {passwordError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="pressable rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="pressable flex min-w-[110px] items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                ) : (
                  "ยืนยัน"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
