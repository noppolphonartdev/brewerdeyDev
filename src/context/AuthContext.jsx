import React, { useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContextValue";

// Utility function สำหรับอ่านข้อมูลจาก localStorage
const getUserFromLocalStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getUserFromLocalStorage());

  // จำนวนแจ้งเตือนที่ยังไม่อ่าน (โชว์บน bell)
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);

  const login = (loginResponseData) => {
    localStorage.setItem("user", JSON.stringify(loginResponseData));
    localStorage.setItem("token", loginResponseData.token);
    setUser(loginResponseData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setUnreadNotiCount(0);
  };

  const updateUser = (newUserData) => {
    localStorage.setItem("user", JSON.stringify(newUserData));
    setUser(newUserData);
  };

  // ดึง unread-count จาก backend เพื่อให้ badge อัปเดต/หาย
  const fetchUnreadNotiCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUnreadNotiCount(0);
        return;
      }

      const res = await axios.get(
        "http://localhost:5000/api/notifications/unread-count",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setUnreadNotiCount(res.data?.count ?? 0);
    } catch (err) {
      // ไม่ต้อง alert กัน UX พัง แค่ log พอ
      console.error("fetchUnreadNotiCount error:", err);
    }
  };

  // ตอน user login แล้ว ให้โหลด count ทันที + polling เบาๆ กันค้าง
  useEffect(() => {
    if (!user) return;

    fetchUnreadNotiCount();
    const t = setInterval(() => {
      fetchUnreadNotiCount();
    }, 15000);

    return () => clearInterval(t);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,

        // noti
        unreadNotiCount,
        fetchUnreadNotiCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
