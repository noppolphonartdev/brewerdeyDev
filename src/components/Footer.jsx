import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaFacebookF,
  FaMapMarkerAlt,
  FaCode,
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-sky-900/40 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.24)_0%,transparent_45%),radial-gradient(circle_at_90%_100%,rgba(14,165,233,0.18)_0%,transparent_40%),linear-gradient(135deg,#08142f_0%,#0c2246_45%,#113163_100%)] text-slate-200">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:28px_28px]" />

      <div className="relative mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <section>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-sky-300/30 bg-sky-400/10 text-sky-200">
                <FaCheckCircle size={16} />
              </span>
              <p className="text-xl font-extrabold tracking-tight text-white">
                BreweryDev
              </p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-300/90">
              แพลตฟอร์มเรียนออนไลน์สำหรับพัฒนาทักษะสายเทคโนโลยีและงานดิจิทัล
              ด้วยคอร์สที่เน้นการนำไปใช้จริง
            </p>

            <div className="mt-4 inline-flex items-center rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
              Learn. Build. Grow.
            </div>

            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://www.facebook.com/beer.noppol.1999"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="pressable grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10 text-slate-200 transition hover:bg-white/20"
              >
                <FaFacebookF size={14} />
              </a>
              <a
                href="https://noppol-port-dev.vercel.app/"
                target="_blank"
                rel="noreferrer"
                aria-label="portfolio"
                className="pressable grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10 text-slate-200 transition hover:bg-white/20"
              >
                <FaCode size={14} />
              </a>
            </div>
          </section>

          <section>
            <p className="text-sm font-bold text-white">ลิงก์ด่วน</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300/90">
              <li>
                <Link to="/courses" className="pressable hover:text-white">
                  คอร์สทั้งหมด
                </Link>
              </li>
              <li>
                <Link to="/about" className="pressable hover:text-white">
                  เกี่ยวกับเรา
                </Link>
              </li>
              <li>
                <Link to="/contact" className="pressable hover:text-white">
                  ติดต่อ
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <p className="text-sm font-bold text-white">ช่วยเหลือ</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300/90">
              <li>
                <Link to="/contact" className="pressable hover:text-white">
                  คำถามที่พบบ่อย
                </Link>
              </li>
              <li>
                <Link to="/about" className="pressable hover:text-white">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <p className="text-sm font-bold text-white">ติดต่อเรา</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300/90">
              <li className="flex items-start gap-2">
                <FaEnvelope className="mt-0.5 text-sky-300" />
                <a
                  href="mailto:brewerydev.offical@gmail.com"
                  className="pressable hover:text-white"
                >
                  brewerydev.official@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FaMapMarkerAlt className="mt-0.5 text-sky-300" />
                <span>กรุงเทพมหานคร, ประเทศไทย</span>
              </li>
              <li className="flex items-start gap-2">
                <FaClock className="mt-0.5 text-sky-300" />
                <span>จ.-ศ. 9:00 - 18:00 น.</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-300/70">
          © {new Date().getFullYear()} BreweryDev. สงวนลิขสิทธิ์ทั้งหมด
        </div>
      </div>
    </footer>
  );
}

export default Footer;
