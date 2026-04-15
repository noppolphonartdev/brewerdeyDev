import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

function EmailVerify() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(`http://localhost:5000/api/auth/verify/${token}`);
        setStatus("success");
      } catch {
        setStatus("fail");
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div className="relative px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_16%_14%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_86%_12%,rgba(14,165,233,0.14),transparent_32%)]" />
      <div className="ui-surface reveal-up relative mx-auto w-full max-w-xl overflow-hidden border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_58%,#eef6ff_100%)] p-8 text-center">
        {status === "loading" && (
          <div className="space-y-3">
            <div className="skeleton-shimmer mx-auto h-4 w-2/3 rounded" />
            <div className="skeleton-shimmer mx-auto h-3 w-1/2 rounded" />
          </div>
        )}
        {status === "success" && (
          <div className="scale-in">
            <h2 className="text-2xl font-extrabold text-emerald-700">
              ✅ ยืนยันอีเมลสำเร็จ!
            </h2>
            <p className="ui-muted mt-2">
              คุณสามารถเข้าสู่ระบบและเริ่มใช้งานระบบได้ทันที
            </p>
            <Link
              to="/login"
              className="pressable mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        )}
        {status === "fail" && (
          <div className="scale-in">
            <h2 className="text-xl font-bold text-rose-700">
              ❌ ลิงก์ยืนยันไม่ถูกต้อง หรือหมดอายุ
            </h2>
            <p className="ui-muted mt-2">
              กรุณาสมัครใหม่หรือขอลิงก์ยืนยันอีกครั้ง
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailVerify;
