import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, KpiCard } from "@/components/PageHeader";
import { Calendar, Wallet, ClipboardList, GraduationCap } from "lucide-react";

export default function ParentPortal() {
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    api.get("/students").then(r => setStudents(r.data));
    api.get("/invoices").then(r => setInvoices(r.data));
    api.get("/assignments").then(r => setAssignments(r.data));
  }, []);

  const me = students[0]; // Demo: show first student for parent view
  const myInvoices = invoices.filter(i => i.student_id === me?.id);
  const totalDue = myInvoices.reduce((s, i) => s + ((i.amount||0) - (i.paid_amount||0)), 0);

  return (
    <div data-testid="parent-portal-page">
      <PageHeader eyebrow="Parent Portal" title="Your child's progress" subtitle="Attendance, fees, performance and announcements at a glance." />

      {me && (
        <div className="swiss-card p-6 mb-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 text-white grid place-items-center font-bold text-xl">{me.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Student</div>
            <div className="font-display text-2xl font-black tracking-tighter">{me.name}</div>
            <div className="text-sm text-slate-600 mt-1">Roll {me.roll_no || "—"} · {me.phone}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total fee due" value={`₹${totalDue.toLocaleString("en-IN")}`} accent="amber" />
        <KpiCard label="Open invoices" value={myInvoices.filter(i=>i.status !== "paid").length} accent="slate" />
        <KpiCard label="Assignments" value={assignments.length} accent="blue" />
        <KpiCard label="Attendance" value="—" hint="from attendance module" accent="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="swiss-card p-5">
          <h3 className="font-display text-lg font-bold tracking-tight mb-3 flex items-center gap-2"><Wallet size={18}/> Fee status</h3>
          <div className="space-y-2">
            {myInvoices.map(i => (
              <div key={i.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
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
            {myInvoices.length === 0 && <div className="empty-state text-sm text-slate-500 text-center py-6">No invoices yet</div>}
          </div>
        </div>

        <div className="swiss-card p-5">
          <h3 className="font-display text-lg font-bold tracking-tight mb-3 flex items-center gap-2"><ClipboardList size={18}/> Recent assignments</h3>
          <div className="space-y-2">
            {assignments.slice(0,6).map(a => (
              <div key={a.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-slate-500">{a.subject} · Due {a.due_date || "—"}</div>
                </div>
                <span className="pill pill-blue">{a.max_marks} marks</span>
              </div>
            ))}
            {assignments.length === 0 && <div className="empty-state text-sm text-slate-500 text-center py-6">No assignments</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
