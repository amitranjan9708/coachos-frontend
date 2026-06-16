import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, KpiCard, Section } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, ClipboardList, BookOpen, Calendar, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0, rate: 0 });
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const studentId = user?.student_id;
    api.get("/students").then(r => {
      const found = studentId ? r.data.find(s => s.id === studentId) : r.data[0];
      setMe(found);
      if (found) {
        api.get(`/invoices?student_id=${found.id}`).then(r => setInvoices(r.data));
        api.get(`/attendance?student_id=${found.id}`).then(r => {
          const total = r.data.length;
          const present = r.data.filter(a => a.status === "present").length;
          setAttendance({ total, present, rate: total ? Math.round(present * 100 / total) : 0 });
        });
      }
    });
    api.get("/assignments").then(r => setAssignments(r.data));
    api.get("/tests").then(r => setTests(r.data));
    api.get("/study-materials").then(r => setMaterials(r.data));
  }, [user]);

  const due = invoices.reduce((s, i) => s + ((i.amount || 0) - (i.paid_amount || 0)), 0);
  const nextInvoice = invoices.find(i => i.status !== "paid");

  return (
    <div data-testid="student-dashboard">
      <PageHeader
        eyebrow={`Hi, ${user?.name?.split(" ")[0] || "Student"}`}
        title="Your learning dashboard"
        subtitle={me ? `Roll ${me.roll_no || "—"} · ${me.phone}` : "Personal academic snapshot"}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Attendance" value={`${attendance.rate}%`} hint={`${attendance.present}/${attendance.total} classes`} accent="emerald" testId="kpi-my-attendance"/>
        <KpiCard label="Fee due" value={`₹${due.toLocaleString("en-IN")}`} hint={nextInvoice ? `Next: ${nextInvoice.due_date || "—"}` : "All clear"} accent="amber" testId="kpi-my-due"/>
        <KpiCard label="Upcoming tests" value={tests.length} accent="blue"/>
        <KpiCard label="Assignments" value={assignments.length} accent="slate"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Your fees" action={<Link to="/my-fees" className="text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-slate-950">View all →</Link>}>
          <div className="space-y-2">
            {invoices.slice(0, 5).map(i => (
              <div key={i.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="text-sm font-semibold">Installment #{i.installment_no}</div>
                  <div className="text-xs text-slate-500">Due {i.due_date || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-black">₹{(i.amount).toLocaleString("en-IN")}</div>
                  <span className={`pill ${i.status==='paid'?'pill-green':i.status==='partial'?'pill-amber':'pill-red'}`}>{i.status}</span>
                </div>
              </div>
            ))}
            {invoices.length === 0 && <div className="empty-state text-sm text-slate-500 text-center py-6">No invoices</div>}
          </div>
        </Section>

        <Section title="Recent assignments">
          <div className="space-y-2">
            {assignments.slice(0, 6).map(a => (
              <div key={a.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={11}/> Due {a.due_date || "—"} · {a.subject}</div>
                </div>
                <span className="pill pill-blue">{a.max_marks} marks</span>
              </div>
            ))}
            {assignments.length === 0 && <div className="empty-state text-sm text-slate-500 text-center py-6">No assignments</div>}
          </div>
        </Section>

        <Section title="Upcoming & recent tests">
          <div className="space-y-2">
            {tests.slice(0, 6).map(t => (
              <div key={t.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="text-sm font-semibold">{t.title}</div>
                  <div className="text-xs text-slate-500">{t.subject} · {t.duration_minutes} min</div>
                </div>
                <span className="pill pill-slate">{t.total_marks} marks</span>
              </div>
            ))}
            {tests.length === 0 && <div className="empty-state text-sm text-slate-500 text-center py-6">No tests</div>}
          </div>
        </Section>

        <Section title="Learning library">
          <div className="space-y-2">
            {materials.slice(0, 6).map(m => (
              <div key={m.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2"><BookOpen size={14}/> {m.title}</div>
                  <div className="text-xs text-slate-500">{m.subject}</div>
                </div>
                <span className="pill pill-violet">{m.type}</span>
              </div>
            ))}
            {materials.length === 0 && <div className="empty-state text-sm text-slate-500 text-center py-6">No materials yet</div>}
          </div>
        </Section>
      </div>
    </div>
  );
}
