import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { motion as Motion, useReducedMotion } from "motion/react";
import { useAuth } from "../../context/useAuth";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const UNVERIFIED_EMAIL_PURCHASE_MESSAGE =
  "อีเมลนี้ยังไม่ได้ยืนยันที่อยู่อีเมล ไม่สามารถทำการสั่งซื้อได้ โปรดลองใหม่อีกครั้ง";
const SECTION_VIEWPORT = { once: true, amount: 0.2 };
const SECTION_EASE = [0.22, 1, 0.36, 1];

export default function CoursesPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [purchasedCourseIds, setPurchasedCourseIds] = useState(() => new Set());

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/courses");
        if (active) setCourses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("token");

    if (!user || !token) {
      setPurchasedCourseIds(new Set());
      return () => {
        active = false;
      };
    }

    axios
      .get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!active) return;

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
        if (!active) return;
        setPurchasedCourseIds(new Set());
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleCheckoutClick = (event) => {
    if (user && !user.verified) {
      event.preventDefault();
      toast.error(UNVERIFIED_EMAIL_PURCHASE_MESSAGE);
    }
  };

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? [...courses]
      : courses.filter((c) =>
          [c.title, c.instructor, c.description].some((field) =>
            (field || "").toLowerCase().includes(q),
          ),
        );

    if (sortBy === "priceAsc") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "priceDesc") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "title") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return list;
  }, [courses, search, sortBy]);

  const EmptyState = () => (
    <div className="ui-surface reveal-up col-span-full p-8 text-center">
      <p className="text-base font-semibold text-slate-900">
        ไม่พบคอร์สตามคำค้นหา
      </p>
      <p className="ui-muted mt-1 text-sm">ลองเปลี่ยนคำค้นหรือรีเซ็ตตัวกรอง</p>
    </div>
  );

  const CourseCard = ({ course, isOwned }) => (
    <article className="group lift-card reveal-up flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0">
      <Link to={`/course/${course._id}`}>
        <img
          src={
            course.image
              ? resolveMediaUrl(course.image)
              : "https://placehold.co/640x360"
          }
          alt={course.title}
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900">
          {course.title}
        </h3>
        <p className="ui-muted mt-1 line-clamp-2 text-sm flex-1 leading-relaxed ">
          {course.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-slate-600">{course.instructor || "-"}</p>
          <p className="text-lg font-extrabold text-blue-700">
            {(course.price || 0).toLocaleString()} ฿
          </p>
        </div>

        <div className="mt-4 flex gap-2 pt-1">
          <Link
            to={`/course/${course._id}`}
            className="pressable flex-1 rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ดูรายละเอียด
          </Link>
          {isOwned ? (
            <button
              type="button"
              disabled
              className="flex-1 cursor-not-allowed rounded-xl bg-blue-400 px-3 py-2 text-center text-sm font-semibold text-white"
            >
              เป็นเจ้าของแล้ว
            </button>
          ) : (
            <Link
              to={`/checkout/${course._id}`}
              onClick={handleCheckoutClick}
              className="pressable flex-1 rounded-xl bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              ซื้อเลย
            </Link>
          )}
        </div>
      </div>
    </article>
  );

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
    <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(circle_at_12%_14%,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_90%_8%,rgba(14,165,233,0.14),transparent_34%)]" />

      <div className="relative mx-auto w-full max-w-[1320px]">
        <Motion.section
          {...getSectionMotionProps(0)}
          className="ui-surface overflow-hidden border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_60%,#eef6ff_100%)] p-6 sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                Course Catalog
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                คอร์สทั้งหมด
              </h1>
              <p className="ui-muted mt-2 text-sm leading-6">
                ค้นหาและเลือกคอร์สที่เหมาะกับเป้าหมายของคุณในรูปแบบที่เรียบง่ายและชัดเจน
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              พบ {filteredCourses.length.toLocaleString()} คอร์ส
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr,220px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา: ชื่อคอร์ส / ผู้สอน / คำอธิบาย"
              className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="latest">เรียงจากล่าสุด</option>
              <option value="title">เรียงตามชื่อ (A-Z)</option>
              <option value="priceAsc">ราคาต่ำไปสูง</option>
              <option value="priceDesc">ราคาสูงไปต่ำ</option>
            </select>
          </div>
        </Motion.section>

        <Motion.section
          {...getSectionMotionProps(0.08)}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="skeleton-shimmer h-44" />
                <div className="space-y-3 p-4">
                  <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                  <div className="skeleton-shimmer h-3 w-full rounded" />
                  <div className="skeleton-shimmer h-3 w-2/3 rounded" />
                </div>
              </div>
            ))
          ) : filteredCourses.length === 0 ? (
            <EmptyState />
          ) : (
            filteredCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                isOwned={purchasedCourseIds.has(String(course._id))}
              />
            ))
          )}
        </Motion.section>
      </div>
    </div>
  );
}
