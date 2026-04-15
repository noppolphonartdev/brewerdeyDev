import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

const toPaidCourses = (orders) => {
  const map = new Map();

  (Array.isArray(orders) ? orders : []).forEach((order) => {
    if (String(order?.paymentStatus).toLowerCase() !== "paid") return;

    const course = order?.courseId;
    if (!course || typeof course !== "object" || !course._id) return;

    if (!map.has(String(course._id))) {
      map.set(String(course._id), {
        _id: String(course._id),
        title: course.title || "คอร์สไม่มีชื่อ",
        image: course.image || "",
        instructor: course.instructor || "-",
        curriculum: Array.isArray(course.curriculum) ? course.curriculum : [],
      });
    }
  });

  return Array.from(map.values());
};

const getTotalLessons = (curriculum) =>
  (Array.isArray(curriculum) ? curriculum : []).reduce((sum, section) => {
    const lessons = Array.isArray(section?.lessons)
      ? section.lessons.length
      : 0;
    return sum + lessons;
  }, 0);

const getDoneLessons = (progressLessons) =>
  Object.values(progressLessons || {}).filter((row) => row?.done).length;

const getFirstLessonPath = (courseId, curriculum) => {
  const sections = Array.isArray(curriculum) ? curriculum : [];

  for (let sIdx = 0; sIdx < sections.length; sIdx += 1) {
    const lessons = Array.isArray(sections[sIdx]?.lessons)
      ? sections[sIdx].lessons
      : [];
    if (lessons.length > 0) {
      return `/course/${courseId}/video/${sIdx}/0`;
    }
  }

  return `/course/${courseId}`;
};

