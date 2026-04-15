import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("กรุณากรอกรหัสผ่านให้ครบถ้วน");
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/auth/reset-password", {
        token,
        password,
      });

      setMessage(res.data.message || "รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
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
        <h2 className="text-2xl font-extrabold text-slate-900">ตั้งรหัสผ่านใหม่</h2>
        <p className="ui-muted mt-1 text-sm">
          กรุณากำหนดรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่านใหม่"
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="ยืนยันรหัสผ่านใหม่"
            autoComplete="new-password"
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
            {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
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

export default ResetPassword;
