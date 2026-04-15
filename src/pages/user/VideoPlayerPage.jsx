import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

const progressKey = (courseId) => `courseProgress:${courseId}`;

const normalizeVideoUrl = (url) => {
  if (!url) return "";
  return resolveMediaUrl(url);
};

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

function VideoPlayerPage() {
  const { id, sectionIndex, lessonIndex } = useParams();
  const navigate = useNavigate();
  const token = getToken();
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [orders, setOrders] = useState([]);
  const [openSections, setOpenSections] = useState({});
  const [progress, setProgress] = useState({});
  const [progressHydrated, setProgressHydrated] = useState(false);

  const latestProgressRef = useRef({});
  const syncTimerRef = useRef(null);

  const si = Number(sectionIndex);
  const li = Number(lessonIndex);

  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(progressKey(id));
      setProgress(raw ? normalizeProgressMap(JSON.parse(raw)) : {});
    } catch {
      setProgress({});
    }
  }, [id]);

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
        // หากโหลดไม่ได้ ให้ใช้ localStorage ต่อ
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
        // เงียบไว้ก่อนเพื่อไม่รบกวน UX
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

  useEffect(() => {
    let active = true;
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/courses/${id}`)
      .then((res) => {
        if (!active) return;
        setCourse(res.data || null);
      })
      .catch(() => {
        if (!active) return;
        setCourse(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!token) {
      setOrders([]);
      return;
    }
    axios
      .get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]));
  }, [token]);

  const purchased = useMemo(() => {
    if (!orders?.length) return false;
    return orders.some((o) => {
      const cid = (o.courseId && (o.courseId._id || o.courseId)) || "";
      const okId = String(cid) === String(id);
      const okStatus = o.paymentStatus
        ? String(o.paymentStatus).toLowerCase() === "paid"
        : true;
      return okId && okStatus;
    });
  }, [orders, id]);

  const curriculum = Array.isArray(course?.curriculum) ? course.curriculum : [];
  const currentSection = curriculum[si];
  const currentLesson = currentSection?.lessons?.[li];
  const hasValidLesson =
    Number.isInteger(si) && Number.isInteger(li) && !!currentLesson;

  useEffect(() => {
    if (!hasValidLesson) return;
    setOpenSections((prev) => ({ ...prev, [si]: true }));
  }, [hasValidLesson, si]);

  const canPreviewCurrent = !!currentLesson?.freePreview;
  const canPlayCurrent = canPreviewCurrent || purchased;
  const currentVideoUrl = normalizeVideoUrl(currentLesson?.videoUrl);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !canPlayCurrent || !currentVideoUrl) return;

    videoEl.load();
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }, [currentVideoUrl, canPlayCurrent]);

  useEffect(() => {
    if (!loading && course && !hasValidLesson) {
      navigate(`/course/${id}`, { replace: true });
    }
  }, [loading, course, hasValidLesson, navigate, id]);

  const updateProgress = (nextPct) => {
    if (!hasValidLesson) return;
    const key = `${si}-${li}`;
    setProgress((prev) => {
      const prevPct = prev[key]?.pct || 0;
      const pct = Math.max(prevPct, nextPct);
      const nextDone = prev[key]?.done || pct >= 95;

      if (pct === prevPct && Boolean(prev[key]?.done) === Boolean(nextDone)) {
        return prev;
      }

      return {
        ...prev,
        [key]: {
          pct,
          done: nextDone,
        },
      };
    });
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !hasValidLesson) return;
    const dur = videoRef.current.duration || 0;
    const cur = videoRef.current.currentTime || 0;
    if (dur <= 0) return;
    const pct = Math.min(100, Math.round((cur / dur) * 100));
    updateProgress(pct);
  };

  const handleEnded = () => {
    updateProgress(100);
  };

  const totalLessons = curriculum.reduce(
    (sum, sec) => sum + (Array.isArray(sec.lessons) ? sec.lessons.length : 0),
    0,
  );
  const doneLessons = Object.values(progress).filter((p) => p?.done).length;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-slate-950 px-4 py-6 text-slate-100">
        <div className="mx-auto max-w-[1400px] space-y-4">
          <div className="h-10 w-56 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-[52vh] animate-pulse rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <p className="text-lg font-semibold">ไม่พบคอร์ส</p>
          <Link
            to="/courses"
            className="mt-4 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            กลับไปหน้าคอร์ส
          </Link>
        </div>
      </div>
    );
  }

  if (!hasValidLesson) return null;

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-3 py-4 md:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2">
          <button
            onClick={() => navigate(`/course/${id}`)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
          >
            ← ย้อนกลับ
          </button>
          <p className="text-sm text-slate-300">
            เรียนแล้ว {doneLessons}/{totalLessons} บท
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-4 py-3">
              <p className="text-xs text-slate-400">
                {currentSection?.title || `หัวข้อที่ ${si + 1}`}
              </p>
              <h1 className="line-clamp-2 text-lg font-semibold md:text-xl">
                {currentLesson?.title || `บทเรียนที่ ${li + 1}`}
              </h1>
            </div>

            <div className="bg-black">
              {canPlayCurrent && currentVideoUrl ? (
                <video
                  key={`${si}-${li}-${currentVideoUrl}`}
                  ref={videoRef}
                  controls
                  autoPlay
                  className="h-[56vh] w-full bg-black md:h-[66vh]"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleEnded}
                >
                  <source src={currentVideoUrl} />
                  เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                </video>
              ) : (
                <div className="flex h-[56vh] flex-col items-center justify-center gap-4 px-6 text-center md:h-[66vh]">
                  <p className="text-sm text-slate-300">
                    {currentVideoUrl
                      ? "บทเรียนนี้ต้องซื้อคอร์สก่อน"
                      : "บทเรียนนี้ยังไม่มีวิดีโอ"}
                  </p>
                  {!purchased ? (
                    <button
                      onClick={() => navigate(`/checkout/${id}`)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      ซื้อคอร์สเพื่อรับชม
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          <aside className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto">
            <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 px-4 py-3">
              <p className="text-sm font-semibold">
                เนื้อหาคอร์ส ({totalLessons} บท)
              </p>
            </div>

            <div className="divide-y divide-slate-800/70">
              {curriculum.map((sec, sIdx) => {
                const lessons = Array.isArray(sec.lessons) ? sec.lessons : [];
                const isOpen = openSections[sIdx] ?? sIdx === si;

                return (
                  <div key={`${sec.title}-${sIdx}`}>
                    <button
                      onClick={() =>
                        setOpenSections((prev) => ({
                          ...prev,
                          [sIdx]: !isOpen,
                        }))
                      }
                      className="flex w-full items-center justify-between bg-slate-900 px-4 py-3 text-left hover:bg-slate-800/60"
                    >
                      <span className="line-clamp-1 text-sm font-medium text-slate-200">
                        {sec.title || `หัวข้อที่ ${sIdx + 1}`}
                      </span>
                      <span className="text-xs text-slate-400">
                        {lessons.length} บท
                      </span>
                    </button>

                    {isOpen && (
                      <div className="space-y-1 px-2 pb-2">
                        {lessons.map((lesson, lIdx) => {
                          const canPreview = !!lesson.freePreview;
                          const canPlay = canPreview || purchased;
                          const hasVideo = !!lesson.videoUrl;
                          const isCurrent = sIdx === si && lIdx === li;
                          const k = `${sIdx}-${lIdx}`;
                          const done = !!progress[k]?.done;

                          return (
                            <button
                              key={`${lesson.title}-${lIdx}`}
                              disabled={!canPlay || !hasVideo}
                              onClick={() =>
                                navigate(`/course/${id}/video/${sIdx}/${lIdx}`)
                              }
                              className={`w-full rounded-lg px-3 py-2 text-left transition ${
                                isCurrent
                                  ? "bg-blue-600/20 ring-1 ring-blue-500/60"
                                  : "hover:bg-slate-800/70"
                              } ${!canPlay || !hasVideo ? "cursor-not-allowed opacity-60" : ""}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="line-clamp-1 text-sm font-medium text-slate-100">
                                  {lesson.title || `บทเรียนที่ ${lIdx + 1}`}
                                </p>
                                <span className="text-xs text-slate-400">
                                  {!hasVideo
                                    ? "ไม่มีวิดีโอ"
                                    : canPlay
                                      ? "▶"
                                      : "🔒"}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-400">
                                {Number(lesson.duration) > 0
                                  ? `${lesson.duration} นาที`
                                  : "-"}
                                {canPreview && (
                                  <span className="ml-2 text-emerald-400">
                                    พรีวิวฟรี
                                  </span>
                                )}
                                {done && (
                                  <span className="ml-2 text-emerald-400">
                                    ดูจบแล้ว
                                  </span>
                                )}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayerPage;
