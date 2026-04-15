import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";

function AdminLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ เพิ่ม state
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/admin/login",
        formData,
      );
      localStorage.setItem("adminToken", res.data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="ui-surface w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
          Admin Access
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
          เข้าสู่ระบบแอดมิน
        </h2>
        <p className="ui-muted mt-1 text-sm">
          ใช้บัญชีผู้ดูแลระบบเพื่อจัดการคอร์ส สมาชิก และคำสั่งซื้อ
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              อีเมล
            </label>
            <input
              name="email"
              placeholder="อีเมล"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              รหัสผ่าน
            </label>

            {/* ✅ ครอบ input เพื่อใส่ปุ่มไอคอนด้านขวา */}
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"} // ✅ สลับ type
                placeholder="รหัสผ่าน"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-11 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;
