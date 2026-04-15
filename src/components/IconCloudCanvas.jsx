// - กระจายไอคอนด้วย Fibonacci Sphere
// - ลากเมาส์เพื่อหมุน / เคลื่อนที่ออโต้เมื่อไม่ลาก
// - คลิกที่ไอคอนเพื่อ "โฟกัส" หมุนไปให้ไอคอนชิ้นนั้นหันมาด้านหน้า (easeOutCubic)
// - รองรับทั้ง ReactNode (react-icons, <svg/…>) และรูป <img URL>
// - รองรับ DPR (จอ Retina จะคมชัด) + Responsive ตามขนาดกล่องห่อ

import { useEffect, useRef, useState } from "react";
import { renderToString } from "react-dom/server";

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * props:
 * - icons?: ReactNode[]      // ส่ง element svg/react-icons
 * - images?: string[]        // หรือส่ง URL รูปไอคอน (อย่างใดอย่างหนึ่งหรือผสมก็ได้)
 * - size?: number            // px ขนาดสั้นสุดของกล่อง (ใช้ทำ fallback ถ้าคำนวณ DOM ไม่ทัน)
 * - className?: string       // tailwind เสริมที่กล่องห่อ
 * - iconBox?: number         // ขนาดกรอบไอคอน (px) ค่าเริ่มต้น 40
 * - autoSpin?: number        // ความเร็วออโต้ (ค่า 0..1 โดยประมาณ) default 1
 * - hoverBoost?: number      // เพิ่มสปีดตามระยะเมาส์จากกึ่งกลาง default 1
 * - pauseOnHover?: boolean   // หยุดออโต้ขณะโฮเวอร์
 */
