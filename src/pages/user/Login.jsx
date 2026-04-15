import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/useAuth";
import { FiEye, FiEyeOff } from "react-icons/fi";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData,
      );

      login(res.data);
      navigate("/my-orders");
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

  return (
    <div className="relative px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_14%_14%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_88%_8%,rgba(14,165,233,0.14),transparent_30%)]" />

      <div className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <div className="ui-surface reveal-up hidden overflow-hidden border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_58%,#eef6ff_100%)] p-8 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            Welcome back
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            กลับมาเรียนต่อได้ทันที
          </h1>
          <p className="ui-muted mt-3 text-sm leading-7">
            เข้าสู่ระบบเพื่อดูคอร์สที่สั่งซื้อ ประวัติการเรียน
            และติดตามสถานะคำสั่งซื้อทั้งหมดในที่เดียว
          </p>
        </div>

        <div className="ui-surface reveal-up reveal-delay-1 w-full border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold text-slate-900">
            เข้าสู่ระบบผู้ใช้
          </h2>
          <p className="ui-muted mt-1 text-sm">
            กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานบัญชีของคุณ
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <input
              name="email"
              type="email"
              placeholder="อีเมล"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            {/* Password + ปุ่มดู/ซ่อน */}
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="รหัสผ่าน"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-700 transition hover:text-blue-800"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>

            <button
              type="submit"
              className="pressable w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              เข้าสู่ระบบ
            </button>
          </form>

          <p className="ui-muted mt-4 text-center text-sm">
            ยังไม่มีบัญชี?
            <Link
              to="/register"
              className="ml-1 font-semibold text-blue-700 transition hover:text-blue-800"
            >
              สมัครสมาชิก
            </Link>
          </p>

          {error && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
