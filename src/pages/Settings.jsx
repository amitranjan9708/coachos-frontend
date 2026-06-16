import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, KpiCard } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useModules } from "@/components/AppShell";

const MODULE_LABELS = {
  admissions_crm: ["Admissions CRM", "Lead capture, kanban, conversion"],
  student_management: ["Student Management", "Profiles, documents, enrollment"],
  course_batch: ["Course & Batch", "Courses, batches, classrooms"],
  attendance: ["Attendance", "Manual, QR, RFID, face"],
  faculty: ["Faculty Management", "Salaries, schedules, performance"],
  timetable: ["Timetable", "Class scheduling"],
  assignments_lms: ["Assignments & LMS", "Homework, notes, lectures"],
  online_tests: ["Online Tests", "MCQ, subjective, coding"],
  question_bank: ["Question Bank", "Tagged, reusable"],
  fees: ["Fee Management", "Installments, receipts"],
  communication: ["Communication Hub", "WhatsApp/SMS/Email"],
  parent_portal: ["Parent Portal", "Read-only parent access"],
  analytics: ["Analytics & BI", "Dashboards & insights"],
  scholarship_exam: ["Scholarship Exam", "Registrations, ranks"],
  referral: ["Referral System", "Student referrals & rewards"],
  franchise: ["Franchise Management", "Multi-branch ops"],
  inventory_hr: ["Inventory & HR", "Books, assets, leaves"],
  omr: ["Offline OMR Evaluation", "Sheet upload & evaluation"],
};

export default function Settings() {
  const { modules, setModules } = useModules();
  const [pricing, setPricing] = useState({});
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    api.get("/config/pricing").then(r => setPricing(r.data));
    api.get("/config/plan").then(r => setPlan(r.data));
  }, [modules]);

  const toggle = async (key) => {
    const next = { ...modules, [key]: !modules[key] };
    setModules(next);
    await api.put("/config/modules", next);
    const p = await api.get("/config/plan");
    setPlan(p.data);
    toast.success(`${MODULE_LABELS[key]?.[0]} ${next[key] ? "enabled" : "disabled"}`);
  };

  const updatePrice = async (k, val) => {
    const next = { ...pricing, [k]: Number(val) };
    setPricing(next);
    await api.put("/config/pricing", next);
    const p = await api.get("/config/plan");
    setPlan(p.data);
  };

  const enabledCount = Object.values(modules || {}).filter(Boolean).length;

  return (
    <div data-testid="settings-page">
      <PageHeader eyebrow="Configuration" title="Modules & pricing engine" subtitle="Toggle modules on/off. Plan price is auto-calculated based on enabled modules." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Enabled modules" value={enabledCount} accent="emerald" testId="kpi-enabled"/>
        <KpiCard label="Monthly price" value={`₹${(plan?.total ?? 0).toLocaleString("en-IN")}`} accent="blue" testId="kpi-plan-price"/>
        <KpiCard label="Yearly price" value={`₹${((plan?.total ?? 0) * 12 * 0.9).toLocaleString("en-IN")}`} hint="10% annual discount" accent="violet"/>
      </div>

      <div className="bg-white border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold tracking-tight">Modules</h3>
          <span className="text-xs uppercase tracking-widest text-slate-500">Toggle to enable/disable</span>
        </div>
        <div className="divide-y divide-slate-100">
          {Object.keys(MODULE_LABELS).map(k => {
            const [label, hint] = MODULE_LABELS[k];
            const enabled = modules[k] === true;
            const price = pricing[k] || 0;
            return (
              <div key={k} className="px-6 py-4 flex items-center gap-4" data-testid={`module-row-${k}`}>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-xs text-slate-500">{hint}</div>
                </div>
                <div className="flex items-center gap-2 w-32">
                  <span className="text-xs text-slate-500">₹</span>
                  <Input
                    type="number"
                    value={price}
                    onChange={e => updatePrice(k, e.target.value)}
                    className="rounded-sm h-8 text-sm"
                    data-testid={`price-${k}`}
                  />
                  <span className="text-xs text-slate-500">/mo</span>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={() => toggle(k)}
                  data-testid={`module-toggle-${k}`}
                />
                <span className={`pill ${enabled ? "pill-green" : "pill-slate"} w-20 justify-center`}>{enabled ? "Active" : "Off"}</span>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Calculated total</div>
            <div className="font-display text-3xl font-black tracking-tighter mt-1">₹{(plan?.total ?? 0).toLocaleString("en-IN")}<span className="text-sm font-normal text-slate-500"> /month</span></div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-slate-500">After 10% annual discount</div>
            <div className="font-display text-xl font-bold tracking-tight mt-1">₹{((plan?.total ?? 0) * 12 * 0.9).toLocaleString("en-IN")} <span className="text-sm font-normal text-slate-500">/year</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
