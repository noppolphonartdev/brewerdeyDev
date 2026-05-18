import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/useAuth";
import { resolveMediaUrl } from "../../utils/mediaUrl";

/* อ่าน token จาก localStorage */
const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

/* helper: คีย์เก็บ progress ต่อคอร์สใน localStorage */
const progressKey = (courseId) => `courseProgress:${courseId}`;

const normalizeProgressMap = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const next = {};
  Object.entries(value).forEach(([key, row]) => {
    const rawPct = Number(row?.pct);
    const pct = Number.isFinite(rawPct)
      ? Math.max(0, Math.min(100, Math.round(rawPct)))
      : 0;
    const done = Boolean(row?.done) || pct >= 95;
    next[key] = { pct, done };
  });

  return next;
};

const mergeProgressMaps = (baseMap, incomingMap) => {
  const base = normalizeProgressMap(baseMap);
  const incoming = normalizeProgressMap(incomingMap);
  const merged = { ...base };

  Object.entries(incoming).forEach(([key, row]) => {
    const prev = merged[key] || { pct: 0, done: false };
    const pct = Math.max(Number(prev.pct) || 0, Number(row.pct) || 0);
    const done = Boolean(prev.done) || Boolean(row.done) || pct >= 95;
    merged[key] = { pct, done };
  });

  return merged;
};

/* helper: แสดงไอคอนเชฟร่อนขึ้น/ลงแบบไม่พึ่งไลบรารีเพิ่ม */
const Chevron = ({ open }) => (
  <svg
    className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

/* ไอคอนติ๊กถูก */
const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-emerald-600"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0l-3-3a1 1 0 111.42-1.42l2.29 2.29 6.54-6.54a1 1 0 011.42 0z"
      clipRule="evenodd"
    />
  </svg>
);

