import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("กรุณากรอกอีเมล");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email,
      });
      setMessage(res.data.message || "หากอีเมลนี้อยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้");
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(circle_at_14%_14%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_88%_8%,rgba(14,165,233,0.14),transparent_30%)]" />

      <div className="ui-surface reveal-up relative mx-auto w-full max-w-xl border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-extrabold text-slate-900">ลืมรหัสผ่าน</h2>
        <p className="ui-muted mt-1 text-sm">
          กรอกอีเมลที่ใช้สมัครสมาชิก ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมล"
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={loading}
            className={`pressable w-full rounded-xl py-3 text-sm font-semibold text-white transition ${
              loading
                ? "cursor-not-allowed bg-blue-300"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-5 text-center text-sm">
          <Link to="/login" className="font-semibold text-blue-700 transition hover:text-blue-800">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
