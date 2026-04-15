import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

export default function CertificatePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const token = getToken();

  const [data, setData] = useState({ loading: true, cert: null });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    axios
      .get(`http://localhost:5000/api/certificates/${courseId}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!res.data?.hasCertificate) {
          navigate(`/course/${courseId}`);
        } else {
          setData({ loading: false, cert: res.data.certificate });
        }
      })
      .catch(() => {
        navigate(`/course/${courseId}`);
      });
  }, [courseId, token, navigate]);

  if (data.loading) {
    return (
      <div className="relative px-4 py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_16%_14%,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_86%_10%,rgba(14,165,233,0.14),transparent_34%)]" />
        <div className="ui-surface relative mx-auto w-full max-w-3xl border-slate-200 bg-white p-6">
          <div className="space-y-3">
            <div className="skeleton-shimmer h-5 w-1/3 rounded" />
            <div className="skeleton-shimmer h-4 w-2/3 rounded" />
            <div className="skeleton-shimmer h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const { cert } = data;
  const fullName = `${cert.userId.name} ${cert.userId.lastname}`;
  const courseTitle = cert.courseId.title;
  const issuedAt = new Date(cert.issuedAt).toLocaleDateString("th-TH");

  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col items-center py-10
                  print:bg-white print:min-h-0 print:py-0"
    >
      {/* ปุ่มควบคุม บนเว็บเท่านั้น */}
      <div className="mb-4 flex gap-2 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          กลับ
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
        >
          พิมพ์ / ดาวน์โหลด PDF
        </button>
      </div>

      {/* เฉพาะส่วนนี้ที่จะถูกใช้ตอนพิมพ์ */}
      <div
        id="certificate-print"
        className="w-[1120px] aspect-[16/9] mx-auto bg-[#0b2a5a] p-6
                 print:w-full print:max-w-none print:h-auto print:aspect-auto"
      >
        {/* กรอบด้านใน */}
        <div
          className="relative w-full h-full bg-white rounded-3xl border-[18px] border-[#0b2a5a] overflow-hidden
                      shadow-2xl print:shadow-none"
        >
          {/* แถบหัวบน (โลโก้) */}
          <div className="flex items-center justify-between px-10 pt-8">
            {/* โลโก้ตัวอักษร แทนรูป FutureSkill */}
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500 text-xl font-extrabold text-white">
                B
              </div>
              <div>
                <p className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  BreweryDev
                </p>
                <p className="text-xs tracking-[0.25em] text-slate-400 uppercase">
                  Online Learning
                </p>
              </div>
            </div>
          </div>

          {/* เหรียญด้านขวา (ใช้ div วาดแทนรูป) */}
          <div className="absolute top-0 right-16 translate-y-6 hidden md:block">
            <div className="relative">
              <div className="w-40 h-40 rounded-full bg-sky-300 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-[#0b2a5a] flex items-center justify-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500 text-4xl font-extrabold text-white">
                    B
                  </div>
                </div>
              </div>
              {/* แถบริบบิ้นลงล่าง */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-14 h-20 bg-[#0b2a5a] rounded-b-3xl" />
            </div>
          </div>

          {/* เนื้อหาตรงกลาง */}
          <div className="flex flex-col items-center justify-center h-full px-16 pb-20 pt-6">
            {/* ส่วนหัว Certificate */}
            <div className="text-center mb-6 mt-4">
              <p className="text-[11px] tracking-[0.4em] text-slate-400 uppercase">
                Certificate of Completion
              </p>
              <p className="mt-3 text-5xl font-semibold text-[#1452b8]">
                Certificate
              </p>
              <p className="text-xs tracking-[0.35em] text-slate-400 uppercase mt-1">
                of completion
              </p>
            </div>

            {/* ชื่อผู้เรียน */}
            <div className="text-center mt-6 mb-4">
              <p className="text-sm text-slate-500 mb-2">มอบให้แก่</p>
              <p className="text-3xl font-bold text-slate-900">{fullName}</p>
            </div>

            {/* ข้อความอธิบายคอร์ส */}
            <div className="text-center text-[13px] text-slate-600 space-y-1 mb-6">
              <p>has successfully completed</p>
              <p className="font-medium text-slate-800">{courseTitle}</p>
              <p>an online course offered by BreweryDev</p>
              <p className="mt-1 font-semibold">{issuedAt}</p>
            </div>

            {/* บรรทัดล่าง (วันที่ + code + ลายเซ็น) */}
            <div className="mt-6 w-full flex justify-between items-end text-xs text-slate-500">
              <div className="flex flex-col gap-2">
                <div>
                  <p>วันที่ออกใบประกาศนียบัตร</p>
                  <p className="font-semibold text-slate-800">{issuedAt}</p>
                </div>

                <div className="mt-2 w-40 text-center">
                  <span className="font-signature text-sm text-slate-800 mb-1 block">
                    นพพล พลอาจ
                  </span>
                  <div className="border-t border-slate-400 pt-1">
                    ผู้รับรองหลักสูตร
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.2em]">
                  Certificate Code
                </p>
                <p className="font-mono text-sm text-slate-800">
                  {cert.certificateCode}
                </p>
              </div>
            </div>

            {/* ตราปั๊มมุมขวาล่าง */}
            <div className="absolute bottom-10 right-16 hidden md:block">
              <div className="relative w-36 h-36 rounded-full border-4 border-slate-700 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-2 border-slate-400 flex items-center justify-center">
                  <p className="text-[10px] font-semibold text-slate-700 text-center leading-tight">
                    BreweryDev
                    <br />
                    VERIFIED
                    <br />
                    COMPLETED
                  </p>
                </div>
              </div>
            </div>

            {/* ข้อความเล็กด้านล่างซ้าย */}
            <div className="absolute bottom-6 left-12 w-[55%] text-[9px] text-slate-400">
              BreweryDev has confirmed the identity of this individual and their
              participation in the course.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
