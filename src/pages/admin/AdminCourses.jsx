import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { resolveMediaUrl } from "../../utils/mediaUrl";

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created"); // created | priceAsc | priceDesc | title
  const [deletingCourseId, setDeletingCourseId] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    course: null,
  });
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  // ---------------- Fetch ----------------
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/courses");
      setCourses(res.data || []);
    } catch (e) {
      console.error(e);
      alert("โหลดคอร์สไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    navigate("/admin/courses/new");
  };

  const openEdit = (c) => {
    navigate(`/admin/courses/edit/${c._id}`);
  };

  const openDeleteConfirm = (course) => {
    if (!course?._id || deletingCourseId) return;
    setDeleteModal({ open: true, course });
  };

  const closeDeleteConfirm = () => {
    if (deletingCourseId) return;
    setDeleteModal({ open: false, course: null });
  };

  // ---------------- Delete ----------------
  const onDelete = async () => {
    const id = deleteModal.course?._id;
    if (!id) return;

    setDeletingCourseId(id);
    try {
      await axios.delete(`http://localhost:5000/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses((prev) => prev.filter((c) => c._id !== id));
      setDeleteModal({ open: false, course: null });
    } catch (e) {
      console.error(e);
      alert("ลบไม่สำเร็จ");
    } finally {
      setDeletingCourseId((current) => (current === id ? "" : current));
    }
  };

  // ---------------- Derived (search/sort) ----------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = !q
      ? [...courses]
      : courses.filter((c) =>
          [c.title, c.instructor, c.description].some((t) =>
            (t || "").toLowerCase().includes(q),
          ),
        );
    switch (sortBy) {
      case "priceAsc":
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "priceDesc":
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "title":
        list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      default:
        break; // created: คงลำดับเดิมจากเซิร์ฟเวอร์
    }
    return list;
  }, [courses, search, sortBy]);

  return (
    <DashboardLayout title="Manage Courses">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-3 sm:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา: ชื่อคอร์ส / ผู้สอน / รายละเอียด"
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="created">เรียง: ล่าสุด</option>
            <option value="title">เรียง: ชื่อ (A→Z)</option>
            <option value="priceAsc">เรียง: ราคา (น้อย→มาก)</option>
            <option value="priceDesc">เรียง: ราคา (มาก→น้อย)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">
            ทั้งหมด {filtered.length} คอร์ส
          </p>
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
          >
            + เพิ่มคอร์ส
          </button>
        </div>
      </div>

      {/* Grid */}
      <section className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full rounded-2xl bg-white p-6 text-sm shadow-sm">
            กำลังโหลด...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white p-6 text-sm shadow-sm">
            ไม่พบคอร์ส
          </div>
        ) : (
          filtered.map((c) => (
            <article
              key={c._id}
              className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative">
                <img
                  src={
                    c.image
                      ? resolveMediaUrl(c.image)
                      : "https://placehold.co/600x360"
                  }
                  alt={c.title}
                  className="h-40 w-full bg-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="line-clamp-2 text-base font-semibold">
                  {c.title}
                </h3>
                <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-gray-600">
                  {c.description}
                </p>
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">ผู้สอน</p>
                      <p className="text-sm font-medium">
                        {c.instructor || "-"}
                      </p>
                    </div>
                    <p className="text-lg font-semibold">
                      {(c.price || 0).toLocaleString()} ฿
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="flex-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(c)}
                      disabled={!!deletingCourseId}
                      className="flex-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingCourseId === c._id ? "กำลังลบ..." : "ลบ"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-indigo-100">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">
                Confirm Delete
              </p>
              <h3 className="mt-1 text-base font-semibold">ยืนยันการลบคอร์ส</h3>
            </div>

            <div className="space-y-4 px-5 py-4">
              <p className="text-sm text-gray-700">
                คุณกำลังจะลบคอร์สนี้ การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>

              <div className="rounded-xl border border-red-100 bg-red-50/70 p-3 text-xs text-red-700">
                <p className="font-semibold text-red-800">
                  ชื่อคอร์ส: {deleteModal.course?.title || "-"}
                </p>
                <p className="mt-1">
                  ผู้สอน: {deleteModal.course?.instructor || "-"}
                </p>
                <p className="mt-1">
                  ราคา: {(deleteModal.course?.price || 0).toLocaleString()} ฿
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={closeDeleteConfirm}
                  disabled={!!deletingCourseId}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={onDelete}
                  disabled={!!deletingCourseId}
                  className="rounded-lg bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingCourseId ? "กำลังลบ..." : "ยืนยันการลบ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminCourses;
