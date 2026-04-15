import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

function VerifyPending() {
  const location = useLocation();
  const email = useMemo(() => location.state?.email || "", [location.state]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    if (!email || sending) return;

    try {
      setSending(true);
      const res = await axios.post(
        "http://localhost:5000/api/auth/resend-verification",
        { email },
      );
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_16%_14%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_86%_12%,rgba(14,165,233,0.14),transparent_32%)]" />
      <div className="ui-surface reveal-up relative mx-auto w-full max-w-xl overflow-hidden border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_58%,#eef6ff_100%)] p-7 text-center sm:p-10">
        <div className="mb-3 flex justify-center">
          <span className="badge-pulse grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-3xl">
            📧
          </span>
        </div>
        <h2 className="mb-2 text-2xl font-extrabold">โปรดยืนยันอีเมลของคุณ</h2>
        <p className="mb-4 text-sm text-slate-600">
          เพื่อสามารถชำระเงินและเข้าถึงคอร์สได้หลังจากยืนยันอีเมลแล้ว
        </p>
        <p className="mb-4 text-sm text-slate-600">
          ระบบได้ส่งลิงก์ยืนยันไปที่
          <br />
          <span className="font-semibold text-blue-700">
            {email || "อีเมลที่ใช้สมัครสมาชิก"}
          </span>
        </p>

        <button
          onClick={handleResend}
          disabled={sending || !email}
          className={`pressable mb-2 w-full rounded-xl py-2.5 text-sm font-semibold transition 
            ${
              sending || !email
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          {sending ? "กำลังส่งอีเมล..." : "ส่งอีเมลอีกครั้ง"}
        </button>

        {!email && (
          <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            ไม่พบอีเมลจากขั้นตอนสมัคร กรุณากลับไปสมัครสมาชิกใหม่อีกครั้ง
          </p>
        )}

        {message && (
          <div className="reveal-up mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {message}
          </div>
        )}

        <div className="mt-4 text-xs text-slate-500">
          ส่งสูงสุดได้ 2 ครั้งใน 30 นาที
        </div>

        <div className="mt-6">
          <Link
            to="/login"
            className="pressable text-sm font-semibold text-blue-700 hover:underline"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyPending;
