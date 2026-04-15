import { Link } from "react-router-dom";
import { FiBookOpen, FiClock, FiAward, FiArrowRight } from "react-icons/fi";
import { motion as Motion, useReducedMotion } from "motion/react";

const SECTION_VIEWPORT = { once: true, amount: 0.2 };
const SECTION_EASE = [0.22, 1, 0.36, 1];

export default function AboutPage() {
  const prefersReducedMotion = useReducedMotion();
  // เพิ่ม icon เข้าไปในข้อมูลเพื่อให้ UI ดูมีมิติมากขึ้น
  const highlights = [
    {
      title: "เรียนจากผู้มีประสบการณ์",
      description:
        "หลักสูตรออกแบบโดยผู้สอนที่มีประสบการณ์ในการทำเว็บไซต์จริง พร้อมตัวอย่างจากงานจริง",
      icon: <FiBookOpen size={28} />,
    },
    {
      title: "เรียนเมื่อไหร่ก็ได้",
      description:
        "ซื้อครั้งเดียว เรียนได้ทุกที่ทุกเวลา พร้อมติดตามความคืบหน้าในระบบ",
      icon: <FiClock size={28} />,
    },
    {
      title: "วัดผลและรับใบประกาศ",
      description:
        "มี ทำแบบทดสอบก่อนเรียนและหลังเรียน พร้อม Certificate สำหรับผู้เรียนที่ผ่านเกณฑ์",
      icon: <FiAward size={28} />,
    },
  ];

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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(circle_at_12%_12%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_88%_8%,rgba(14,165,233,0.14),transparent_30%)]" />

      <div className="relative mx-auto max-w-[1320px]">
        {/* Header Section */}
        <Motion.section
          {...getSectionMotionProps(0)}
          className="text-center mb-20"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/10 border border-blue-400/20 text-sm font-semibold mb-6 backdrop-blur-md text-blue-500">
            About BreweryDev
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 drop-shadow-lg leading-tight">
            แพลตฟอร์มเรียนออนไลน์ที่โฟกัส <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              ผลลัพธ์จริง
            </span>
          </h1>
          <p className="ui-muted text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed">
            BreweryDev ถูกออกแบบเพื่อให้การอัปสกิลเป็นเรื่องง่ายขึ้นสำหรับทุกคน
            ไม่ว่าคุณจะเริ่มต้นใหม่หรือกำลังขยับระดับความสามารถในสายงาน
            โดยเน้นเนื้อหาที่นำไปใช้ได้จริงและประสบการณ์การเรียนที่ลื่นไหลตั้งแต่เริ่มจนจบคอร์ส
          </p>
        </Motion.section>

        {/* Highlights Grid (Glassmorphism Cards) */}
        <Motion.section
          {...getSectionMotionProps(0.08)}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition duration-300 shadow-xl group"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:bg-blue-500/30 transition-all">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </Motion.section>

        {/* Call to Action (CTA) Section */}
        <Motion.section
          {...getSectionMotionProps(0.14)}
          className="bg-[radial-gradient(circle_at_12%_12%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_88%_8%,rgba(14,165,233,0.14),transparent_30%)] backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
        >
          <div className="text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              พร้อมเริ่มเรียนคอร์สแรกของคุณหรือยัง?
            </h3>
            <p className="text-slate-400 text-base">
              สำรวจหลักสูตรที่เปิดสอนและเริ่มอัปสกิลของคุณได้ทันที
            </p>
          </div>
          <Link
            to="/courses"
            className="shrink-0 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 flex items-center justify-center gap-2 group"
          >
            ไปที่หน้าคอร์สทั้งหมด{" "}
            <FiArrowRight className="text-xl group-hover:translate-x-1 transition-transform" />
          </Link>
        </Motion.section>
      </div>
    </div>
  );
}
