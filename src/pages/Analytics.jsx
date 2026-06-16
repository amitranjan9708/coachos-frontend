import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, KpiCard } from "@/components/PageHeader";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#002FA7", "#34C759", "#FF3B30", "#FFCC00", "#7c3aed", "#0ea5e9", "#94a3b8"];

export default function Analytics() {
  const [d, setD] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get("/analytics/dashboard").then(r => setD(r.data));
    api.get("/analytics/leads-funnel").then(r => setFunnel(r.data));
    api.get("/analytics/revenue-trend").then(r => setRevenue(r.data));
    api.get("/analytics/course-distribution").then(r => setCourses(r.data));
  }, []);

  return (
    <div data-testid="analytics-page">
      <PageHeader eyebrow="Insights" title="Analytics & BI" subtitle="Track admissions, revenue, attendance and engagement in one view." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Students" value={d?.students.total ?? 0} accent="slate"/>
        <KpiCard label="Leads" value={d?.leads.total ?? 0} hint={`${d?.leads.conversion_rate ?? 0}% conv.`} accent="blue"/>
        <KpiCard label="Faculty" value={d?.faculty ?? 0} accent="violet"/>
        <KpiCard label="Batches" value={d?.batches ?? 0} accent="amber"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="swiss-card p-5">
          <h3 className="font-display text-lg font-bold tracking-tight mb-3">Revenue trend</h3>
          <div className="h-72">
            <ResponsiveContainer><LineChart data={revenue}>
              <CartesianGrid stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{border:"1px solid #e2e8f0", borderRadius:0}}/>
              <Line type="monotone" dataKey="amount" stroke="#002FA7" strokeWidth={2.5}/>
            </LineChart></ResponsiveContainer>
          </div>
        </div>
        <div className="swiss-card p-5">
          <h3 className="font-display text-lg font-bold tracking-tight mb-3">Leads funnel</h3>
          <div className="h-72">
            <ResponsiveContainer><BarChart data={funnel}>
              <CartesianGrid stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="stage" tick={{fontSize:10, textTransform:"uppercase"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{border:"1px solid #e2e8f0", borderRadius:0}}/>
              <Bar dataKey="count">{funnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Bar>
            </BarChart></ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="swiss-card p-5">
          <h3 className="font-display text-lg font-bold tracking-tight mb-3">Course distribution</h3>
          <div className="h-72">
            <ResponsiveContainer><PieChart>
              <Pie data={courses} dataKey="students" nameKey="course" outerRadius={100} label={({course, students})=>`${course}: ${students}`}>
                {courses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Legend wrapperStyle={{fontSize: 11}}/>
            </PieChart></ResponsiveContainer>
          </div>
        </div>
        <div className="swiss-card p-5">
          <h3 className="font-display text-lg font-bold tracking-tight mb-3">Operational snapshot</h3>
          <div className="space-y-3">
            <Row label="Attendance rate" value={`${d?.attendance_rate ?? 0}%`}/>
            <Row label="Revenue collected" value={`₹${(d?.revenue.collected ?? 0).toLocaleString("en-IN")}`}/>
            <Row label="Revenue pending" value={`₹${(d?.revenue.pending ?? 0).toLocaleString("en-IN")}`}/>
            <Row label="Open invoices" value={d?.revenue.overdue_invoices ?? 0}/>
            <Row label="New leads (open)" value={d?.leads.new ?? 0}/>
            <Row label="Converted leads" value={d?.leads.converted ?? 0}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <span className="font-display font-black text-xl">{value}</span>
    </div>
  );
}
