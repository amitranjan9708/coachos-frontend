import React, { useEffect, useState } from "react";
import { PageHeader, KpiCard, Section } from "@/components/PageHeader";
import api from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, CartesianGrid } from "recharts";
import { ArrowUpRight, TrendingUp, Wallet, Users, UserPlus, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const COLORS = ["#002FA7", "#34C759", "#FF3B30", "#FFCC00", "#7c3aed", "#0ea5e9", "#94a3b8"];

export default function Dashboard() {
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
    <div data-testid="dashboard-page">
      <PageHeader
        eyebrow="Command Center"
        title="Operations dashboard"
        subtitle="A single glance at admissions, revenue, attendance and learning across your institute."
        testId="dashboard-header"
        actions={
          <>
            <Link to="/leads" className="text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-slate-950 flex items-center gap-1">View pipeline <ArrowUpRight size={14}/></Link>
            <Link to="/fees" className="text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-slate-950 flex items-center gap-1">Fees board <ArrowUpRight size={14}/></Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard testId="kpi-students" label="Active students" value={d?.students.active ?? "—"} hint={`${d?.students.total ?? 0} total enrolled`} accent="slate" />
        <KpiCard testId="kpi-leads" label="Open leads" value={d?.leads.total ?? "—"} hint={`${d?.leads.conversion_rate ?? 0}% conversion`} accent="blue" />
        <KpiCard testId="kpi-revenue" label="Revenue collected" value={`₹${(d?.revenue.collected ?? 0).toLocaleString("en-IN")}`} hint={`₹${(d?.revenue.pending ?? 0).toLocaleString("en-IN")} pending`} accent="emerald" />
        <KpiCard testId="kpi-attendance" label="Attendance rate" value={`${d?.attendance_rate ?? 0}%`} hint="across all batches" accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Section title="Revenue trend (6 months)" action={<span className="text-xs uppercase tracking-widest text-slate-500 flex items-center gap-1"><TrendingUp size={12}/> Collected</span>}>
          <div className="h-64" data-testid="chart-revenue">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{fontSize:11, fill:"#64748b"}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:11, fill:"#64748b"}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{border:"1px solid #e2e8f0", borderRadius:0}} />
                <Line type="monotone" dataKey="amount" stroke="#002FA7" strokeWidth={2.5} dot={{r:3, fill:"#002FA7"}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Leads funnel" action={<span className="text-xs uppercase tracking-widest text-slate-500">Stages</span>}>
          <div className="h-64" data-testid="chart-funnel">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{left:8}}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" width={90} tick={{fontSize:11, fill:"#0f172a", fontWeight:600, textTransform:"uppercase"}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{border:"1px solid #e2e8f0", borderRadius:0}} />
                <Bar dataKey="count" fill="#0f172a" >
                  {funnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Course distribution" action={<span className="text-xs uppercase tracking-widest text-slate-500">By students</span>}>
          <div data-testid="chart-courses">
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={courses} dataKey="students" nameKey="course" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {courses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{border:"1px solid #e2e8f0", borderRadius:0}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {courses.slice(0,4).map((c, i) => (
                <span key={c.course} className="flex items-center gap-1.5"><span className="w-2 h-2" style={{background: COLORS[i % COLORS.length]}}/> {c.course}</span>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickLink to="/leads" icon={UserPlus} label="Add new lead" hint={`${d?.leads.new ?? 0} new this week`} />
        <QuickLink to="/students" icon={Users} label="Manage students" hint={`${d?.students.total ?? 0} enrolled`} />
        <QuickLink to="/fees" icon={Wallet} label="Generate invoice" hint={`${d?.revenue.overdue_invoices ?? 0} overdue`} />
        <QuickLink to="/faculty" icon={GraduationCap} label="Faculty roster" hint={`${d?.faculty ?? 0} active`} />
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, hint }) {
  return (
    <Link to={to} className="swiss-card p-5 flex items-start gap-3 group" data-testid={`quick-${label.toLowerCase().replace(/\s+/g,'-')}`}>
      <div className="w-10 h-10 bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-700 grid place-items-center transition-colors">
        <Icon size={18}/>
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{hint}</div>
      </div>
      <ArrowUpRight size={16} className="text-slate-400 group-hover:text-slate-900 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
