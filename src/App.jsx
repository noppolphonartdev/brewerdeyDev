import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { isUserLoggedIn, isAdminLoggedIn } from "./utils/auth";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

// pages user
import HomePage from "./pages/user/HomePage";
import CoursesPage from "./pages/user/CoursesPage";
import CourseDetail from "./pages/user/CourseDetail";
import VideoPlayerPage from "./pages/user/VideoPlayerPage";
import CheckoutPage from "./pages/user/CheckoutPage";
import AboutPage from "./pages/user/AboutPage";
import ContactPage from "./pages/user/ContactPage";
import MyOrders from "./pages/user/MyOrders";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import ForgotPassword from "./pages/user/ForgotPassword";
import ResetPassword from "./pages/user/ResetPassword";
import EmailVerify from "./pages/user/EmailVerify";
import VerifyPending from "./pages/user/VerifyPending";
import AccountSetting from "./pages/user/AccountSetting";
import CertificatePage from "./pages/user/CertificatePage";
import MyKnowledgeLibrary from "./pages/user/MyKnowledgeLibrary";

// pages admin
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseEditor from "./pages/admin/AdminCourseEditor";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminOrders from "./pages/admin/AdminOrders";

// components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRouter() {
  //ซ่อน nav ใน admin
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Toaster position="top-center" reverseOrder={false} />
      {/*เรียกใช้ components */}
      {!isAdminPage && (
        <div className="print:hidden">
          <Navbar />
        </div>
      )}
      <main className={`flex-1 ${!isAdminPage ? "pt-[68px]" : ""}`}>
        <Routes>
          {/*เรีกใช้ pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route
            path="/course/:id/video/:sectionIndex/:lessonIndex"
            element={<VideoPlayerPage />}
          />
          <Route path="/checkout/:id" element={<CheckoutPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify/:token" element={<EmailVerify />} />
          <Route path="/verify-pending" element={<VerifyPending />} />
          <Route path="/certificate/:courseId" element={<CertificatePage />} />
          <Route
            path="/my-orders"
            element={isUserLoggedIn() ? <MyOrders /> : <Navigate to="/login" />}
          />
          <Route
            path="/account"
            element={
              isUserLoggedIn() ? <AccountSetting /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/my-library"
            element={
              isUserLoggedIn() ? (
                <MyKnowledgeLibrary />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* --- admin --- */}
          {/* ถ้าเข้ามาที่ /admin ให้ redirect ไป /admin/dashboard */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          {/* ป้องกันเข้าหน้าแอดมินทุกหน้า */}
          <Route
            path="/admin/dashboard"
            element={
              isAdminLoggedIn() ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route
            path="/admin/courses"
            element={
              isAdminLoggedIn() ? (
                <AdminCourses />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route
            path="/admin/courses/new"
            element={
              isAdminLoggedIn() ? (
                <AdminCourseEditor />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route
            path="/admin/courses/edit/:id"
            element={
              isAdminLoggedIn() ? (
                <AdminCourseEditor />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route
            path="/admin/members"
            element={
              isAdminLoggedIn() ? (
                <AdminMembers />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route
            path="/admin/orders"
            element={
              isAdminLoggedIn() ? (
                <AdminOrders />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminPage && (
        <div className="print:hidden">
          <Footer />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </Router>
  );
}

export default App;
