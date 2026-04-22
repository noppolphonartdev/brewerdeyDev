import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { motion as Motion, useReducedMotion } from "motion/react";
import {
  SiCss3,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiMongodb,
  SiMysql,
  SiNodedotjs,
  SiPostman,
  SiReact,
  SiTailwindcss,
  SiVercel,
  SiGooglegemini,
  SiNextdotjs,
} from "react-icons/si";
import { VscVscode } from "react-icons/vsc";
import { IoIosArrowRoundForward } from "react-icons/io";
import IconCloudCanvas from "../../components/IconCloudCanvas";
import { useAuth } from "../../context/useAuth";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

const UNVERIFIED_EMAIL_PURCHASE_MESSAGE =
  "อีเมลนี้ยังไม่ได้ยืนยันที่อยู่อีเมล ไม่สามารถทำการสั่งซื้อได้ โปรดลองใหม่อีกครั้ง";

// ==========================================
// MOCK DATA (เทคโนโลยีหลักสำหรับการทำเว็บ)
// ==========================================
const coreTechData = [
  {
    id: 1,
    title: "HTML5",
    subtitle: "โครงสร้างและเนื้อหา (Structure)",
    description:
      "เปรียบเสมือน 'โครงกระดูก' ของเว็บไซต์ ใช้สำหรับกำหนดโครงสร้างพื้นฐานและเนื้อหาทั้งหมด เช่น หัวข้อ, ย่อหน้า, รูปภาพ, วิดีโอ และลิงก์ต่างๆ ให้เบราว์เซอร์เข้าใจ",
    image:
      "https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=2070&auto=format&fit=crop", // ภาพโค้ดหน้าจอแบบคลีนๆ
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg", // โลโก้ HTML
  },
  {
    id: 2,
    title: "CSS3",
    subtitle: "ความสวยงาม (Presentation)",
    description:
      "เปรียบเสมือน 'เสื้อผ้าและการตกแต่ง' ใช้สำหรับจัดการหน้าตาของเว็บไซต์ เช่น สีสัน, รูปแบบฟอนต์, ขนาด และการจัดวาง Layout ให้สวยงามและรองรับการแสดงผลบนทุกหน้าจอ (Responsive)",
    image:
      "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=2070&auto=format&fit=crop",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  },
  {
    id: 3,
    title: "JavaScript",
    subtitle: "การทำงานและโต้ตอบ (Behavior)",
    description:
      "เปรียบเสมือน 'สมองและระบบประสาท' ทำให้เว็บไซต์มีชีวิตและโต้ตอบกับผู้ใช้งานได้ เช่น การกดปุ่มแล้วมี Pop-up, แอนิเมชันเคลื่อนไหว, หรือการโหลดข้อมูลใหม่โดยไม่ต้องรีเฟรชหน้าเพจ",
    image:
      "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  },
];

// อย่าลืมประกาศ State ใน Component ด้วยนะครับ:
// const [selectedInstructor, setSelectedInstructor] = useState(instructorsData[0]);

const CLOUD_ICON_SIZE = 28;
const CORE_TECH_AUTO_PLAY_MS = 3000;
const CORE_TECH_RESUME_MS = 5000;
const CORE_TECH_FADE_OUT_MS = 220;
const CORE_TECH_FADE_IN_DELAY_MS = 40;
const SECTION_VIEWPORT = { once: true, amount: 0.2 };
const SECTION_EASE = [0.22, 1, 0.36, 1];

function HomePage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState(() => new Set());
  const [shouldStartStatsCount, setShouldStartStatsCount] = useState(false);
  const [animatedStats, setAnimatedStats] = useState([0, 0]);

  const [selectedTech, setSelectedTech] = useState(coreTechData[0]);
  const [isCoreTechAutoPlaying, setIsCoreTechAutoPlaying] = useState(true);
  const [isCoreTechTransitioning, setIsCoreTechTransitioning] = useState(false);
  const resumeCoreTechAutoPlayRef = useRef(null);
  const coreTechSwapTimeoutRef = useRef(null);
  const coreTechFadeInTimeoutRef = useRef(null);

  const transitionCoreTech = useCallback(
    (nextTech) => {
      if (!nextTech || nextTech.id === selectedTech.id) return;

      if (coreTechSwapTimeoutRef.current) {
        clearTimeout(coreTechSwapTimeoutRef.current);
      }
      if (coreTechFadeInTimeoutRef.current) {
        clearTimeout(coreTechFadeInTimeoutRef.current);
      }

      setIsCoreTechTransitioning(true);

      coreTechSwapTimeoutRef.current = setTimeout(() => {
        setSelectedTech(nextTech);

        coreTechFadeInTimeoutRef.current = setTimeout(() => {
          setIsCoreTechTransitioning(false);
        }, CORE_TECH_FADE_IN_DELAY_MS);
      }, CORE_TECH_FADE_OUT_MS);
    },
    [selectedTech.id],
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/courses");
        if (mounted) setCourses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const token = getToken();

    if (!user || !token) {
      setPurchasedCourseIds(new Set());
      return () => {
        mounted = false;
      };
    }

    axios
      .get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!mounted) return;

        const paidCourseIds = (Array.isArray(res.data) ? res.data : [])
          .filter(
            (order) =>
              String(order?.paymentStatus || "").toLowerCase() === "paid",
          )
          .map((order) => {
            const cid =
              (order?.courseId && (order.courseId._id || order.courseId)) || "";
            return String(cid);
          })
          .filter(Boolean);

        setPurchasedCourseIds(new Set(paidCourseIds));
      })
      .catch(() => {
        if (!mounted) return;
        setPurchasedCourseIds(new Set());
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!isCoreTechAutoPlaying || coreTechData.length <= 1) return undefined;

    const intervalId = setInterval(() => {
      const currentIndex = coreTechData.findIndex(
        (tech) => tech.id === selectedTech.id,
      );
      const nextIndex = (currentIndex + 1) % coreTechData.length;
      transitionCoreTech(coreTechData[nextIndex]);
    }, CORE_TECH_AUTO_PLAY_MS);

    return () => clearInterval(intervalId);
  }, [isCoreTechAutoPlaying, selectedTech.id, transitionCoreTech]);

  useEffect(() => {
    return () => {
      if (resumeCoreTechAutoPlayRef.current) {
        clearTimeout(resumeCoreTechAutoPlayRef.current);
      }
      if (coreTechSwapTimeoutRef.current) {
        clearTimeout(coreTechSwapTimeoutRef.current);
      }
      if (coreTechFadeInTimeoutRef.current) {
        clearTimeout(coreTechFadeInTimeoutRef.current);
      }
    };
  }, []);

  const handleCoreTechSelect = (tech) => {
    transitionCoreTech(tech);
    setIsCoreTechAutoPlaying(false);

    if (resumeCoreTechAutoPlayRef.current) {
      clearTimeout(resumeCoreTechAutoPlayRef.current);
    }

    resumeCoreTechAutoPlayRef.current = setTimeout(() => {
      setIsCoreTechAutoPlaying(true);
    }, CORE_TECH_RESUME_MS);
  };

  const featuredCourses = useMemo(() => courses.slice(0, 6), [courses]);

  const stats = useMemo(
    () => [
      { label: "คอร์สทั้งหมด", target: courses.length, suffix: "" },
      { label: "จำนวนผู้เรียนทั้งหมด", target: 500, suffix: "+" },
    ],
    [courses.length],
  );

  useEffect(() => {
    if (!shouldStartStatsCount || loading) return undefined;

    if (prefersReducedMotion) {
      setAnimatedStats(stats.map((item) => item.target));
      return undefined;
    }

    const startValues = stats.map((item) => (item.target > 0 ? 1 : 0));
    const durationMs = 1100;
    let frameId = 0;
    const startedAt = performance.now();

    setAnimatedStats(startValues);

    const tick = (now) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats(
        stats.map((item, index) => {
          const start = startValues[index];
          if (item.target <= start) return item.target;
          if (progress >= 1) return item.target;
          return Math.round(start + (item.target - start) * eased);
        }),
      );

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [loading, prefersReducedMotion, shouldStartStatsCount, stats]);

  const cloudIcons = useMemo(
    () => [
      <SiReact key="react" size={CLOUD_ICON_SIZE} color="#61DAFB" />,
      <SiTailwindcss key="tailwind" size={CLOUD_ICON_SIZE} color="#06B6D4" />,
      <SiJavascript key="javascript" size={CLOUD_ICON_SIZE} color="#F7DF1E" />,
      <SiNodedotjs key="node" size={CLOUD_ICON_SIZE} color="#339933" />,
      <SiHtml5 key="html5" size={CLOUD_ICON_SIZE} color="#E34F26" />,
      <SiCss3 key="css3" size={CLOUD_ICON_SIZE} color="#1572B6" />,
      <SiPostman key="postman" size={CLOUD_ICON_SIZE} color="#FF6C37" />,
      <SiMongodb key="mongodb" size={CLOUD_ICON_SIZE} color="#47A248" />,
      <SiMysql key="mysql" size={CLOUD_ICON_SIZE} color="#4479A1" />,
      <SiVercel key="vercel" size={CLOUD_ICON_SIZE} color="#666561" />,
      <SiGithub key="github" size={CLOUD_ICON_SIZE} color="#666561" />,
      <VscVscode key="vscode" size={CLOUD_ICON_SIZE} color="#2798F5" />,
      <SiGooglegemini key="gemini" size={CLOUD_ICON_SIZE} color="#2798F5" />,
      <SiNextdotjs />,
    ],
    [],
  );

  const learningArticles = [
    {
      title: "วางแผนเริ่มสาย Frontend อย่างเป็นระบบใน 30 วัน",
      description:
        "จัดลำดับการเรียน HTML, CSS, JavaScript และ React ให้ฝึกต่อเนื่องได้จริง",
      image: "/img/Learning_Insights1.png",
    },
    {
      title: "สูตรลัดการเป็น Frontend Developer",
      description:
        "เน้นใช้งานจริงด้วยพร้อมเทคนิคการจัดโครงสร้างไฟล์ให้โปรเจกต์",
      image: "/img/Learning_Insights2.png",
    },
    {
      title: "พื้นฐาน Logic และการจัดการข้อมูลเบื้องต้น",
      description:
        "เจาะลึกแนวคิดการทำงานของ Programming และวิธีคิดแบบ Developer เพื่อการแก้ปัญหาอย่างเป็นระบบ",
      image: "/img/Learning_Insights3.png",
    },
  ];

  const handleCheckoutClick = (event) => {
    if (user && !user.verified) {
      event.preventDefault();
      toast.error(UNVERIFIED_EMAIL_PURCHASE_MESSAGE);
    }
  };

  const getSectionMotionProps = (delay = 0) => {
    if (prefersReducedMotion) return {};

    return {
      initial: { opacity: 0, y: 24 },
      whileInView: { opacity: 1, y: 0 },
      transition: { duration: 0.58, ease: SECTION_EASE, delay },
      viewport: SECTION_VIEWPORT,
    };
  };

  return (
    <div className="pb-8">
      <div className="h-auto max-w-[1440px] flex items-center" />

      <Motion.section
        {...getSectionMotionProps(0)}
        onViewportEnter={() => setShouldStartStatsCount(true)}
        className="bg-[radial-gradient(circle_at_12%_14%,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_90%_8%,rgba(14,165,233,0.14),transparent_34%)]"
      >
        <div className="container mx-auto max-w-[1440px] flex flex-col gap-10 px-4 py-10 sm:px-6 md:flex-row md:justify-between md:items-center md:px-[80px] md:py-[96px]">
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-blue-700">
              Modern Learning Experience
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.06]">
              ยกระดับทักษะใหม่
              <br />
              <span className="brand-gradient-text">
                ด้วยการเรียนออนไลน์กับ BreweryDev
              </span>
            </h1>

            <p className="ui-muted mt-5 max-w-2xl text-sm leading-7 sm:text-base">
              พัฒนาความสามารถสาย Developer ผ่านคอร์สที่เรียงลำดับอย่างเป็นระบบ
              พร้อมเส้นทางเรียนที่ทำให้เริ่มง่าย เรียนต่อเนื่อง
              และต่อยอดงานได้จริง
            </p>

            <div className="reveal-up reveal-delay-1 mt-7 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Link
                to="/courses"
                className="pressable inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                ดูคอร์สทั้งหมด
              </Link>
              <Link
                to="/about"
                className="pressable inline-flex items-center justify-center rounded-xl border border-blue-100 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                รู้จัก BreweryDev
              </Link>
            </div>

            <div className="mx-auto mt-7 grid w-full max-w-3xl gap-3 sm:grid-cols-3 md:mx-0">
              {stats.map((item, idx) => (
                <div
                  key={item.label}
                  className="lift-card reveal-up rounded-xl border border-slate-200 bg-white/90 p-3"
                  style={{ animationDelay: `${120 + idx * 60}ms` }}
                >
                  <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {(animatedStats[idx] ?? 0).toLocaleString()}
                    {item.suffix}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto aspect-square w-full max-w-[340px]">
            <IconCloudCanvas
              icons={cloudIcons}
              iconBox={40}
              autoSpin={1}
              hoverBoost={1}
              pauseOnHover={false}
              className="w-full h-full"
            />
          </div>
        </div>
      </Motion.section>

      <Motion.section {...getSectionMotionProps(0.07)} className="bg-white">
        <div className="container mx-auto max-w-[1440px] px-4 pb-20 pt-10 sm:px-6 md:px-[80px] md:pb-24 md:pt-14">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              Learning Insights
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              แนวทางการเรียนรู้
            </h2>
            <p className="ui-muted mx-auto mt-3 max-w-3xl text-sm leading-7 sm:text-base">
              รวมไกด์และเทคนิคจาก BreweryDev ที่ช่วยให้คุณวางแผนเรียนเป็นขั้นตอน
              ฝึกทำโปรเจกต์ได้จริง และต่อยอดทักษะสาย Developer ได้อย่างมั่นใจ
            </p>

            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
              {learningArticles.map((item, idx) => {
                const cardDelay = idx * 0.08;

                return (
                  <article key={item.title} className="group relative pb-20">
                    <Motion.img
                      initial={
                        prefersReducedMotion
                          ? undefined
                          : { opacity: 0, y: 18, scale: 0.98 }
                      }
                      whileInView={
                        prefersReducedMotion
                          ? undefined
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      transition={{
                        duration: 0.5,
                        ease: SECTION_EASE,
                        delay: cardDelay + 0.04,
                      }}
                      viewport={SECTION_VIEWPORT}
                      className="h-56 w-full rounded-2xl bg-cover transition duration-500 group-hover:scale-[1.03]"
                      src={item.image}
                      alt={item.title}
                    />

                    <Motion.div
                      initial={
                        prefersReducedMotion ? undefined : { opacity: 0, y: 20 }
                      }
                      whileInView={
                        prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
                      }
                      transition={{
                        duration: 0.48,
                        ease: SECTION_EASE,
                        delay: cardDelay + 0.18,
                      }}
                      viewport={SECTION_VIEWPORT}
                      className="ui-surface lift-card absolute inset-x-4 -bottom-1 border-slate-200 bg-slate-50/95 p-4"
                    >
                      <h3 className="text-lg font-bold leading-7 text-slate-800 sm:text-xl">
                        {item.title}
                      </h3>
                      <p className="ui-muted mt-2 text-sm leading-6">
                        {item.description}
                      </p>
                    </Motion.div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </Motion.section>

      {/* Core Technologies : Magazine & Glassmorphism Style */}
      <Motion.section
        {...getSectionMotionProps(0.12)}
        className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_14%_12%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_86%_10%,rgba(14,165,233,0.14),transparent_32%)]" />

        <div className="relative container mx-auto max-w-[1440px]">
          <div className="mb-12 text-center md:mb-14">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Core Foundation
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
              หัวใจหลักของ
              <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                การสร้างเว็บไซต์
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-base text-slate-600 md:text-lg">
              3 ภาษาพื้นฐานที่คุณต้องรู้ก่อนก้าวสู่การเป็น Web Developer
            </p>
          </div>

          <div className="group relative h-[650px] overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/70 shadow-[0_26px_65px_-26px_rgba(15,23,42,0.4)] backdrop-blur-md md:h-[500px]">
            {/* ภาพพื้นหลัง */}
            <img
              key={`bg-${selectedTech.id}`}
              src={selectedTech.image}
              className={`absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-700 group-hover:scale-105 ${
                isCoreTechTransitioning ? "opacity-0" : "opacity-45"
              }`}
              alt={selectedTech.title}
            />
            {/* ไล่สีพื้นหลังให้ตัวหนังสืออ่านออก */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-slate-100/80 to-white/30 md:bg-gradient-to-r" />

            {/* ข้อมูลเทคโนโลยี */}
            <div
              className={`absolute inset-0 flex w-full flex-col justify-end p-8 transition-all duration-500 ease-out md:w-2/3 md:justify-center md:p-16 lg:w-1/2 ${
                isCoreTechTransitioning
                  ? "translate-y-2 opacity-0"
                  : "translate-y-0 opacity-100"
              }`}
            >
              <div className="mb-4 flex items-center gap-4">
                <img
                  src={selectedTech.logo}
                  alt="logo"
                  className="h-12 w-12 drop-shadow-lg md:h-16 md:w-16"
                />
                <span className="inline-block rounded-full border border-blue-300/60 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-700 backdrop-blur-md">
                  {selectedTech.subtitle}
                </span>
              </div>

              <h3
                key={`title-${selectedTech.id}`}
                className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm md:text-7xl"
              >
                {selectedTech.title}
              </h3>

              {/* กล่องรายละเอียดแบบกระจก (แทนที่ Stats) */}
              <div className="rounded-2xl border border-white/70 bg-white/65 p-6 shadow-xl backdrop-blur-md md:p-8">
                <p
                  key={`desc-${selectedTech.id}`}
                  className="text-base font-light leading-relaxed text-slate-700 md:text-lg"
                >
                  {selectedTech.description}
                </p>
              </div>
            </div>

            {/* ปุ่มกดเลือกเทคโนโลยี (วงกลมเรียงกันขวาล่าง) */}
            <div className="absolute left-1/2 top-6 flex flex-row gap-4 rounded-full border border-slate-200 bg-white/60 p-4 shadow-xl backdrop-blur-md md:bottom-8 md:right-6 md:top-auto md:flex-row md:left-auto -translate-x-1/2 md:translate-x-0">
              {coreTechData.map((tech) => (
                <button
                  key={tech.id}
                  onClick={() => handleCoreTechSelect(tech)}
                  className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 bg-white/80 transition-all duration-300 md:h-16 md:w-16 ${
                    selectedTech.id === tech.id
                      ? "scale-110 border-blue-500 bg-blue-50 shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                      : "border-slate-200 opacity-75 hover:border-cyan-300 hover:opacity-100"
                  }`}
                >
                  <img
                    src={tech.logo}
                    alt={tech.title}
                    className="h-8 w-8 object-contain md:h-10 md:w-10"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Motion.section>

      <Motion.section
        {...getSectionMotionProps(0.16)}
        className="py-8 bg-slate-50 border-t border-slate-100"
      >
        <div className="container mx-auto px-6 max-w-[1440px]">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <span className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-2 block">
                Featured
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                คอร์สแนะนำสำหรับเริ่มต้น
              </h2>
            </div>
            <Link
              to="/courses"
              className="group flex items-center gap-2 text-blue-600 font-semibold bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100 transition"
            >
              ดูคอร์สทั้งหมด{" "}
              <IoIosArrowRoundForward className="text-2xl group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading
              ? // Skeleton Loader ปรับให้ขอบมนขึ้น
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                  >
                    <div className="bg-slate-200 animate-pulse h-52 w-full" />
                    <div className="p-6 space-y-4">
                      <div className="bg-slate-200 animate-pulse h-4 w-1/4 rounded" />
                      <div className="bg-slate-200 animate-pulse h-6 w-3/4 rounded" />
                      <div className="bg-slate-200 animate-pulse h-4 w-full rounded" />
                      <div className="bg-slate-200 animate-pulse h-10 w-full rounded-xl mt-4" />
                    </div>
                  </div>
                ))
              : featuredCourses.map((course) => {
                  const isOwned = purchasedCourseIds.has(String(course._id));

                  return (
                    <article
                      key={course._id}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col group"
                    >
                      {/* Image Section */}
                      <Link
                        to={`/course/${course._id}`}
                        className="relative h-62 overflow-hidden block"
                      >
                        <img
                          src={
                            course.image
                              ? resolveMediaUrl(course.image)
                              : "https://placehold.co/640x360"
                          }
                          alt={course.title}
                          className="w-full h-full bg-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      {/* Content Section */}
                      <div className="p-6 flex flex-col flex-1">
                        <Link to={`/course/${course._id}`}>
                          <h3 className="text-xl font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                            {course.title}
                          </h3>
                        </Link>
                        <p className="text-slate-500 text-sm line-clamp-2 flex-1 leading-relaxed">
                          {course.description}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <p className="line-clamp-1 text-sm text-slate-600">
                            {course.instructor || "-"}
                          </p>
                          <p className="text-lg font-extrabold text-blue-700">
                            {(course.price || 0).toLocaleString()} ฿
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4">
                          <Link
                            to={`/course/${course._id}`}
                            className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl text-center transition duration-200"
                          >
                            รายละเอียด
                          </Link>
                          {isOwned ? (
                            <button
                              type="button"
                              disabled
                              className="flex-1 cursor-not-allowed rounded-xl bg-blue-400 py-3 text-center font-semibold text-white"
                            >
                              เป็นเจ้าของแล้ว
                            </button>
                          ) : (
                            <Link
                              to={`/checkout/${course._id}`}
                              onClick={handleCheckoutClick}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-center shadow-lg hover:shadow-blue-500/30 transition duration-200 transform hover:-translate-y-0.5"
                            >
                              ซื้อคอร์สนี้
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
          </div>
        </div>
      </Motion.section>
    </div>
  );
}

export default HomePage;
