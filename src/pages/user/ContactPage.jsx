import { FiMail, FiClock } from "react-icons/fi";
import { motion as Motion, useReducedMotion } from "motion/react";

const SECTION_VIEWPORT = { once: true, amount: 0.2 };
const SECTION_EASE = [0.22, 1, 0.36, 1];

export default function ContactPage() {
  const prefersReducedMotion = useReducedMotion();

  const getSectionMotionProps = (delay = 0) => {
    if (prefersReducedMotion) return {};

    return {
      initial: { opacity: 0, y: 24 },
      whileInView: { opacity: 1, y: 0 },
      transition: { duration: 0.56, ease: SECTION_EASE, delay },
      viewport: SECTION_VIEWPORT,
    };
  };

  return (
    <div className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* Background Gradient สไตล์ของคุณ */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(circle_at_14%_12%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_86%_10%,rgba(14,165,233,0.14),transparent_30%)]" />

      <div className="relative mx-auto max-w-[1320px]">
        {/* Header Section */}
        <Motion.section
          {...getSectionMotionProps(0)}
          className="text-center mb-16"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/10 border border-blue-400/20 text-sm font-semibold mb-6 backdrop-blur-md text-blue-500">
            Contact Us
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 drop-shadow-lg leading-tight">
            ติดต่อ{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              BreweryDev
            </span>
          </h1>
          <p className="ui-muted text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed">
            หากต้องการสอบถามข้อมูล ปัญหาการใช้งาน หรือข้อเสนอแนะ
            สามารถติดต่อได้ตามช่องทางด้านล่าง ขอบคุณที่ไว้วางใจเรา
          </p>
        </Motion.section>

        {/* Contact Cards Grid (จัดกึ่งกลางและเอา Form ออกตามที่ต้องการ) */}
        <Motion.section
          {...getSectionMotionProps(0.09)}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16"
        >
          {/* Email Card */}
          <div className="bg-white/5 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl hover:bg-slate-50/50 transition duration-300 shadow-xl group flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
              <FiMail size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">อีเมล</h3>
            <p className="ui-muted text-sm leading-relaxed mb-4">
              ติดต่อเราได้ทุกเวลา
            </p>
            <a
              href="mailto:brewerydev.official@gmail.com"
              className="text-blue-600 font-semibold hover:text-blue-700 transition text-lg break-words"
            >
              brewerydev.official@gmail.com
            </a>
          </div>

          {/* Working Hours Card */}
          <div className="bg-white/5 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl hover:bg-slate-50/50 transition duration-300 shadow-xl group flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-600 mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
              <FiClock size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">เวลาทำการ</h3>
            <p className="ui-muted text-sm leading-relaxed mb-4">
              เปิดให้บริการทุกวัน
            </p>
            <p className="font-semibold text-lg text-slate-700">
              09:00 - 18:00 น.
            </p>
          </div>
        </Motion.section>
      </div>
    </div>
  );
}
