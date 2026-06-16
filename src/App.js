import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import "@/App.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/RoleDashboard";
import Leads from "@/pages/Leads";
import Students from "@/pages/Students";
import Courses from "@/pages/Courses";
import Batches from "@/pages/Batches";
import Faculty from "@/pages/Faculty";
import Attendance from "@/pages/Attendance";
import Timetable from "@/pages/Timetable";
import Assignments from "@/pages/Assignments";
import Tests from "@/pages/Tests";
import Practice from "@/pages/Practice";
import QuestionBank from "@/pages/QuestionBank";
import QuestionPapers from "@/pages/QuestionPapers";
import Fees from "@/pages/Fees";
import Communications from "@/pages/Communications";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import OMR from "@/pages/OMR";
import Scholarship from "@/pages/Scholarship";
import Referrals from "@/pages/Referrals";
import Inventory from "@/pages/Inventory";
import ParentPortal from "@/pages/ParentPortal";

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Toaster richColors position="top-right" closeButton />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/students" element={<Students />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/batches" element={<Batches />} />
              <Route path="/faculty" element={<Faculty />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/tests" element={<Tests />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/question-bank" element={<QuestionBank />} />
              <Route path="/question-papers" element={<QuestionPapers />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/communications" element={<Communications />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/omr" element={<OMR />} />
              <Route path="/scholarship" element={<Scholarship />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/parent-portal" element={<ParentPortal />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