const shuffleArray = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const parseLines = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const UNVERIFIED_EMAIL_PURCHASE_MESSAGE =
  "อีเมลนี้ยังไม่ได้ยืนยันที่อยู่อีเมล ไม่สามารถทำการสั่งซื้อได้ โปรดลองใหม่อีกครั้ง";

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = getToken();

  /* State หลักของหน้า */
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]); // ใช้ตรวจว่าซื้อแล้วหรือยัง
  const [certificate, setCertificate] = useState({ loading: true, data: null });

  // โครงสร้างเป็น { [sectionIndex]: boolean }
  const [openSections, setOpenSections] = useState({});

  /* แบบทดสอบ */
  const [quizStatus, setQuizStatus] = useState({ pre: null, post: null });
  const [quiz, setQuiz] = useState({
    open: false,
    title: "",
    items: [],
    type: "pre",
    answers: {},
    showResult: false,
    score: 0,
  });

  /* Progress การดูวิดีโอต่อบทเรียน */
  // โครงสร้าง: { "si-li": { pct: number, done: boolean } }
  const [progress, setProgress] = useState({});
  const [progressHydrated, setProgressHydrated] = useState(false);

  const latestProgressRef = useRef({});
  const syncTimerRef = useRef(null);

  /* โหลด progress จาก localStorage เมื่อรู้จักคอร์สแล้ว */
  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(progressKey(id));
      setProgress(raw ? normalizeProgressMap(JSON.parse(raw)) : {});
    } catch {
      setProgress({});
    }
  }, [id]);

  /* เซฟ progress กลับ localStorage ทุกครั้งที่เปลี่ยน */
  useEffect(() => {
    if (!id) return;
    try {
      localStorage.setItem(progressKey(id), JSON.stringify(progress));
    } catch {
      // ignore write error
    }
  }, [id, progress]);

  useEffect(() => {
    latestProgressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let cancelled = false;

    const fetchProgressFromServer = async () => {
      if (!id) return;
      if (!token) {
        setProgressHydrated(true);
        return;
      }

      setProgressHydrated(false);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/courses/${id}/progress`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (cancelled) return;

        const serverLessons = normalizeProgressMap(res.data?.lessons);
        setProgress((prev) => mergeProgressMaps(prev, serverLessons));
      } catch {
        // fallback localStorage
      } finally {
        if (!cancelled) setProgressHydrated(true);
      }
    };

    fetchProgressFromServer();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const syncProgressToServer = useCallback(
    async (lessonsPayload) => {
      if (!id || !token) return;

      try {
        await axios.put(
          `http://localhost:5000/api/courses/${id}/progress`,
          { lessons: lessonsPayload },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch {
        // ignore sync errors for UX continuity
      }
    },
    [id, token],
  );

  useEffect(() => {
    if (!id || !token || !progressHydrated) return;

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(() => {
      syncProgressToServer(latestProgressRef.current);
      syncTimerRef.current = null;
    }, 900);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [id, token, progress, progressHydrated, syncProgressToServer]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncProgressToServer(latestProgressRef.current);
      }
    };
  }, [syncProgressToServer]);

  /* โหลดข้อมูลคอร์ส */
  useEffect(() => {
    let active = true;
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/courses/${id}`)
      .then((res) => active && setCourse(res.data))
      .catch((err) => console.error(err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  /* โหลดออเดอร์ผู้ใช้เพื่อเช็คสิทธิ์ */
  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]));
  }, [token]);

  /* โหลดสถานะแบบทดสอบ */
  useEffect(() => {
    if (!token) return;
    axios
      .get(`http://localhost:5000/api/courses/${id}/quiz/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setQuizStatus(res.data || { pre: null, post: null }))
      .catch(() => setQuizStatus({ pre: null, post: null }));
  }, [id, token]);

  useEffect(() => {
    let alive = true;

    const checkCert = async () => {
      if (!course?.certificateEnabled) {
        setCertificate({ loading: false, data: null });
        return;
      }

      //  ยังไม่ผ่าน post-test ไม่ต้องเช็ค certificate เลย
      if (!quizStatus?.post?.passed) {
        setCertificate({ loading: false, data: null });
        return;
      }

      setCertificate({ loading: true, data: null });

      try {
        const r = await axios.get(
          `http://localhost:5000/api/certificates/${id}/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!alive) return;

        if (r.data?.hasCertificate) {
          setCertificate({ loading: false, data: r.data.certificate });
        } else {
          setCertificate({ loading: false, data: null });
        }
      } catch {
        if (!alive) return;
        // สำคัญ: error ก็ต้องปิด loading
        setCertificate({ loading: false, data: null });
      }
    };

    checkCert();
    return () => {
      alive = false;
    };
  }, [id, token, quizStatus?.post?.passed, course?.certificateEnabled]);

  /* เป็นเจ้าของคอร์สแล้วหรือยัง */
  const purchased = useMemo(() => {
    if (!orders?.length) return false;
    return orders.some((o) => {
      const cid = (o.courseId && (o.courseId._id || o.courseId)) || "";
      const okId = String(cid) === String(id);
      // ฝั่ง orderRoutes ใช้ paymentStatus, บางรายการอาจไม่มี field status ใน client ตัวนี้จึงไม่บล็อกหากเป็นข้อมูลเก่า
      const okStatus = o.paymentStatus
        ? String(o.paymentStatus).toLowerCase() === "paid"
        : true;
      return okId && okStatus;
    });
  }, [orders, id]);

  /* Accordion handlers */
  const toggleSection = (si) =>
    setOpenSections((prev) => ({ ...prev, [si]: !prev[si] }));

  const goToCheckout = (courseId) => {
    if (user && !user.verified) {
      toast.error(UNVERIFIED_EMAIL_PURCHASE_MESSAGE);
      return;
    }
    navigate(`/checkout/${courseId}`);
  };

  const handleCheckoutLinkClick = (event) => {
    if (user && !user.verified) {
      event.preventDefault();
      toast.error(UNVERIFIED_EMAIL_PURCHASE_MESSAGE);
    }
  };

  /* Quiz controls */
  const startQuiz = (title, items, type) => {
    if (!items?.length) return;
    const quizItems =
      type === "post" ? shuffleArray(items) : Array.isArray(items) ? items : [];
    setQuiz({
      open: true,
      title,
      items: quizItems,
      type,
      answers: {},
      showResult: false,
      score: 0,
    });
    document.body.style.overflow = "hidden";
  };
  const closeQuiz = () => {
    setQuiz({
      open: false,
      title: "",
      items: [],
      type: "pre",
      answers: {},
      showResult: false,
      score: 0,
    });
    document.body.style.overflow = "";
  };

  const submitQuiz = async () => {
    try {
      const hasUnansweredQuestion = quiz.items.some(
        (_, index) => typeof quiz.answers[index] !== "number",
      );
      if (hasUnansweredQuestion) {
        alert("กรุณาตอบคำถามให้ครบทุกข้อก่อนส่ง");
        return;
      }

      // ส่งเป็น [{ questionId, answerIndex }] เพื่อรองรับการ shuffle
      const answersPayload = quiz.items.map((q, i) => {
        const qid = q?._id || q?.id; // subdocument ของ mongoose จะมี _id
        if (!qid) {
          throw new Error(
            "ไม่พบ questionId (_id) ในข้อสอบ กรุณาเช็คโครงสร้างข้อมูลข้อสอบ",
          );
        }
        const answerIndex = quiz.answers[i];
        if (typeof answerIndex !== "number") {
          throw new Error("กรุณาตอบคำถามให้ครบทุกข้อก่อนส่ง");
        }

        return {
          questionId: String(qid),
          answerIndex,
        };
      });

      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/quiz/${quiz.type}`,
        { answers: answersPayload },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const { score } = res.data;
      setQuiz((prev) => ({ ...prev, showResult: true, score }));

      // โหลดสถานะใหม่เหมือนเดิม
      const st = await axios.get(
        `http://localhost:5000/api/courses/${id}/quiz/status`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const nextQuizStatus = st.data || { pre: null, post: null };
      setQuizStatus(nextQuizStatus);

      // ตรวจ Certificate หลังทำ post-test
      if (quiz.type === "post") {
        if (!course?.certificateEnabled || !nextQuizStatus?.post?.passed) {
          setCertificate({ loading: false, data: null });
        } else {
          setCertificate({ loading: true, data: null });
          try {
            const certRes = await axios.get(
              `http://localhost:5000/api/certificates/${id}/me`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (certRes.data?.hasCertificate) {
              setCertificate({
                loading: false,
                data: certRes.data.certificate,
              });
            } else {
              setCertificate({ loading: false, data: null });
            }
          } catch {
            setCertificate({ loading: false, data: null });
          }
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "ส่งคำตอบไม่สำเร็จ");
    }
  };

  /*  UI  */
  if (loading) {
    return (
      <div className="relative px-4 py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_16%_14%,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_86%_10%,rgba(14,165,233,0.14),transparent_34%)]" />
        <div className="relative mx-auto max-w-[1320px]">
          <div className="ui-surface border-slate-200 bg-white p-6">
            <div className="space-y-3">
              <div className="skeleton-shimmer h-7 w-2/5 rounded" />
              <div className="skeleton-shimmer h-4 w-4/5 rounded" />
              <div className="skeleton-shimmer h-52 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="relative px-4 py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-[radial-gradient(circle_at_16%_14%,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_86%_10%,rgba(14,165,233,0.14),transparent_34%)]" />
        <div className="ui-surface reveal-up relative mx-auto max-w-3xl border-slate-200 bg-white p-8 text-center">
          <p className="text-base font-semibold text-slate-800">ไม่พบคอร์ส</p>
          <p className="ui-muted mt-1 text-sm">คอร์สอาจถูกลบหรือปิดการแสดงผล</p>
          <Link
            to="/courses"
            className="pressable mt-4 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            กลับไปหน้าคอร์สทั้งหมด
          </Link>
        </div>
      </div>
    );
  }

  const curriculum = Array.isArray(course.curriculum) ? course.curriculum : [];
  const hasPretestQuestions = (course.preTest?.length || 0) > 0;
  const hasDonePretest = (quizStatus.pre?.attemptCount || 0) >= 1;
  const canAccessPosttest = !hasPretestQuestions || hasDonePretest;
  const learnItems = parseLines(course.whatYouWillLearn);
  const audienceItems = parseLines(course.targetAudience);
  const requirementItems = parseLines(course.requirements);
  const hasExtraCourseDetails =
    learnItems.length > 0 ||
    audienceItems.length > 0 ||
    requirementItems.length > 0;
  const answeredQuizCount = quiz.items.reduce(
    (count, _, index) =>
      typeof quiz.answers[index] === "number" ? count + 1 : count,
    0,
  );
  const unansweredQuizCount = Math.max(
    quiz.items.length - answeredQuizCount,
    0,
  );
  const canSubmitQuiz = quiz.items.length > 0 && unansweredQuizCount === 0;

  return (
    <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_16%_14%,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_86%_10%,rgba(14,165,233,0.14),transparent_34%)]" />

      <div className="relative mx-auto grid max-w-[1320px] gap-6 md:grid-cols-12">
        {/* ซ้าย: รายละเอียดคอร์ส + สารบัญ */}
        <div className="reveal-up md:col-span-8">
          {course.image && (
            <img
              src={resolveMediaUrl(course.image)}
              alt={course.title}
              className="lift-card h-110 w-full rounded-2xl bg-cover shadow-sm"
            />
          )}

          <h1 className="reveal-up reveal-delay-1 mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {course.title}
          </h1>
          <p className="ui-muted reveal-up reveal-delay-2 mt-2 whitespace-pre-line text-sm leading-7 sm:text-base">
            {course.description}
          </p>

          {hasExtraCourseDetails && (
            <section className="reveal-up reveal-delay-2 mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                รายละเอียดคอร์ส
              </h2>

              {learnItems.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    ✨ สิ่งที่คุณจะได้รับจากคอร์สนี้
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {learnItems.map((item, idx) => (
                      <li key={`learn-${idx}`} className="flex gap-2 leading-7">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {audienceItems.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    🎯 คอร์สนี้เหมาะสำหรับ
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {audienceItems.map((item, idx) => (
                      <li
                        key={`audience-${idx}`}
                        className="flex gap-2 leading-7"
                      >
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {requirementItems.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    📌 ข้อกำหนดก่อนเรียน
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {requirementItems.map((item, idx) => (
                      <li
                        key={`requirement-${idx}`}
                        className="flex gap-2 leading-7"
                      >
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* ปุ่มแบบทดสอบ */}
          <div className="mt-8">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              เนื้อหาคอร์ส
            </h2>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() =>
                  startQuiz("แบบทดสอบก่อนเรียน", course.preTest || [], "pre")
                }
                className="pressable rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={
                  !course.preTest?.length || quizStatus.pre?.attemptCount >= 1
                }
                title={
                  !course.preTest?.length
                    ? "ยังไม่มีข้อสอบ"
                    : quizStatus.pre?.attemptCount >= 1
                      ? "ทำได้ครั้งเดียว"
                      : ""
                }
              >
                ทำแบบทดสอบก่อนเรียน
              </button>

              <button
                onClick={() => {
                  if (!purchased) {
                    goToCheckout(course._id);
                    return;
                  }
                  if (!canAccessPosttest) return;
                  startQuiz("แบบทดสอบหลังเรียน", course.postTest || [], "post");
                }}
                className={`pressable rounded-xl px-4 py-2 text-sm font-semibold ${
                  purchased
                    ? "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } disabled:opacity-60`}
                disabled={
                  purchased
                    ? !course.postTest?.length ||
                      quizStatus.post?.passed ||
                      !canAccessPosttest
                    : false
                }
                title={
                  purchased
                    ? !course.postTest?.length
                      ? "ยังไม่มีข้อสอบ"
                      : quizStatus.post?.passed
                        ? "ผ่านแล้ว"
                        : !canAccessPosttest
                          ? "ต้องทำ Pre-test ก่อน"
                          : ""
                    : "ต้องชำระเงินก่อน"
                }
              >
                {purchased
                  ? "ทำแบบทดสอบหลังเรียน"
                  : "ซื้อคอร์สเพื่อทำ Post-test"}
              </button>
            </div>

            {/* สรุปสถานะแบบทดสอบ */}
            <div className="mt-3 space-y-2">
              {quizStatus.pre && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-slate-900">
                      แบบทดสอบก่อนเรียน
                    </span>
                    <span>ทำ {quizStatus.pre.attemptCount} ครั้ง</span>
                    <span>
                      ผลคะแนน {quizStatus.pre.lastScore}/{quizStatus.pre.total}
                    </span>
                  </div>
                </div>
              )}
              {quizStatus.post && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    quizStatus.post.passed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-slate-900">
                      แบบทดสอบหลังเรียน
                    </span>
                    <span>ทำ {quizStatus.post.attemptCount} ครั้ง</span>
                    <span>
                      ผลคะแนน {quizStatus.post.bestScore}/
                      {quizStatus.post.total}
                    </span>
                    <span
                      className={`font-semibold ${
                        quizStatus.post.passed
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {quizStatus.post.passed ? "ผ่านแล้ว" : "ยังไม่ผ่าน"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* สารบัญแบบ Accordion */}
            {curriculum.length === 0 && (
              <p className="text-sm text-slate-500 mt-4">
                ยังไม่มีเนื้อหาหลักสูตร
              </p>
            )}

            <div className="mt-3 space-y-3">
              {curriculum.map((sec, si) => {
                const isOpen = !!openSections[si];
                const total = (sec.lessons || []).length;
                const doneCount = (sec.lessons || []).reduce((acc, _, li) => {
                  const k = `${si}-${li}`;
                  return acc + (progress[k]?.done ? 1 : 0);
                }, 0);

                return (
                  <div
                    key={si}
                    className="lift-card reveal-up overflow-hidden rounded-xl border border-slate-200 bg-white"
                    style={{ animationDelay: `${Math.min(si, 5) * 55}ms` }}
                  >
                    {/* Header: คลิกเพื่อยุบ/ขยาย */}
                    <button
                      onClick={() => toggleSection(si)}
                      className="pressable flex w-full items-center justify-between border-b border-slate-200 px-4 py-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <Chevron open={isOpen} />
                        <p className="font-medium">
                          {sec.title || `หัวข้อที่ ${si + 1}`}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {doneCount}/{total} บทเรียนเสร็จแล้ว
                      </span>
                    </button>

                    {/* Body: รายการบทเรียน (โชว์เมื่อ open) */}
                    {isOpen && (
                      <div className="dropdown-enter divide-y">
                        {(sec.lessons || []).map((les, li) => {
                          const canPreview = !!les.freePreview;
                          const canPlay = canPreview || purchased;
                          const k = `${si}-${li}`;
                          const done = !!progress[k]?.done;

                          return (
                            <div
                              key={li}
                              className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
                            >
                              {/* ติ๊กถูกเมื่อ ≥95% */}
                              <div className="w-5 h-5 flex items-center justify-center">
                                {done && <CheckIcon />}
                              </div>

                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {les.title || `บทเรียนที่ ${li + 1}`}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {Number(les.duration) > 0
                                    ? `${les.duration} นาที`
                                    : "—"}
                                  {canPreview && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-600">
                                      ดูฟรี
                                    </span>
                                  )}
                                  {progress[k]?.done && (
                                    <span className="ml-2 text-slate-400">
                                      • ดูจบแล้ว
                                    </span>
                                  )}
                                </p>
                              </div>

                              {canPlay ? (
                                <button
                                  onClick={() =>
                                    navigate(`/course/${id}/video/${si}/${li}`)
                                  }
                                  className="pressable rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                                  disabled={!les.videoUrl}
                                  title={
                                    les.videoUrl ? "" : "ยังไม่มีลิงก์วิดีโอ"
                                  }
                                >
                                  เล่นวิดีโอ
                                </button>
                              ) : (
                                <Link
                                  to={`/checkout/${course._id}`}
                                  onClick={handleCheckoutLinkClick}
                                  className="pressable rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  ชำระเงินเพื่อรับชม
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ขวา: กล่องสรุปราคา/ซื้อคอร์ส */}
        <aside className="reveal-up reveal-delay-1 h-fit md:col-span-4 md:sticky md:top-24 md:self-start">
          <div className="ui-surface lift-card space-y-3 border-slate-200 bg-white p-5 sm:p-6">
            <div className="text-2xl font-extrabold text-blue-700">
              {typeof course.price === "number"
                ? course.price.toLocaleString()
                : course.price}{" "}
              ฿
            </div>
            <div className="text-sm text-slate-600">
              ผู้สอน:{" "}
              <span className="font-medium">{course.instructor || "-"}</span>
            </div>

            {purchased ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                คุณเป็นผู้เรียนคอร์สนี้แล้ว
              </div>
            ) : (
              <button
                onClick={() => goToCheckout(course._id)}
                className="pressable w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                ซื้อคอร์สนี้
              </button>
            )}
            {!course?.certificateEnabled ? (
              <p className="text-xs text-slate-500 mt-2">
                คอร์สนี้ไม่เข้าร่วมการออกใบรับรอง Certificate
              </p>
            ) : certificate.loading ? (
              <div className="mt-2 space-y-2">
                <div className="skeleton-shimmer h-3 w-2/3 rounded" />
                <div className="skeleton-shimmer h-3 w-1/2 rounded" />
              </div>
            ) : certificate.data ? (
              <button
                onClick={() => navigate(`/certificate/${course._id}`)}
                className="pressable mt-2 w-full rounded-xl border border-emerald-500 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                ดู/ดาวน์โหลดใบ Certificate
              </button>
            ) : (
              <p className="text-xs text-slate-500 mt-2">
                คอร์สนี้เข้าร่วมการออกใบรับรอง Certificate
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Modal แบบทดสอบ */}
      {quiz.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="dropdown-enter ui-surface lift-card w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {quiz.title}
              </h3>
              <button
                onClick={closeQuiz}
                className="pressable rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ปิด
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {quiz.items.map((q, i) => (
                <div key={i} className="ui-surface p-4">
                  <p className="font-semibold text-base text-slate-900 mb-3">
                    {i + 1}. {q.prompt}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {q.choices.map((c, ci) => {
                      const thaiLabels = ["ก", "ข", "ค", "ง"];
                      return (
                        <label
                          key={ci}
                          className={`pressable flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
                            quiz.showResult && ci === q.correctIndex
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                              : quiz.answers[i] === ci
                                ? "border-blue-200 bg-blue-50 text-blue-800"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${i}`}
                            checked={quiz.answers[i] === ci}
                            onChange={() =>
                              setQuiz((prev) => ({
                                ...prev,
                                answers: { ...prev.answers, [i]: ci },
                              }))
                            }
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="font-semibold text-slate-900 min-w-[24px] text-base">
                            {thaiLabels[ci] || ci + 1}.
                          </span>
                          <span className="font-medium">{c}</span>
                        </label>
                      );
                    })}
                  </div>

                  {quiz.showResult && q.explanation && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm font-medium text-blue-800">
                        เฉลย: ข้อ{" "}
                        {["ก", "ข", "ค", "ง"][q.correctIndex] ||
                          q.correctIndex + 1}{" "}
                        — {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              {quiz.showResult ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    คะแนน:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {quiz.score}/{quiz.items.length}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-amber-600">
                  {canSubmitQuiz
                    ? "✅ ตอบครบทุกข้อแล้ว สามารถส่งคำตอบได้"
                    : `⏳ กรุณาตอบให้ครบทุกข้อ (เหลือ ${unansweredQuizCount} ข้อ)`}
                </p>
              )}

              {!quiz.showResult ? (
                <button
                  onClick={submitQuiz}
                  className="pressable rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                  disabled={!canSubmitQuiz}
                  title={
                    canSubmitQuiz ? "" : "กรุณาเลือกคำตอบให้ครบทุกข้อก่อนส่ง"
                  }
                >
                  ส่งคำตอบ
                </button>
              ) : (
                <button
                  onClick={closeQuiz}
                  className="pressable rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  ปิด
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetail;
