import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "@/pages/Dashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import CounselorDashboard from "@/pages/CounselorDashboard";
import ParentPortal from "@/pages/ParentPortal";

export default function RoleDashboard() {
  const { user } = useAuth();
  const role = user?.role;
  if (role === "student") return <StudentDashboard />;
  if (role === "parent") return <ParentPortal />;
  if (role === "teacher") return <TeacherDashboard />;
  if (role === "counselor") return <CounselorDashboard />;
  return <AdminDashboard />;
}