export default function IconCloudCanvas({
  icons,
  images,
  size = 420,
  className = "",
  iconBox = 40,
  autoSpin = 1,
  hoverBoost = 1,
  pauseOnHover = false,
}) {
  const canvasRef = useRef(null);

  // สถานะหลัก
  const [iconPositions, setIconPositions] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetRotation, setTargetRotation] = useState(null); // {x,y,startX,startY,startTime,duration}
  const rotationRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(0);

  // เก็บ offscreen canvas ของแต่ละไอคอน (วาดเพียงครั้ง)
  const iconCanvasesRef = useRef([]);
  const imagesLoadedRef = useRef([]);

  // ============== เตรียมแปลง ReactNode / Image URL เป็น offscreen canvas ==============
  useEffect(() => {
    const hasItems = (icons && icons.length) || (images && images.length);
    if (!hasItems) return;

    const items = icons && icons.length ? icons : images || [];
    imagesLoadedRef.current = new Array(items.length).fill(false);

    const makeOne = (item, index, isImageUrl) => {
      const off = document.createElement("canvas");
      off.width = iconBox;
      off.height = iconBox;
      const offCtx = off.getContext("2d");

      if (!offCtx) return off;

      if (isImageUrl) {
        // วาดรูป URL ลงกรอบวงกลม (mask)
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = item;
        img.onload = () => {
          offCtx.clearRect(0, 0, off.width, off.height);
          offCtx.save();
          offCtx.beginPath();
          offCtx.arc(
            off.width / 2,
            off.height / 2,
            off.width / 2,
            0,
            Math.PI * 2,
          );
          offCtx.clip();
          offCtx.drawImage(img, 0, 0, off.width, off.height);
          offCtx.restore();
          imagesLoadedRef.current[index] = true;
        };
      } else {
        // แปลง ReactNode (ส่วนใหญ่เป็น SVG) เป็น data URL แล้ววาด
        const svgString = renderToString(item);
        const img = new Image();
        img.src = "data:image/svg+xml;base64," + btoa(svgString);
        img.onload = () => {
          offCtx.clearRect(0, 0, off.width, off.height);
          // scale ภายใน (บาง svg ใหญ่กว่ากรอบ) — ปล่อยให้ svg จัดสัดส่วนเองที่ 0,0
          offCtx.drawImage(img, 0, 0, off.width, off.height);
          imagesLoadedRef.current[index] = true;
        };
      }
      return off;
    };

    iconCanvasesRef.current =
      icons && icons.length
        ? items.map((node, i) => makeOne(node, i, false))
        : items.map((url, i) => makeOne(url, i, true));
  }, [icons, images, iconBox]);

  // ============== สร้างพิกัดเริ่มต้นบนทรงกลมด้วย Fibonacci Sphere ==============
  useEffect(() => {
    const items = (icons && icons.length ? icons : images) || [];
    const num = items.length || 20;
    const list = [];

    const offset = 2 / num;
    const increment = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < num; i++) {
      const y = i * offset - 1 + offset / 2; // -1..1
      const r = Math.sqrt(1 - y * y);
      const phi = i * increment;
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;

      // คูณ 100 ให้เป็น world units (px-ish)
      list.push({
        x: x * 100,
        y: y * 100,
        z: z * 100,
        id: i,
      });
    }
    setIconPositions(list);
  }, [icons, images]);

  // ============== จัดการขนาด Canvas ให้คมชัด (DPR) + Responsive ==============
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const rect = canvas.parentElement?.getBoundingClientRect();
      const cssW = Math.floor(rect?.width || size);
      const cssH = Math.floor(rect?.height || size);

      // กำหนดให้เป็นสี่เหลี่ยมจัตุรัสโดยยึดด้านสั้นสุด
      const s = Math.min(cssW, cssH);

      canvas.style.width = `${s}px`;
      canvas.style.height = `${s}px`;
      canvas.width = Math.floor(s * dpr);
      canvas.height = Math.floor(s * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale หน่วยกลับเป็น px
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement || canvas);

    return () => ro.disconnect();
  }, [size]);

  // ============== อินพุตเมาส์ ==============
  const onMouseDown = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });

    // ตรวจชนเพื่อ "โฟกัส" ไอคอน
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    iconPositions.forEach((icon) => {
      const { cos, sin } = Math;
      const cosX = cos(rotationRef.current.x);
      const sinX = sin(rotationRef.current.x);
      const cosY = cos(rotationRef.current.y);
      const sinY = sin(rotationRef.current.y);

      const rx = icon.x * cosY - icon.z * sinY;
      const rz = icon.x * sinY + icon.z * cosY;
      const ry = icon.y * cosX + rz * sinX;

      const screenX = canvasRef.current.clientWidth / 2 + rx;
      const screenY = canvasRef.current.clientHeight / 2 + ry;

      const scale = (rz + 200) / 300;
      const radius = (iconBox / 2) * scale;
      const dx = localX - screenX;
      const dy = localY - screenY;
      if (dx * dx + dy * dy < radius * radius) {
        // หมุนให้ชิ้นนี้มาด้านหน้า
        const targetX = -Math.atan2(
          icon.y,
          Math.sqrt(icon.x * icon.x + icon.z * icon.z),
        );
        const targetY = Math.atan2(icon.x, icon.z);
        const curX = rotationRef.current.x;
        const curY = rotationRef.current.y;
        const dist = Math.hypot(targetX - curX, targetY - curY);
        const duration = Math.min(2000, Math.max(800, dist * 1000));
        setTargetRotation({
          x: targetX,
          y: targetY,
          startX: curX,
          startY: curY,
          startTime: performance.now(),
          duration,
        });
      }
    });
  };

  const onMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (isDragging) {
      rotationRef.current = {
        x: rotationRef.current.x + (e.clientY - lastMousePos.y) * 0.002,
        y: rotationRef.current.y + (e.clientX - lastMousePos.x) * 0.002,
      };
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const onMouseUp = () => setIsDragging(false);

  // ============== แอนิเมชัน ==============
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let running = true;

    const loop = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      const centerX = canvas.clientWidth / 2;
      const centerY = canvas.clientHeight / 2;

      // ความเร็วออโต้ขึ้นกับระยะเมาส์จากศูนย์กลาง (เหมือนต้นฉบับ)
      const dx = mousePos.x - centerX;
      const dy = mousePos.y - centerY;
      const maxDist = Math.hypot(centerX, centerY);
      const dist = Math.hypot(dx, dy);
      const base = 0.0025 * autoSpin;
      const speed = base + (dist / maxDist) * 0.008 * hoverBoost;

      // ease ไปยัง targetRotation เมื่อไม่ลาก
      if (targetRotation) {
        const elapsed = performance.now() - targetRotation.startTime;
        const p = Math.min(1, elapsed / targetRotation.duration);
        const e = easeOutCubic(p);
        rotationRef.current = {
          x:
            targetRotation.startX +
            (targetRotation.x - targetRotation.startX) * e,
          y:
            targetRotation.startY +
            (targetRotation.y - targetRotation.startY) * e,
        };
        if (p >= 1) setTargetRotation(null);
      } else if (!isDragging && !(pauseOnHover && dist < 1)) {
        rotationRef.current = {
          x: rotationRef.current.x + (dy / canvas.clientHeight) * speed,
          y: rotationRef.current.y + (dx / canvas.clientWidth) * speed,
        };
      }

      // วาดแต่ละชิ้น
      iconPositions.forEach((icon, index) => {
        const { cos, sin } = Math;
        const cosX = cos(rotationRef.current.x);
        const sinX = sin(rotationRef.current.x);
        const cosY = cos(rotationRef.current.y);
        const sinY = sin(rotationRef.current.y);

        const rx = icon.x * cosY - icon.z * sinY;
        const rz = icon.x * sinY + icon.z * cosY;
        const ry = icon.y * cosX + rz * sinX;

        const scale = (rz + 200) / 300; // 0..?
        const opacity = Math.max(0.2, Math.min(1, (rz + 150) / 200));

        ctx.save();
        ctx.translate(centerX + rx, centerY + ry);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;

        const img = iconCanvasesRef.current[index];
        if (img && imagesLoadedRef.current[index]) {
          ctx.drawImage(img, -iconBox / 2, -iconBox / 2, iconBox, iconBox);
        } else {
          // fallback: วงกลมมีเลข
          ctx.beginPath();
          ctx.arc(0, 0, iconBox / 2, 0, Math.PI * 2);
          ctx.fillStyle = "#4444ff";
          ctx.fill();
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `${Math.floor(iconBox * 0.4)}px system-ui`;
          ctx.fillText(String((index % 99) + 1), 0, 0);
        }

        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      running = false;
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    iconPositions,
    isDragging,
    mousePos,
    targetRotation,
    iconBox,
    autoSpin,
    hoverBoost,
    pauseOnHover,
  ]);

  return (
    <div className={`relative ${className}`}>
      {/* กล่องห่อ: ทำให้ responsive ได้ด้วย Tailwind เช่น w-full aspect-square md:w-[480px] */}
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="rounded-full bg-transparent select-none"
        role="img"
        aria-label="Interactive 3D Icon Cloud"
      />
    </div>
  );
}
