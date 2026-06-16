import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, KpiCard, Section } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Users, ClipboardList, CalendarCheck, BookCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    api.get("/batches").then(r => setBatches(r.data));
    api.get("/students").then(r => setStudents(r.data));
    api.get("/assignments").then(r => setAssignments(r.data));
    api.get("/tests").then(r => setTests(r.data));
    api.get("/timetable").then(r => setSlots(r.data));
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase().slice(0, 3);
  const todaySlots = slots.filter(s => s.day === today);

  return (
    <div data-testid="teacher-dashboard">
      <PageHeader
        eyebrow={`Hi, ${user?.name?.split(" ")[0] || "Teacher"}`}
        title="Today's classes & students"
        subtitle="Mark attendance, post assignments and evaluate tests."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="My batches" value={batches.length} accent="blue"/>
        <KpiCard label="Students" value={students.length} accent="slate"/>
        <KpiCard label="Today's classes" value={todaySlots.length} accent="emerald"/>
        <KpiCard label="Pending tests" value={tests.length} accent="amber"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Today's schedule" action={<Link to="/timetable" className="text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-slate-950">Full timetable →</Link>}>
          <div className="space-y-2">
            {todaySlots.map(s => (
              <div key={s.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="text-sm font-semibold">{s.subject}</div>
                  <div className="text-xs text-slate-500">{batches.find(b=>b.id===s.batch_id)?.name || "—"} · {s.classroom}</div>
                </div>
                <span className="pill pill-blue font-mono">{s.start_time}–{s.end_time}</span>
              </div>
            ))}
            {todaySlots.length === 0 && <div className="empty-state text-sm text-slate-500 text-center py-6">Nothing scheduled today</div>}
          </div>
        </Section>

        <Section title="My batches">
          <div className="space-y-2">
            {batches.slice(0, 6).map(b => (
              <Link key={b.id} to="/attendance" className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 hover:bg-slate-50 px-2 -mx-2">
                <div>
                  <div className="text-sm font-semibold">{b.name}</div>
                  <div className="text-xs text-slate-500">{b.schedule || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-black text-lg">{b.enrolled || 0}<span className="text-xs text-slate-500 font-normal">/{b.capacity}</span></div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">enrolled</div>
                </div>
              </Link>
            ))}
            {batches.length === 0 && <div className="empty-state text-sm text-slate-500 text-center py-6">No batches</div>}
          </div>
        </Section>

        <Section title="Recent assignments" action={<Link to="/assignments" className="text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-slate-950">Manage →</Link>}>
          <div className="space-y-2">
            {assignments.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-slate-500">{a.subject} · Due {a.due_date || "—"}</div>
                </div>
                <span className="pill pill-blue">{a.max_marks} marks</span>
              </div>
            ))}
            {assignments.length === 0 && <div className="empty-state text-sm text-slate-500 text-center py-6">No assignments posted</div>}
          </div>
        </Section>

        <Section title="Quick actions">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/attendance" className="border border-slate-200 p-4 hover:border-slate-900 hover:bg-slate-50 transition-colors">
              <CalendarCheck size={18}/>
              <div className="font-semibold text-sm mt-2">Mark attendance</div>
              <div className="text-xs text-slate-500">For today's class</div>
            </Link>
            <Link to="/assignments" className="border border-slate-200 p-4 hover:border-slate-900 hover:bg-slate-50 transition-colors">
              <ClipboardList size={18}/>
              <div className="font-semibold text-sm mt-2">Post assignment</div>
              <div className="text-xs text-slate-500">Send to a batch</div>
            </Link>
            <Link to="/question-bank" className="border border-slate-200 p-4 hover:border-slate-900 hover:bg-slate-50 transition-colors">
              <BookCheck size={18}/>
              <div className="font-semibold text-sm mt-2">Add question</div>
              <div className="text-xs text-slate-500">To question bank</div>
            </Link>
            <Link to="/tests" className="border border-slate-200 p-4 hover:border-slate-900 hover:bg-slate-50 transition-colors">
              <Users size={18}/>
              <div className="font-semibold text-sm mt-2">Schedule test</div>
              <div className="text-xs text-slate-500">Online or offline</div>
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
}
