import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

const emptyForm = {
  name: "",
  lastname: "",
  email: "",
};

const parsePageParam = (rawPage) => {
  const parsed = Number.parseInt(String(rawPage || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parsePageParam(searchParams.get("page"));
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const previousSearchRef = useRef("");

  // ====== Modal: ดูคะแนนสมาชิก ======
  const [scoreOpen, setScoreOpen] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [scoreUser, setScoreUser] = useState(null);
  const [scoreCourses, setScoreCourses] = useState([]);

  const itemsPerPage = 10;
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  const updatePageInUrl = useCallback(
    (nextPage, { replace = false } = {}) => {
      const safePage = Math.max(1, parsePageParam(nextPage));
      setSearchParams(
        (prevParams) => {
          const nextParams = new URLSearchParams(prevParams);
          nextParams.set("page", String(safePage));
          return nextParams;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/admin/members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data || []);
    } catch {
      alert("Session หมดอายุ หรือไม่มีสิทธิ์เข้าถึง");
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter((member) => {
      const name =
        `${member?.name || ""} ${member?.lastname || ""}`.toLowerCase();
      const email = (member?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [members, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageData = filtered.slice(pageStart, pageStart + itemsPerPage);

  useEffect(() => {
    if (!searchParams.get("page")) {
      updatePageInUrl(currentPage, { replace: true });
    }
  }, [searchParams, currentPage, updatePageInUrl]);

  useEffect(() => {
    if (loading) return;

    if (currentPage > totalPages) {
      updatePageInUrl(totalPages, { replace: true });
    }
  }, [loading, currentPage, totalPages, updatePageInUrl]);

  const editingMember = useMemo(
    () => members.find((m) => m._id === editingId) || null,
    [members, editingId],
  );

  useEffect(() => {
    if (previousSearchRef.current === search) return;
    previousSearchRef.current = search;
    updatePageInUrl(1, { replace: true });
  }, [search, updatePageInUrl]);

  const startEdit = (member) => {
    setEditingId(member._id);
    setForm({
      name: member?.name || "",
      lastname: member?.lastname || "",
      email: member?.email || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        lastname: form.lastname,
      };
      const res = await axios.put(
        `http://localhost:5000/api/admin/members/${editingId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMembers((prev) =>
        prev.map((member) => (member._id === editingId ? res.data : member)),
      );
      cancelEdit();
    } catch (err) {
      alert(err?.response?.data?.message || "อัปเดตข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!editingMember?._id || editingMember?.verified) return;
    try {
      setResendingVerification(true);
      const res = await axios.post(
        `http://localhost:5000/api/auth/admin/resend-verification/${editingMember._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert(res?.data?.message || "ส่งอีเมลยืนยันอีกครั้งเรียบร้อยแล้ว");
    } catch (err) {
      alert(err?.response?.data?.message || "ส่งอีเมลยืนยันไม่สำเร็จ");
    } finally {
      setResendingVerification(false);
    }
  };

  const openScores = async (member) => {
    try {
      setScoreOpen(true);
      setScoreLoading(true);
      setScoreError("");
      setScoreUser(null);
      setScoreCourses([]);

      const res = await axios.get(
        `http://localhost:5000/api/admin/members/${member._id}/quiz-stats`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setScoreUser(res.data?.user || member);
      setScoreCourses(res.data?.courses || []);
    } catch (err) {
      setScoreError(
        err?.response?.data?.message ||
          "โหลดคะแนนไม่สำเร็จ (ตรวจสอบสิทธิ์/Session)",
      );
    } finally {
      setScoreLoading(false);
    }
  };

  const closeScores = () => {
    setScoreOpen(false);
    setScoreError("");
    setScoreUser(null);
    setScoreCourses([]);
  };

  useEffect(() => {
    if (!editingId) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        cancelEdit();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingId]);

  return (
    <DashboardLayout title="Member">
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา: ชื่อ / อีเมล"
            className="w-full rounded-xl border bg-white px-3 py-2 pr-8 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M20 20l-3-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <button
          onClick={fetchMembers}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm text-white hover:brightness-95"
        >
          โหลดข้อมูลอีกครั้ง
        </button>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="max-h-auto overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">ชื่อสมาชิก</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3">ยืนยันแล้ว</th>
                <th className="px-4 py-3">คะแนน</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6" colSpan={5}>
                    กำลังโหลด...
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={5}>
                    ไม่พบข้อมูลตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                pageData.map((member) => (
                  <tr key={member._id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {member.name} {member.lastname}
                      </p>
                    </td>
                    <td className="px-4 py-3">{member.email}</td>
                    <td className="px-4 py-3">
                      {member.verified ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          ยืนยันแล้ว
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
                          ยังไม่ยืนยัน
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openScores(member)}
                        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50"
                      >
                        ดูคะแนน
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(member)}
                        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50"
                      >
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <p>
            หน้า <span className="font-medium">{currentPage}</span> /{" "}
            {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => updatePageInUrl(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() =>
                updatePageInUrl(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </section>

      {editingId && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-3 md:items-center"
          onClick={cancelEdit}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
              <div>
                <p className="text-xs font-semibold tracking-widest text-indigo-600">
                  EDIT MEMBER
                </p>
                <h3 className="mt-1 text-base font-semibold text-gray-900">
                  แก้ไขข้อมูลสมาชิก
                </h3>
                {editingMember?.email && (
                  <p className="text-xs text-gray-500">{editingMember.email}</p>
                )}
              </div>
              <button
                onClick={cancelEdit}
                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                ปิด
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-auto p-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">ชื่อ</label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">นามสกุล</label>
                  <input
                    value={form.lastname}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lastname: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">อีเมล</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="mt-1 w-full cursor-not-allowed rounded-lg border bg-gray-100 px-3 py-2 text-sm text-gray-500"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-xs text-gray-500">
                    สถานะยืนยันอีเมล
                  </label>
                  <div className="mt-2">
                    {editingMember?.verified ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        ยืนยันแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                        ยังไม่ยืนยัน
                      </span>
                    )}

                    {!editingMember?.verified && (
                      <button
                        onClick={handleResendVerification}
                        disabled={resendingVerification}
                        className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resendingVerification
                          ? "กำลังส่งอีเมล..."
                          : "ส่งอีเมลยืนยันอีกครั้ง"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: คะแนนสมาชิก */}
      {scoreOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-3 md:items-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-xs font-semibold tracking-widest text-indigo-600">
                  MEMBER SCORES
                </p>
                <h3 className="text-base font-semibold text-gray-900">
                  {scoreUser
                    ? `${scoreUser.name || ""} ${scoreUser.lastname || ""}`
                    : "กำลังโหลด..."}
                </h3>
                {scoreUser?.email && (
                  <p className="text-xs text-gray-500">{scoreUser.email}</p>
                )}
              </div>
              <button
                onClick={closeScores}
                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                ปิด
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-4">
              {scoreLoading ? (
                <p className="text-sm text-gray-600">กำลังโหลดคะแนน...</p>
              ) : scoreError ? (
                <p className="text-sm text-red-600">{scoreError}</p>
              ) : scoreCourses.length === 0 ? (
                <div className="rounded-xl border bg-gray-50 p-4">
                  <p className="text-sm text-gray-700">
                    ยังไม่มีข้อมูลการทำแบบทดสอบของสมาชิกคนนี้
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scoreCourses.map((c) => (
                    <div
                      key={c.courseId}
                      className="rounded-2xl border bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {c.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            อัปเดตล่าสุด:{" "}
                            {c.updatedAt
                              ? new Date(c.updatedAt).toLocaleString()
                              : "-"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">
                            แบบทดสอบก่อนเรียน
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                            แบบทดสอบหลังเรียน
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border bg-indigo-50/40 p-3">
                          <p className="text-xs font-semibold text-indigo-700">
                            แบบทดสอบก่อนเรียน
                          </p>
                          {c.pre ? (
                            <ul className="mt-2 space-y-1 text-sm text-gray-800">
                              <li>
                                ครั้งที่ทำ:{" "}
                                <span className="font-medium">
                                  {c.pre.attemptCount}
                                </span>
                              </li>
                              <li>
                                คะแนนสูงสุด:{" "}
                                <span className="font-medium">
                                  {c.pre.bestScore}/{c.pre.total}
                                </span>
                              </li>
                              <li>
                                คะแนนล่าสุด:{" "}
                                <span className="font-medium">
                                  {c.pre.lastScore}/{c.pre.total}
                                </span>
                              </li>
                              <li>
                                สถานะ:{" "}
                                {c.pre.passed ? (
                                  <span className="font-medium text-emerald-700">
                                    ผ่าน
                                  </span>
                                ) : (
                                  <span className="font-medium text-amber-700">
                                    ยังไม่ผ่าน
                                  </span>
                                )}
                              </li>
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm text-gray-600">
                              ยังไม่ได้ทำ
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl border bg-emerald-50/40 p-3">
                          <p className="text-xs font-semibold text-emerald-700">
                            แบบทดสอบหลังเรียน
                          </p>
                          {c.post ? (
                            <ul className="mt-2 space-y-1 text-sm text-gray-800">
                              <li>
                                ครั้งที่ทำ:{" "}
                                <span className="font-medium">
                                  {c.post.attemptCount}
                                </span>
                              </li>
                              <li>
                                คะแนนสูงสุด:{" "}
                                <span className="font-medium">
                                  {c.post.bestScore}/{c.post.total}
                                </span>
                              </li>
                              <li>
                                คะแนนล่าสุด:{" "}
                                <span className="font-medium">
                                  {c.post.lastScore}/{c.post.total}
                                </span>
                              </li>
                              <li>
                                สถานะ:{" "}
                                {c.post.passed ? (
                                  <span className="font-medium text-emerald-700">
                                    ผ่าน
                                  </span>
                                ) : (
                                  <span className="font-medium text-amber-700">
                                    ยังไม่ผ่าน
                                  </span>
                                )}
                              </li>
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm text-gray-600">
                              ยังไม่ได้ทำ
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
