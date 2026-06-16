import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, Section } from "@/components/PageHeader";

export default function StudentProfile() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (user?.role === "student") {
      api.get("/students").then(r => {
        const found = user.student_id ? r.data.find(s => s.id === user.student_id) : r.data[0];
        setMe(found);
      });
      api.get("/batches").then(r => setBatches(r.data));
      api.get("/courses").then(r => setCourses(r.data));
    }
  }, [user]);

  if (!me) return <div className="p-8 text-slate-500">Loading profile...</div>;

  const batchName = batches.find(b => b.id === me.batch_id)?.name || "—";
  const courseName = courses.find(c => c.id === me.course_id)?.name || "—";

  return (
    <div data-testid="student-profile-page">
      <PageHeader eyebrow="Account" title="My Profile" subtitle="Your personal and academic details" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Personal Information">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</div>
              <div className="text-sm font-medium mt-1 text-slate-900">{me.name}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</div>
              <div className="text-sm font-medium mt-1 text-slate-900">{me.email}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Phone Number</div>
              <div className="text-sm font-medium mt-1 text-slate-900">{me.phone || "—"}</div>
            </div>
          </div>
        </Section>
        
        <Section title="Academic Information">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Roll Number</div>
              <div className="text-sm font-medium mt-1 text-slate-900">{me.roll_no || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Course</div>
              <div className="text-sm font-medium mt-1 text-slate-900">{courseName}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Batch</div>
              <div className="text-sm font-medium mt-1 text-slate-900">{batchName}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</div>
              <div className="text-sm font-medium mt-1"><span className="pill pill-green px-2 py-0.5">{me.status || "Active"}</span></div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
