import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/useAuth";
import toast from "react-hot-toast";
import { FiCreditCard, FiImage, FiSmartphone } from "react-icons/fi";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const UNVERIFIED_EMAIL_PURCHASE_MESSAGE =
  "อีเมลนี้ยังไม่ได้ยืนยันที่อยู่อีเมล ไม่สามารถทำการสั่งซื้อได้ โปรดลองใหม่อีกครั้ง";

function CheckoutPage() {
  const { id } = useParams(); // id ของคอร์ส
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState("");
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`);
        setCourse(res.data);
      } catch (err) {
        console.error("Error fetching course:", err);
        toast.error("ไม่สามารถโหลดข้อมูลคอร์สได้");
      }
    };
    fetchCourse();
  }, [id]);

  useEffect(() => {
    return () => {
      if (slipPreviewUrl) {
        URL.revokeObjectURL(slipPreviewUrl);
      }
    };
  }, [slipPreviewUrl]);

  const ensureLoggedIn = () => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ");
      navigate("/login");
      return false;
    }

    if (!user.verified) {
      setUploadError(UNVERIFIED_EMAIL_PURCHASE_MESSAGE);
      toast.error(UNVERIFIED_EMAIL_PURCHASE_MESSAGE);
      return false;
    }

    return true;
  };

  const createPendingOrder = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "http://localhost:5000/api/orders",
      { courseId: id },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data;
  };

  const validateSlipFile = (file) => {
    if (!file) return "กรุณาเลือกสลิปการโอนเงิน";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return "รองรับไฟล์ JPG, PNG, WEBP เท่านั้น";
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return "ขนาดไฟล์ต้องไม่เกิน 5MB";
    }

    return "";
  };

  const handlePickSlip = (file) => {
    const message = validateSlipFile(file);
    if (message) {
      setUploadError(message);
      setSlipFile(null);
      setSlipPreviewUrl("");
      return;
    }
    setUploadError("");
    setSlipFile(file);
    setSlipPreviewUrl(URL.createObjectURL(file));
  };

  const handleTransferSubmit = async () => {
    if (!ensureLoggedIn()) return;

    const message = validateSlipFile(slipFile);
    if (message) {
      setUploadError(message);
      return;
    }

    let createdOrder = null;
    setIsLoading(true);
    setUploadError("");

    try {
      createdOrder = await createPendingOrder();

      const fd = new FormData();
      fd.append("image", slipFile);

      const up = await axios.post("http://localhost:5000/api/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const slipUrl = up.data?.imageUrl;
      if (!slipUrl) {
        throw new Error("ไม่สามารถอัปโหลดสลิปได้");
      }

      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/orders/${createdOrder._id}/upload-slip`,
        {
          slipUrl,
          slipNote: "ชำระผ่านหน้า Checkout",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("ส่งข้อมูลโอนเงินและแนบสลิปเรียบร้อยแล้ว");
      navigate("/my-orders");
    } catch (err) {
      const messageFromServer =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "เกิดข้อผิดพลาดในการชำระเงิน";

      if (createdOrder?._id) {
        toast.error(
          "สร้างคำสั่งซื้อแล้ว แต่แนบสลิปไม่สำเร็จ กรุณาแนบสลิปในหน้า คอร์สของฉัน",
        );
        navigate("/my-orders");
      } else {
        setUploadError(messageFromServer);
        toast.error(messageFromServer);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setUploadError("");

    if (method === "transfer") {
      setShowTransferForm(true);
      return;
    }

    setShowTransferForm(false);
  };

  if (!course) {
    return (
      <div className="relative px-4 py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_16%_14%,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_86%_10%,rgba(14,165,233,0.14),transparent_34%)]" />
        <div className="ui-surface relative mx-auto w-full max-w-2xl border-slate-200 bg-white p-6 sm:p-8">
          <div className="space-y-3">
            <div className="skeleton-shimmer h-6 w-1/2 rounded" />
            <div className="skeleton-shimmer h-3 w-3/4 rounded" />
            <div className="skeleton-shimmer h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_14%_14%,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_88%_10%,rgba(14,165,233,0.14),transparent_34%)]" />
      <div className="ui-surface reveal-up relative mx-auto w-full max-w-2xl overflow-hidden border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_60%,#eef6ff_100%)] p-6 sm:p-8">
        <div className="lift-card mb-5 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
          <img
            src={
              course.image
                ? resolveMediaUrl(course.image)
                : "https://placehold.co/120x80"
            }
            alt={course.title}
            className="h-20 w-32 rounded-xl object-cover"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              คอร์สที่กำลังสั่งซื้อ
            </p>
            <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
              {course.title}
            </h2>
            <p className="ui-muted text-sm">โดย {course.instructor}</p>
          </div>
        </div>

        {!showTransferForm ? (
          <>
            <h1 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">
              เลือกช่องทางชำระเงิน
            </h1>
            <p className="mt-2 text-center text-3xl font-extrabold text-blue-600">
              ฿{Number(course.price || 0).toLocaleString()}
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                มีโค้ดส่วนลด?
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="ใส่โค้ดส่วนลด"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => toast("ระบบโค้ดส่วนลดจะเปิดใช้งานเร็ว ๆ นี้")}
                  className="rounded-xl bg-blue-300 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                >
                  ใช้โค้ด
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() =>
                  toast("ระบบบัตรเครดิต / เดบิต จะเปิดใช้งานเร็ว ๆ นี้")
                }
                className="flex w-full cursor-not-allowed items-center gap-4 rounded-2xl border border-slate-200 bg-slate-100/80 p-4 text-left opacity-80"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white">
                  <FiCreditCard size={22} />
                </span>
                <span>
                  <span className="block text-2xl font-bold tracking-tight text-slate-900">
                    บัตรเครดิต / เดบิต
                  </span>
                  <span className="ui-muted text-sm">
                    Visa, Mastercard ผ่าน Stripe (เร็ว ๆ นี้)
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentMethodChange("transfer")}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                  paymentMethod === "transfer"
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-emerald-200"
                }`}
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-white">
                  <FiSmartphone size={22} />
                </span>
                <span>
                  <span className="block text-2xl font-bold tracking-tight text-slate-900">
                    โอนเงิน / PromptPay
                  </span>
                  <span className="ui-muted text-sm">
                    โอนแล้วแนบสลิป ตรวจสอบอัตโนมัติ
                  </span>
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-5 w-full text-center text-xl font-semibold text-slate-400 transition hover:text-slate-600"
            >
              ยกเลิก
            </button>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              โอนเงินและแนบสลิป
            </h1>
            <p className="mt-2 text-3xl font-extrabold text-blue-600">
              ยอดชำระ: ฿{Number(course.price || 0).toLocaleString()}
            </p>

            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xl font-semibold text-emerald-700">
                ข้อมูลสำหรับโอนเงิน
              </p>
              <div className="mt-4 grid grid-cols-[130px_1fr] gap-y-2 text-xl text-slate-700">
                <span className="text-slate-500">ธนาคาร</span>
                <span className="font-semibold text-slate-900">
                  กสิกรไทย (KBank)
                </span>
                <span className="text-slate-500">เลขบัญชี</span>
                <span className="font-extrabold tracking-wide text-slate-900">
                  030-3-342-044
                </span>
                <span className="text-slate-500">ชื่อบัญชี</span>
                <span className="font-semibold text-slate-900">
                  นาย นพพล พลอาจ
                </span>
                <span className="text-slate-500">จำนวนเงิน</span>
                <span className="text-4xl font-extrabold text-emerald-600">
                  ฿{Number(course.price || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-3xl font-extrabold text-slate-900">
                แนบสลิปการโอนเงิน
              </h2>

              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
                className="mt-3 grid min-h-[220px] cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-300 hover:bg-blue-50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handlePickSlip(e.target.files?.[0])}
                />

                {slipFile ? (
                  <div className="w-full max-w-md">
                    <img
                      src={slipPreviewUrl}
                      alt="slip-preview"
                      className="mx-auto max-h-56 w-full rounded-xl border border-slate-200 object-contain bg-white"
                    />
                    <p className="text-lg font-semibold text-slate-800">
                      เลือกไฟล์แล้ว
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {slipFile.name}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      คลิกเพื่อเปลี่ยนไฟล์
                    </p>
                  </div>
                ) : (
                  <div>
                    <FiImage className="mx-auto text-5xl text-slate-400" />
                    <p className="mt-3 text-lg font-semibold text-slate-700">
                      คลิกเพื่อเลือกรูปสลิป
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      JPG, PNG, WEBP (ไม่เกิน 5MB)
                    </p>
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {uploadError}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleTransferSubmit}
                disabled={isLoading}
                className="pressable flex-1 rounded-xl bg-slate-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isLoading ? (
                  <div className="mx-auto h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                ) : (
                  "ตรวจสอบและชำระเงิน"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTransferForm(false);
                  setPaymentMethod("");
                  setSlipFile(null);
                  setSlipPreviewUrl("");
                  setUploadError("");
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                กลับ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CheckoutPage;
