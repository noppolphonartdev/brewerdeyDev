import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    lastname: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (password) => password.length >= 6;

  useEffect(() => {
    const errs = {};

    if (touched.name && !form.name.trim()) errs.name = "กรุณากรอกชื่อ";
    if (touched.lastname && !form.lastname.trim())
      errs.lastname = "กรุณากรอกนามสกุล";
    if (touched.email && !validateEmail(form.email))
      errs.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (touched.password && !validatePassword(form.password))
      errs.password = "รหัสผ่านต้องมากกว่า 6 ตัวอักษร";
    if (touched.confirmPassword && form.confirmPassword !== form.password) {
      errs.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

    setErrors(errs);
  }, [form, touched]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess("");
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // mark ทุก field ว่า touched ก่อนส่ง
    setTouched({
      name: true,
      lastname: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(errors).length > 0) return;

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name: form.name,
        lastname: form.lastname,
        email: form.email,
        password: form.password,
      });

      setSuccess(res.data?.message || "สมัครเสร็จแล้ว...");
      navigate("/verify-pending", { state: { email: form.email } });
    } catch (err) {
      if (err.response?.data?.message === "อีเมลนี้ถูกใช้ไปแล้ว") {
        setErrors((prev) => ({ ...prev, email: "อีเมลนี้ถูกใช้ไปแล้ว" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: err.response?.data?.message || "เกิดข้อผิดพลาด",
        }));
      }
    }
  };

  return (
    <div className="relative px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_14%_14%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_88%_10%,rgba(14,165,233,0.14),transparent_30%)]" />

      <div className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <div className="ui-surface reveal-up hidden overflow-hidden border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_58%,#eef6ff_100%)] p-8 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            Create account
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            เริ่มต้นเรียนกับ BreweryDev
          </h1>
          <p className="ui-muted mt-3 text-sm leading-7">
            สร้างบัญชีเพื่อเข้าถึงคอร์สทั้งหมด ติดตามการซื้อ และรับใบ
            Certificate หลังเรียนจบ
          </p>
        </div>

        <div className="ui-surface reveal-up reveal-delay-1 w-full border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold text-slate-900">
            สมัครสมาชิก
          </h2>
          <p className="ui-muted mt-1 text-sm">
            ข้อมูลที่กรอกจะใช้สำหรับเข้าสู่ระบบและออกใบประกาศนียบัตร
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ชื่อ
              </label>
              <input
                type="text"
                name="name"
                placeholder="ชื่อ"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {touched.name && errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            {/* LastName */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                นามสกุล
              </label>
              <input
                type="text"
                name="lastname"
                placeholder="นามสกุล"
                value={form.lastname}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {touched.lastname && errors.lastname && (
                <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
              )}
            </div>
            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                อีเมล (สำหรับใช้เข้าสู่ระบบ)
              </label>
              <input
                type="email"
                name="email"
                placeholder="อีเมล"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {touched.email && errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            {/* Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
              </label>
              <input
                type="password"
                name="password"
                placeholder="รหัสผ่าน"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            {/* Confirm Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ยืนยันรหัสผ่าน
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="ยืนยันรหัสผ่าน"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="pressable w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              สมัคร
            </button>
          </form>
          {errors.general && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">
              {errors.general}
            </p>
          )}
          {success && (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
              {success}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