function MyKnowledgeLibrary() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [certificateByCourse, setCertificateByCourse] = useState({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchLibraryData = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const ordersRes = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const paidCourses = toPaidCourses(ordersRes.data);
        setCourses(paidCourses);

        if (paidCourses.length === 0) {
          setProgressByCourse({});
          setCertificateByCourse({});
          return;
        }

        const [progressEntries, certificateEntries] = await Promise.all([
          Promise.all(
            paidCourses.map(async (course) => {
              try {
                const res = await axios.get(
                  `http://localhost:5000/api/courses/${course._id}/progress`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  },
                );
                return [course._id, res.data?.lessons || {}];
              } catch {
                return [course._id, {}];
              }
            }),
          ),
          Promise.all(
            paidCourses.map(async (course) => {
              try {
                const res = await axios.get(
                  `http://localhost:5000/api/certificates/${course._id}/me`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  },
                );
                return [course._id, Boolean(res.data?.hasCertificate)];
              } catch {
                return [course._id, false];
              }
            }),
          ),
        ]);

        setProgressByCourse(Object.fromEntries(progressEntries));
        setCertificateByCourse(Object.fromEntries(certificateEntries));
      } catch (err) {
        console.error("Error fetching my library:", err);
        if (err?.response?.status === 403) {
          alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
          logout();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryData();
  }, [user, logout, navigate]);

  const courseCards = useMemo(() => {
    return courses.map((course) => {
      const totalLessons = getTotalLessons(course.curriculum);
      const doneLessons = Math.min(
        getDoneLessons(progressByCourse[course._id]),
        totalLessons,
      );

      const completed = totalLessons > 0 && doneLessons >= totalLessons;
      const inProgress = doneLessons > 0 && doneLessons < totalLessons;

      return {
        ...course,
        totalLessons,
        doneLessons,
        completed,
        inProgress,
        hasCertificate: Boolean(certificateByCourse[course._id]),
      };
    });
  }, [courses, progressByCourse, certificateByCourse]);

  const kpis = useMemo(() => {
    const registered = courseCards.length;
    const completed = courseCards.filter((course) => course.completed).length;
    const inProgress = courseCards.filter((course) => course.inProgress).length;
    const certificates = courseCards.filter(
      (course) => course.hasCertificate,
    ).length;

    return {
      registered,
      completed,
      inProgress,
      certificates,
    };
  }, [courseCards]);

  const fullName = `${user?.name || ""} ${user?.lastname || ""}`.trim();

  return (
    <div className="relative min-h-[calc(100vh-80px)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_14%_12%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_88%_10%,rgba(14,165,233,0.14),transparent_30%)]" />

      <div className="relative mx-auto max-w-[1320px] space-y-6">
        <header className="reveal-up">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            สวัสดี, {fullName || "ผู้เรียน"}! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            ยินดีต้อนรับกลับมา! ดูคอร์สที่คุณกำลังเรียนอยู่
          </p>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="ui-surface reveal-up p-4 sm:p-5">
            <p className="text-sm text-slate-500">คอร์สที่ลงทะเบียน</p>
            <p className="mt-2 text-4xl font-extrabold text-blue-600">
              {kpis.registered}
            </p>
          </article>
          <article className="ui-surface reveal-up p-4 sm:p-5">
            <p className="text-sm text-slate-500">คอร์สที่เรียนจบ</p>
            <p className="mt-2 text-4xl font-extrabold text-emerald-600">
              {kpis.completed}
            </p>
          </article>
          <article className="ui-surface reveal-up p-4 sm:p-5">
            <p className="text-sm text-slate-500">กำลังเรียน</p>
            <p className="mt-2 text-4xl font-extrabold text-amber-500">
              {kpis.inProgress}
            </p>
          </article>
          <article className="ui-surface reveal-up p-4 sm:p-5">
            <p className="text-sm text-slate-500">ใบรับรอง</p>
            <p className="mt-2 text-4xl font-extrabold text-violet-600">
              {kpis.certificates}
            </p>
          </article>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            คอร์สของฉัน
          </h2>

          {loading ? (
            <div className="ui-surface mt-4 p-6">
              <div className="space-y-2">
                <div className="skeleton-shimmer h-5 w-1/3 rounded" />
                <div className="skeleton-shimmer h-4 w-full rounded" />
                <div className="skeleton-shimmer h-4 w-4/5 rounded" />
              </div>
            </div>
          ) : courseCards.length === 0 ? (
            <div className="ui-surface mt-4 flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <p className="text-5xl text-slate-300">📖</p>
              <p className="mt-3 text-2xl font-bold text-slate-800">
                ยังไม่มีคอร์ส
              </p>
              <p className="mt-2 text-sm text-slate-500">
                เริ่มต้นเรียนรู้กับเราได้เลย!
              </p>
              <Link
                to="/courses"
                className="pressable mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                ดูคอร์สทั้งหมด
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {courseCards.map((course, idx) => {
                const learnPath = getFirstLessonPath(
                  course._id,
                  course.curriculum,
                );

                return (
                  <article
                    key={course._id}
                    className="ui-surface lift-card reveal-up overflow-hidden"
                    style={{ animationDelay: `${Math.min(idx, 6) * 65}ms` }}
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                      <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-28 sm:w-44">
                        {course.image ? (
                          <img
                            src={resolveMediaUrl(course.image)}
                            alt={course.title}
                            className="h-full w-full bg-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-sm font-semibold text-slate-500">
                            ไม่มีรูปคอร์ส
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="line-clamp-2 text-lg font-bold text-slate-900">
                          {course.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          ผู้สอน: {course.instructor}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                            {course.doneLessons}/{course.totalLessons} บทเรียน
                          </span>

                          {course.completed ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                              เรียนจบแล้ว
                            </span>
                          ) : course.inProgress ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                              กำลังเรียน
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                              ยังไม่เริ่มเรียน
                            </span>
                          )}

                          {course.hasCertificate && (
                            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700">
                              มีใบรับรอง
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            to={`/course/${course._id}`}
                            className="pressable rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            ดูรายละเอียด
                          </Link>
                          <Link
                            to={learnPath}
                            className="pressable rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            ไปเรียน
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default MyKnowledgeLibrary;
