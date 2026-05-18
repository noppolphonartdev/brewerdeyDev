import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { toast } from "react-hot-toast";
import { resolveMediaUrl } from "../../utils/mediaUrl";

export default function AdminCourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const token = localStorage.getItem("adminToken");

  const [activeTab, setActiveTab] = useState("basic"); // basic | curriculum | pre | post | certificate
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    instructor: "",
    image: "",
    whatYouWillLearn: "",
    targetAudience: "",
    requirements: "",
    certificateEnabled: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [imageFitMode] = useState("cover");

  // Curriculum State
  const [curriculum, setCurriculum] = useState([{ title: "", lessons: [] }]);
  const [sectionOpen, setSectionOpen] = useState({ 0: true });

  // Quiz State
  const [preTest, setPreTest] = useState([]);
  const [postTest, setPostTest] = useState([]);

  // Per-question save state
  const [questionSaveState, setQuestionSaveState] = useState({});
  const [savingQuestionKeys, setSavingQuestionKeys] = useState({});

  // Video upload state
  const [videoUploading, setVideoUploading] = useState({});
  const [videoProgress, setVideoProgress] = useState({});
  const [videoUploadStatus, setVideoUploadStatus] = useState({});
  const videoUploadTimersRef = useRef({});

  // Certificate preview scaling
  const certContainerRef = useRef(null);
  const [certScale, setCertScale] = useState(0.55);

  const questionKey = (which, qi) => `${which}-${qi}`;

  const clearQuestionState = (which) => {
    if (!which) {
      setQuestionSaveState({});
      setSavingQuestionKeys({});
      return;
    }

    const prefix = `${which}-`;
    setQuestionSaveState((prev) => {
      const next = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (!k.startsWith(prefix)) next[k] = v;
      });
      return next;
    });
    setSavingQuestionKeys((prev) => {
      const next = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (!k.startsWith(prefix)) next[k] = v;
      });
      return next;
    });
  };

  const markQuestionDirty = (which, qi) => {
    const key = questionKey(which, qi);
    setQuestionSaveState((prev) => ({
      ...prev,
      [key]: { status: "dirty" },
    }));
  };

  const setQuestionStatus = (which, qi, status, message = "") => {
    const key = questionKey(which, qi);
    setQuestionSaveState((prev) => ({
      ...prev,
      [key]: {
        status,
        message,
        savedAt: status === "saved" ? Date.now() : prev[key]?.savedAt,
      },
    }));
  };

  const validateQuestion = (q) => {
    if (!q?.prompt?.trim()) return "กรุณากรอกคำถาม";
    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      return "คำถามต้องมีตัวเลือก 4 ข้อ";
    }
    if (q.choices.some((c) => !(c || "").trim())) {
      return "กรุณากรอกตัวเลือกให้ครบทั้ง 4 ข้อ";
    }
    if (Number.isNaN(Number(q.correctIndex)))
      return "กรุณาเลือกคำตอบที่ถูกต้อง";
    const idx = Number(q.correctIndex);
    if (idx < 0 || idx > 3) return "คำตอบที่ถูกต้องต้องอยู่ในช่วง 1-4";
    return "";
  };

  const getApiErrorMessage = (err, fallback) => {
    return (
      err?.response?.data?.error || err?.response?.data?.message || fallback
    );
  };

  const saveQuizToServer = async (which, payloadArray) => {
    if (!isEditing) throw new Error("SAVE_REQUIRES_EDIT_MODE");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const normalizedPayload = payloadArray.map((q) => ({
      prompt: String(q?.prompt || "").trim(),
      choices: Array.isArray(q?.choices)
        ? q.choices.map((c) => String(c || "").trim())
        : ["", "", "", ""],
      correctIndex: Number(q?.correctIndex),
      explanation: String(q?.explanation || "").trim(),
    }));
    const body =
      which === "pre"
        ? { preTest: normalizedPayload }
        : { postTest: normalizedPayload };
    await axios.put(`http://localhost:5000/api/courses/${id}`, body, config);
  };

  const saveQuestion = async (which, qi) => {
    if (!isEditing) {
      toast.error("ต้องบันทึกคอร์สก่อน จึงจะบันทึกรายข้อได้");
      return;
    }

    const list = which === "pre" ? preTest : postTest;
    const q = list[qi];
    if (!q) return;

    const invalidMsg = validateQuestion(q);
    if (invalidMsg) {
      setQuestionStatus(which, qi, "error", invalidMsg);
      toast.error(`ข้อที่ ${qi + 1}: ${invalidMsg}`);
      return;
    }

    const key = questionKey(which, qi);
    setSavingQuestionKeys((prev) => ({ ...prev, [key]: true }));
    setQuestionStatus(which, qi, "saving");

    try {
      await saveQuizToServer(which, list);
      setQuestionStatus(which, qi, "saved", "บันทึกแล้ว");
      toast.success(`บันทึกข้อที่ ${qi + 1} แล้ว`);
    } catch (err) {
      console.error(err);
      setQuestionStatus(which, qi, "error", "บันทึกไม่สำเร็จ");
      toast.error(getApiErrorMessage(err, "บันทึกคำถามไม่สำเร็จ"));
    } finally {
      setSavingQuestionKeys((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const saveAllQuestions = async (which) => {
    if (!isEditing) {
      toast.error("ต้องบันทึกคอร์สก่อน จึงจะบันทึกคำถามขึ้นเซิร์ฟเวอร์ได้");
      return;
    }

    const list = which === "pre" ? preTest : postTest;
    if (!list.length) {
      toast.error("ยังไม่มีคำถามให้บันทึก");
      return;
    }

    let firstInvalid = -1;
    list.forEach((q, qi) => {
      const invalidMsg = validateQuestion(q);
      if (invalidMsg) {
        setQuestionStatus(which, qi, "error", invalidMsg);
        if (firstInvalid === -1) firstInvalid = qi;
      }
    });

    if (firstInvalid !== -1) {
      toast.error(`กรุณาตรวจสอบข้อที่ ${firstInvalid + 1} ก่อนบันทึกทั้งหมด`);
      return;
    }

    const keySet = {};
    list.forEach((_, qi) => {
      keySet[questionKey(which, qi)] = true;
      setQuestionStatus(which, qi, "saving");
    });
    setSavingQuestionKeys((prev) => ({ ...prev, ...keySet }));

    try {
      await saveQuizToServer(which, list);
      list.forEach((_, qi) =>
        setQuestionStatus(which, qi, "saved", "บันทึกแล้ว"),
      );
      toast.success(
        `บันทึก ${which === "pre" ? "Pre-test" : "Post-test"} ทั้งหมดแล้ว`,
      );
    } catch (err) {
      console.error(err);
      list.forEach((_, qi) =>
        setQuestionStatus(which, qi, "error", "บันทึกไม่สำเร็จ"),
      );
      toast.error(getApiErrorMessage(err, "บันทึกทั้งหมดไม่สำเร็จ"));
    } finally {
      setSavingQuestionKeys((prev) => {
        const next = { ...prev };
        list.forEach((_, qi) => {
          delete next[questionKey(which, qi)];
        });
        return next;
      });
    }
  };

  const statusMeta = (which, qi) => {
    const state = questionSaveState[questionKey(which, qi)]?.status || "idle";
    if (state === "saved") {
      return {
        label: "บันทึกแล้ว",
        cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    }
    if (state === "saving") {
      return {
        label: "กำลังบันทึก...",
        cls: "border-sky-200 bg-sky-50 text-sky-700",
      };
    }
    if (state === "error") {
      return {
        label: "บันทึกไม่สำเร็จ",
        cls: "border-rose-200 bg-rose-50 text-rose-700",
      };
    }
    return {
      label: "ยังไม่บันทึก",
      cls: "border-amber-200 bg-amber-50 text-amber-700",
    };
  };

  const isSavingType = (which) =>
    Object.keys(savingQuestionKeys).some((k) => k.startsWith(`${which}-`));

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`);
        const full = res.data || {};

        setForm({
          title: full.title || "",
          description: full.description || "",
          price: full.price ?? "",
          instructor: full.instructor || "",
          image: full.image || "",
          whatYouWillLearn: full.whatYouWillLearn || "",
          targetAudience: full.targetAudience || "",
          requirements: full.requirements || "",
          certificateEnabled: !!full.certificateEnabled,
        });
        setPreview(full.image ? resolveMediaUrl(full.image) : "");
        setCurriculum(
          Array.isArray(full.curriculum) && full.curriculum.length
            ? full.curriculum
            : [{ title: "", lessons: [] }],
        );
        setPreTest(Array.isArray(full.preTest) ? full.preTest : []);
        setPostTest(Array.isArray(full.postTest) ? full.postTest : []);
        clearQuestionState();
      } catch (err) {
        console.error(err);
        toast.error("โหลดข้อมูลคอร์สไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    if (isEditing) {
      fetchCourseData();
    }
  }, [id, isEditing]);

  useEffect(
    () => () => {
      Object.values(videoUploadTimersRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      videoUploadTimersRef.current = {};
    },
    [],
  );

  const onSelectImage = (file) => {
    setImageFile(file || null);
    if (file) setPreview(URL.createObjectURL(file));
    else setPreview("");
  };

  const getFirstCurriculumError = () => {
    for (let si = 0; si < curriculum.length; si += 1) {
      const section = curriculum[si] || {};
      if (!String(section.title || "").trim()) {
        return {
          tab: "curriculum",
          message: `เนื้อหาหลักสูตร: หมวดที่ ${si + 1} ยังไม่ได้ตั้งชื่อ`,
          sectionIndex: si,
        };
      }

      const lessons = Array.isArray(section.lessons) ? section.lessons : [];
      for (let li = 0; li < lessons.length; li += 1) {
        if (!String(lessons[li]?.title || "").trim()) {
          return {
            tab: "curriculum",
            message: `เนื้อหาหลักสูตร: หมวดที่ ${si + 1} บทเรียนที่ ${li + 1} ยังไม่ได้ตั้งชื่อ`,
            sectionIndex: si,
          };
        }
      }
    }

    return null;
  };

  const getFirstQuizError = (which, questions) => {
    for (let qi = 0; qi < questions.length; qi += 1) {
      const invalidMsg = validateQuestion(questions[qi]);
      if (invalidMsg) {
        return {
          tab: which,
          which,
          questionIndex: qi,
          message: `${which === "pre" ? "Pre-test" : "Post-test"}: ข้อ ${qi + 1} ${invalidMsg}`,
          invalidMsg,
        };
      }
    }

    return null;
  };

  const validateBeforeSubmit = () => {
    if (!String(form.title || "").trim()) {
      return { tab: "basic", message: "ข้อมูลพื้นฐาน: กรุณากรอกชื่อคอร์ส" };
    }
    if (!String(form.instructor || "").trim()) {
      return { tab: "basic", message: "ข้อมูลพื้นฐาน: กรุณากรอกชื่อผู้สอน" };
    }

    const numericPrice = Number(form.price);
    if (form.price === "" || Number.isNaN(numericPrice) || numericPrice < 0) {
      return {
        tab: "basic",
        message: "ข้อมูลพื้นฐาน: กรุณากรอกราคาให้ถูกต้อง",
      };
    }

    const curriculumError = getFirstCurriculumError();
    if (curriculumError) return curriculumError;

    const preTestError = getFirstQuizError("pre", preTest);
    if (preTestError) return preTestError;

    const postTestError = getFirstQuizError("post", postTest);
    if (postTestError) return postTestError;

    return null;
  };

  const onSubmit = async (e) => {
    if (e) e.preventDefault();

    const submitError = validateBeforeSubmit();
    if (submitError) {
      setActiveTab(submitError.tab);

      if (submitError.tab === "curriculum") {
        setSectionOpen({ [submitError.sectionIndex]: true });
      }

      if (
        (submitError.tab === "pre" || submitError.tab === "post") &&
        typeof submitError.questionIndex === "number"
      ) {
        setQuestionStatus(
          submitError.which,
          submitError.questionIndex,
          "error",
          submitError.invalidMsg || "ข้อมูลคำถามไม่ถูกต้อง",
        );
      }

      toast.error(submitError.message);
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = form.image;
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        const up = await axios.post("http://localhost:5000/api/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = up.data.imageUrl;
      }
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        image: imageUrl,
        curriculum,
        preTest,
        postTest,
      };
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (isEditing) {
        await axios.put(
          `http://localhost:5000/api/courses/${id}`,
          payload,
          config,
        );
        toast.success("บันทึกการแก้ไขคอร์สเรียบร้อย");
      } else {
        await axios.post("http://localhost:5000/api/courses", payload, config);
        toast.success("สร้างคอร์สใหม่เรียบร้อย");
      }
      navigate("/admin/courses");
    } catch (e) {
      console.error(e);
      if (!token) {
        toast.error("กรุณาเข้าสู่ระบบแอดมิน");
        navigate("/admin/login");
      } else {
        const errorMessage = getApiErrorMessage(e, "บันทึกไม่สำเร็จ");
        if (/curriculum|lesson/i.test(errorMessage)) {
          setActiveTab("curriculum");
        }
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --- Curriculum Actions ---
  const addSection = () =>
    setCurriculum((prev) => [...prev, { title: "", lessons: [] }]);
  const removeSection = (si) =>
    setCurriculum((prev) => prev.filter((_, i) => i !== si));
  const updateSectionTitle = (si, value) =>
    setCurriculum((prev) =>
      prev.map((s, i) => (i === si ? { ...s, title: value } : s)),
    );
  const addLesson = (si) =>
    setCurriculum((prev) =>
      prev.map((s, i) =>
        i === si
          ? {
              ...s,
              lessons: [
                ...s.lessons,
                { title: "", duration: 0, videoUrl: "", freePreview: false },
              ],
            }
          : s,
      ),
    );
  const removeLesson = (si, li) =>
    setCurriculum((prev) =>
      prev.map((s, i) =>
        i === si ? { ...s, lessons: s.lessons.filter((_, j) => j !== li) } : s,
      ),
    );
  const updateLesson = (si, li, key, value) =>
    setCurriculum((prev) =>
      prev.map((s, i) =>
        i === si
          ? {
              ...s,
              lessons: s.lessons.map((l, j) =>
                j === li ? { ...l, [key]: value } : l,
              ),
            }
          : s,
      ),
    );

  const clearVideoUploadTimer = (key) => {
    const timeoutId = videoUploadTimersRef.current[key];
    if (!timeoutId) return;
    window.clearTimeout(timeoutId);
    delete videoUploadTimersRef.current[key];
  };

  const scheduleClearVideoSuccess = (key) => {
    clearVideoUploadTimer(key);
    videoUploadTimersRef.current[key] = window.setTimeout(() => {
      setVideoUploadStatus((prev) => {
        if (prev[key] !== "success") return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setVideoProgress((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      delete videoUploadTimersRef.current[key];
    }, 2500);
  };

  const uploadLessonVideo = async (si, li, file) => {
    if (!file) return;
    const key = `${si}-${li}`;
    clearVideoUploadTimer(key);

    try {
      setVideoUploading((prev) => ({ ...prev, [key]: true }));
      setVideoProgress((prev) => ({ ...prev, [key]: 0 }));
      setVideoUploadStatus((prev) => ({ ...prev, [key]: "uploading" }));

      const fd = new FormData();
      fd.append("video", file);
      const res = await axios.post(
        "http://localhost:5000/api/upload/video",
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (!e.total) return;
            const p = Math.round((e.loaded * 100) / e.total);
            setVideoProgress((prev) => ({ ...prev, [key]: p }));
          },
        },
      );

      updateLesson(si, li, "videoUrl", res.data.videoUrl);
      setVideoProgress((prev) => ({ ...prev, [key]: 100 }));
      setVideoUploadStatus((prev) => ({ ...prev, [key]: "success" }));
      scheduleClearVideoSuccess(key);
      toast.success("อัปโหลดวิดีโอสำเร็จ");
    } catch (err) {
      console.error(err);
      setVideoUploadStatus((prev) => ({ ...prev, [key]: "error" }));
      toast.error("อัปโหลดวิดีโอไม่สำเร็จ");
    } finally {
      setVideoUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // --- Quiz Actions ---
  const emptyQ = () => ({
    prompt: "",
    choices: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  });

  const addQ = (which) => {
    which === "pre"
      ? setPreTest((prev) => [...prev, emptyQ()])
      : setPostTest((prev) => [...prev, emptyQ()]);
    clearQuestionState(which);
  };
  const removeQ = (which, qi) => {
    which === "pre"
      ? setPreTest((prev) => prev.filter((_, i) => i !== qi))
      : setPostTest((prev) => prev.filter((_, i) => i !== qi));
    clearQuestionState(which);
  };
  const updateQ = (which, qi, key, val) => {
    const upd = (arr) =>
      arr.map((q, i) => (i === qi ? { ...q, [key]: val } : q));
    which === "pre"
      ? setPreTest((prev) => upd(prev))
      : setPostTest((prev) => upd(prev));
    markQuestionDirty(which, qi);
  };
  const updateChoice = (which, qi, ci, val) => {
    const upd = (arr) =>
      arr.map((q, i) => {
        if (i !== qi) return q;
        const choices = [...q.choices];
        choices[ci] = val;
        return { ...q, choices };
      });
    which === "pre"
      ? setPreTest((prev) => upd(prev))
      : setPostTest((prev) => upd(prev));
    markQuestionDirty(which, qi);
  };

  const tabs = [
    { id: "basic", label: "ข้อมูลพื้นฐาน" },
    { id: "curriculum", label: "เนื้อหาหลักสูตร" },
    { id: "pre", label: "แบบทดสอบก่อนเรียน" },
    { id: "post", label: "แบบทดสอบหลังเรียน" },
    { id: "certificate", label: "ใบรับรอง" },
  ];

  // Responsive certificate scale
  useEffect(() => {
    const el = certContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setCertScale(Math.min(1, w / 1120));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeTab]);

  const previewLearnerName = "Noppol Phonart";
  const previewCourseTitle =
    String(form.title || "").trim() || "ชื่อคอร์สตัวอย่าง";
  const previewIssuedAt = new Date().toLocaleDateString("th-TH");

  if (loading) {
    return (
      <DashboardLayout title={isEditing ? "แก้ไขคอร์ส" : "สร้างคอร์ส"}>
        <div className="p-6 text-center">กำลังโหลดข้อมูลคอร์ส...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEditing ? "แก้ไขคอร์ส" : "สร้างคอร์ส"}>
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto h-[calc(100vh-140px)]">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-col gap-1 border border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 text-white px-4 py-3 text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "กำลังบันทึก..." : "บันทึกคอร์ส"}
            </button>
            <button
              onClick={() => navigate("/admin/courses")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto">
          {activeTab === "basic" && (
            <div className="p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-4">
                ข้อมูลพื้นฐานคอร์ส
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {/* รูปภาพ */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    รูปภาพคอร์ส
                  </label>
                  <div className="overflow-hidden rounded-2xl ring-1 ring-gray-200 w-full max-w-md">
                    <div className="aspect-[16/9] w-full bg-gray-100 relative">
                      {preview ? (
                        <img
                          src={preview}
                          alt="preview"
                          className={`h-full w-full object-center ${
                            imageFitMode === "cover"
                              ? "object-cover"
                              : "object-contain bg-gray-50"
                          }`}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-sm text-gray-500">
                          ยังไม่มีรูป
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onSelectImage(e.target.files?.[0])}
                      className="text-sm file:mr-3 file:rounded-xl file:border file:bg-white file:px-3 file:py-2 file:text-sm hover:file:bg-gray-50"
                    />
                    {preview && (
                      <button
                        type="button"
                        onClick={() => onSelectImage(null)}
                        className="rounded-xl border px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                      >
                        ลบรูป
                      </button>
                    )}
                  </div>
                </div>

                {/* ฟอร์มพื้นฐาน */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    ชื่อคอร์ส *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="เช่น React for Beginners"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    ผู้สอน *
                  </label>
                  <input
                    value={form.instructor}
                    onChange={(e) =>
                      setForm({ ...form, instructor: e.target.value })
                    }
                    placeholder="ชื่อผู้สอน"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    ราคา (บาท) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    placeholder="เช่น 1990"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    รายละเอียด
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="สรุปเนื้อหา สิ่งที่ผู้เรียนจะได้รับ ฯลฯ"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    สิ่งที่คุณจะได้รับจากคอร์สนี้
                  </label>
                  <textarea
                    rows={4}
                    value={form.whatYouWillLearn}
                    onChange={(e) =>
                      setForm({ ...form, whatYouWillLearn: e.target.value })
                    }
                    placeholder="พิมพ์แต่ละข้อขึ้นบรรทัดใหม่ เช่น เข้าใจ React Hooks, ทำโปรเจกต์จริง"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    คอร์สนี้เหมาะสำหรับ
                  </label>
                  <textarea
                    rows={4}
                    value={form.targetAudience}
                    onChange={(e) =>
                      setForm({ ...form, targetAudience: e.target.value })
                    }
                    placeholder="พิมพ์แต่ละข้อขึ้นบรรทัดใหม่ เช่น ผู้เริ่มต้นสาย Front-end"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    ข้อกำหนดก่อนเรียน
                  </label>
                  <textarea
                    rows={3}
                    value={form.requirements}
                    onChange={(e) =>
                      setForm({ ...form, requirements: e.target.value })
                    }
                    placeholder="พิมพ์แต่ละข้อขึ้นบรรทัดใหม่ เช่น มีพื้นฐาน HTML/CSS เบื้องต้น"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "curriculum" && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-900">
                  เนื้อหาหลักสูตร
                </h2>
                <button
                  onClick={addSection}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow hover:bg-indigo-700"
                >
                  + เพิ่มหมวดหมู่
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* หมวดหมู่ (ซ้าย) */}
                <div className="w-1/3 border-r overflow-y-auto bg-gray-50/30 p-4 space-y-3">
                  {curriculum.map((sec, si) => (
                    <div
                      key={si}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        sectionOpen[si]
                          ? "bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-sm"
                          : "bg-white border-gray-200 hover:border-indigo-300"
                      }`}
                      onClick={() => {
                        setSectionOpen({ [si]: true });
                      }}
                    >
                      <div className="font-medium text-sm text-gray-900 line-clamp-1 mb-1">
                        หมวดที่ {si + 1}: {sec.title || "ไม่ได้ตั้งชื่อ"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sec.lessons?.length || 0} บทเรียน
                      </div>
                    </div>
                  ))}
                  {curriculum.length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-8">
                      ไม่มีหมวดหมู่
                    </div>
                  )}
                </div>

                {/* บทเรียน (ขวา) */}
                <div className="w-2/3 overflow-y-auto p-6 bg-white">
                  {Object.keys(sectionOpen).map((key) => {
                    const si = parseInt(key);
                    if (!sectionOpen[si]) return null;
                    const sec = curriculum[si];
                    if (!sec) return null;

                    return (
                      <div
                        key={`details-${si}`}
                        className="space-y-6 max-w-3xl"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                              ชื่อหมวดหมู่ที่ {si + 1}
                            </label>
                            <input
                              className="w-full text-lg font-bold border-b-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none py-1 transition-colors"
                              value={sec.title}
                              onChange={(e) =>
                                updateSectionTitle(si, e.target.value)
                              }
                              placeholder="กรอกชื่อหมวดหมู่..."
                            />
                          </div>
                          <button
                            onClick={() => removeSection(si)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm transition-colors"
                            title="ลบหมวดหมู่นี้"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-700">
                              บทเรียนในหมวดหมู่นี้
                            </h3>
                            <button
                              onClick={() => addLesson(si)}
                              className="text-sm bg-white border shadow-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors"
                            >
                              + เพิ่มบทเรียน
                            </button>
                          </div>

                          <div className="space-y-3">
                            {sec.lessons.map((les, li) => (
                              <div
                                key={li}
                                className="bg-white border rounded-xl p-4 flex gap-4 shadow-sm group"
                              >
                                <div className="text-gray-400 font-medium pt-2 w-6 text-center">
                                  {li + 1}
                                </div>
                                <div className="flex-1 space-y-3">
                                  <input
                                    className="w-full font-medium border-b border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none pb-1"
                                    placeholder="ชื่อบทเรียน"
                                    value={les.title}
                                    onChange={(e) =>
                                      updateLesson(
                                        si,
                                        li,
                                        "title",
                                        e.target.value,
                                      )
                                    }
                                  />
                                  <div className="flex flex-wrap gap-3 items-center text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500">
                                        ความยาว:
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        className="w-16 border rounded px-2 py-1 text-center"
                                        value={les.duration}
                                        onChange={(e) =>
                                          updateLesson(
                                            si,
                                            li,
                                            "duration",
                                            Number(e.target.value),
                                          )
                                        }
                                      />
                                      <span className="text-gray-500">
                                        นาที
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`free-${si}-${li}`}
                                        checked={!!les.freePreview}
                                        onChange={(e) =>
                                          updateLesson(
                                            si,
                                            li,
                                            "freePreview",
                                            e.target.checked,
                                          )
                                        }
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <label
                                        htmlFor={`free-${si}-${li}`}
                                        className="text-gray-600 cursor-pointer"
                                      >
                                        เปิดให้ดูฟรี (Preview)
                                      </label>
                                    </div>
                                  </div>
                                  <div>
                                    <input
                                      className="w-full border rounded-lg px-3 py-1.5 text-sm"
                                      placeholder="ลิงก์วิดีโอ (URL)"
                                      value={les.videoUrl}
                                      onChange={(e) =>
                                        updateLesson(
                                          si,
                                          li,
                                          "videoUrl",
                                          e.target.value,
                                        )
                                      }
                                    />
                                    <div className="mt-2 flex items-center gap-2">
                                      <label className="relative inline-flex items-center">
                                        <input
                                          type="file"
                                          accept="video/*"
                                          className="hidden"
                                          onChange={(e) =>
                                            uploadLessonVideo(
                                              si,
                                              li,
                                              e.target.files?.[0],
                                            )
                                          }
                                          disabled={
                                            !!videoUploading[`${si}-${li}`]
                                          }
                                        />
                                        <span
                                          className={`cursor-pointer rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 ${
                                            videoUploading[`${si}-${li}`]
                                              ? "opacity-60 pointer-events-none"
                                              : ""
                                          }`}
                                        >
                                          {videoUploading[`${si}-${li}`]
                                            ? "กำลังอัปโหลด..."
                                            : "อัปโหลดวิดีโอ"}
                                        </span>
                                      </label>

                                      {(() => {
                                        const key = `${si}-${li}`;
                                        const isUploading =
                                          !!videoUploading[key] ||
                                          videoUploadStatus[key] ===
                                            "uploading";
                                        const isSuccess =
                                          videoUploadStatus[key] === "success";

                                        if (!isUploading && !isSuccess) {
                                          return null;
                                        }

                                        const progress = Math.max(
                                          0,
                                          Math.min(
                                            100,
                                            Number(videoProgress[key] || 0),
                                          ),
                                        );

                                        return (
                                          <div className="flex-1">
                                            <div className="mb-1 flex items-center justify-between text-xs">
                                              <span
                                                className={`font-medium ${
                                                  isSuccess
                                                    ? "text-emerald-600"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                {isSuccess
                                                  ? "อัปโหลดสำเร็จ"
                                                  : "กำลังอัปโหลด..."}
                                              </span>
                                              <span className="font-semibold text-gray-700">
                                                {progress}%
                                              </span>
                                            </div>
                                            <div className="h-2 rounded bg-gray-200 overflow-hidden">
                                              <div
                                                className={`h-2 transition-all duration-200 ${
                                                  isSuccess
                                                    ? "bg-emerald-500"
                                                    : "bg-indigo-600"
                                                }`}
                                                style={{
                                                  width: `${progress}%`,
                                                }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-start">
                                  <button
                                    onClick={() => removeLesson(si, li)}
                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                                    title="ลบบทเรียน"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                            {sec.lessons.length === 0 && (
                              <div className="text-center py-6 text-sm text-gray-400 bg-white rounded-xl border border-dashed">
                                ยังไม่มีบทเรียนในหมวดหมู่นี้
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(sectionOpen).length === 0 &&
                    curriculum.length > 0 && (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        เลือกหมวดหมู่ทางซ้ายเพื่อจัดการบทเรียน
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* แบบทดสอบ (Pre/Post) */}
          {(activeTab === "pre" || activeTab === "post") &&
            (() => {
              const isPre = activeTab === "pre";
              const questions = isPre ? preTest : postTest;
              const title = isPre
                ? "แบบทดสอบก่อนเรียน (Pre-test)"
                : "แบบทดสอบหลังเรียน (Post-test)";
              const which = isPre ? "pre" : "post";

              return (
                <div className="p-6">
                  <div className="flex justify-between items-center border-b pb-4 mb-6 sticky top-0 bg-white z-10">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {title}
                      </h2>
                      {!isEditing && (
                        <p className="text-xs text-amber-700 mt-1">
                          * ต้องบันทึกคอร์สก่อน จึงจะบันทึกรายข้อได้
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveAllQuestions(which)}
                        disabled={
                          !isEditing || !questions.length || isSavingType(which)
                        }
                        className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        {isSavingType(which)
                          ? "กำลังบันทึก..."
                          : "บันทึกทั้งหมด"}
                      </button>
                      <button
                        onClick={() => addQ(which)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow hover:bg-indigo-700"
                      >
                        + เพิ่มคำถาม
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 max-w-4xl mx-auto">
                    {questions.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-2xl text-gray-500">
                        <p className="mb-2">ยังไม่มีคำถาม</p>
                        <button
                          onClick={() => addQ(isPre ? "pre" : "post")}
                          className="text-indigo-600 font-medium hover:underline"
                        >
                          คลิกเพื่อเพิ่มข้อแรก
                        </button>
                      </div>
                    )}

                    {questions.map((q, qi) => {
                      const meta = statusMeta(which, qi);
                      const qKey = questionKey(which, qi);
                      const isSaving = !!savingQuestionKeys[qKey];

                      return (
                        <div
                          key={qi}
                          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-gray-800 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                                {qi + 1}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}
                              >
                                {meta.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveQuestion(which, qi)}
                                disabled={!isEditing || isSaving}
                                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSaving ? "กำลังบันทึก..." : "บันทึกข้อนี้"}
                              </button>
                              <button
                                onClick={() => removeQ(which, qi)}
                                className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition"
                              >
                                ลบคำถาม
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                คำถาม
                              </label>
                              <textarea
                                rows={2}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                placeholder="พิมพ์คำถามที่นี่..."
                                value={q.prompt}
                                onChange={(e) =>
                                  updateQ(
                                    isPre ? "pre" : "post",
                                    qi,
                                    "prompt",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="grid md:grid-cols-2 gap-3">
                              {q.choices.map((c, ci) => (
                                <div
                                  key={ci}
                                  className={`flex items-center gap-3 p-2 rounded-xl border ${q.correctIndex === ci ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500" : "border-gray-200"}`}
                                >
                                  <input
                                    type="radio"
                                    name={`${isPre ? "pre" : "post"}-correct-${qi}`}
                                    checked={q.correctIndex === ci}
                                    onChange={() =>
                                      updateQ(which, qi, "correctIndex", ci)
                                    }
                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer ml-2"
                                  />
                                  <input
                                    className="flex-1 bg-transparent text-sm focus:outline-none px-1 py-1"
                                    placeholder={`ตัวเลือกที่ ${ci + 1}`}
                                    value={c}
                                    onChange={(e) =>
                                      updateChoice(
                                        which,
                                        qi,
                                        ci,
                                        e.target.value,
                                      )
                                    }
                                  />
                                  {q.correctIndex === ci && (
                                    <span className="text-emerald-600 text-xs font-bold pr-2">
                                      ✓ ถูก
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                คำอธิบายเพิ่มเติม (ตัวเลือก)
                              </label>
                              <input
                                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="อธิบายเหตุผลของคำตอบที่ถูก"
                                value={q.explanation}
                                onChange={(e) =>
                                  updateQ(
                                    which,
                                    qi,
                                    "explanation",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          {activeTab === "certificate" && (
            <div className="p-6 space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  ตั้งค่าใบรับรอง
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  เปิด/ปิดการออกใบรับรอง และดูตัวอย่างรูปแบบใบรับรองของคอร์ส
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      สถานะการออกใบรับรอง
                    </p>
                    <p className="text-xs text-gray-500">
                      {form.certificateEnabled
                        ? "คอร์สนี้เข้าร่วมการออกใบรับรอง"
                        : "คอร์สนี้ยังไม่เข้าร่วมการออกใบรับรอง"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        certificateEnabled: !prev.certificateEnabled,
                      }))
                    }
                    className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                      form.certificateEnabled
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {form.certificateEnabled
                      ? "ลบ Certificate"
                      : "เพิ่ม Certificate"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  รูปตัวอย่างใบรับรอง
                </p>
                <div
                  ref={certContainerRef}
                  className={`overflow-hidden rounded-2xl border border-indigo-100 bg-white p-1 shadow-sm ${
                    form.certificateEnabled ? "" : "opacity-60"
                  }`}
                >
                  <div
                    className="relative w-full"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <div
                      id="certificate-print"
                      className="absolute top-0 left-0 w-[1120px] aspect-[16/9] bg-[#0b2a5a] p-6 origin-top-left"
                      style={{ transform: `scale(${certScale})` }}
                    >
                      <div className="relative flex flex-col w-full h-full bg-white rounded-3xl border-[18px] border-[#0b2a5a] overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-10 pt-8">
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

                        <div className="absolute top-0 right-16 translate-y-6 hidden md:block">
                          <div className="relative">
                            <div className="w-40 h-40 rounded-full bg-sky-300 flex items-center justify-center">
                              <div className="w-28 h-28 rounded-full bg-[#0b2a5a] flex items-center justify-center">
                                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500 text-4xl font-extrabold text-white">
                                  B
                                </div>
                              </div>
                            </div>
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-14 h-20 bg-[#0b2a5a] rounded-b-3xl" />
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center flex-1 min-h-0 px-16 pb-20 pt-6">
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

                          <div className="text-center mt-6 mb-4">
                            <p className="text-sm text-slate-500 mb-2">
                              มอบให้แก่
                            </p>
                            <p className="text-3xl font-bold text-slate-900">
                              {previewLearnerName}
                            </p>
                          </div>

                          <div className="text-center text-[13px] text-slate-600 space-y-1 mb-6">
                            <p>has successfully completed</p>
                            <p className="font-medium text-slate-800">
                              {previewCourseTitle}
                            </p>
                            <p>an online course offered by BreweryDev</p>
                            <p className="mt-1 font-semibold">
                              {previewIssuedAt}
                            </p>
                          </div>

                          <div className="mt-6 w-full flex justify-between items-end text-xs text-slate-500">
                            <div className="flex flex-col gap-2">
                              <div>
                                <p>วันที่ออกใบประกาศนียบัตร</p>
                                <p className="font-semibold text-slate-800">
                                  {previewIssuedAt}
                                </p>
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
                                CERT-X692-MOF8X1F
                              </p>
                            </div>
                          </div>

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

                          <div className="absolute bottom-2 left-12 w-[55%] text-[9px] text-slate-400">
                            BreweryDev has confirmed the identity of this
                            individual and their participation in the course.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
