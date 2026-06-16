import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, KpiCard, Section } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, UserPlus, ArrowRight, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

export default function CounselorDashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);

  useEffect(() => {
    api.get("/leads").then(r => setLeads(r.data));
  }, []);

  const stages = ["new", "contacted", "qualified", "counseling", "negotiation"];
  const byStage = stages.reduce((acc, s) => { acc[s] = leads.filter(l => l.stage === s); return acc; }, {});
  const converted = leads.filter(l => l.stage === "converted").length;
  const conversion = leads.length ? Math.round(converted * 100 / leads.length) : 0;

  return (
    <div data-testid="counselor-dashboard">
      <PageHeader
        eyebrow={`Hi, ${user?.name?.split(" ")[0] || "Counselor"}`}
        title="Today's pipeline"
        subtitle="Your leads, follow-ups and conversion focus."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Open leads" value={leads.filter(l => l.stage !== "converted" && l.stage !== "lost").length} accent="blue"/>
        <KpiCard label="New today" value={byStage.new?.length || 0} accent="slate"/>
        <KpiCard label="Conversion rate" value={`${conversion}%`} accent="emerald"/>
        <KpiCard label="In negotiation" value={byStage.negotiation?.length || 0} accent="amber"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {stages.slice(0, 3).map(s => (
          <Section key={s} title={`${s.toUpperCase()} · ${byStage[s]?.length || 0}`}>
            <div className="space-y-2">
              {(byStage[s] || []).slice(0, 5).map(l => (
                <Link key={l.id} to="/leads" className="block border-b border-slate-100 pb-2 hover:bg-slate-50 px-2 -mx-2">
                  <div className="text-sm font-semibold">{l.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11}/> {l.phone}</div>
                  {l.course_interest && <div className="text-xs text-slate-700 mt-1">{l.course_interest}</div>}
                </Link>
              ))}
              {(byStage[s] || []).length === 0 && <div className="empty-state text-sm text-slate-500 text-center py-6">None</div>}
            </div>
          </Section>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/leads" className="swiss-card p-5 group">
          <UserPlus size={20}/>
          <div className="font-display text-lg font-bold mt-3">Capture new lead</div>
          <div className="text-xs text-slate-500 mt-1">Walk-in, phone or referral</div>
          <ArrowRight size={16} className="mt-3 text-slate-400 group-hover:translate-x-1 transition-transform"/>
        </Link>
        <Link to="/communications" className="swiss-card p-5 group">
          <Megaphone size={20}/>
          <div className="font-display text-lg font-bold mt-3">Send broadcast</div>
          <div className="text-xs text-slate-500 mt-1">WhatsApp / SMS / Email</div>
          <ArrowRight size={16} className="mt-3 text-slate-400 group-hover:translate-x-1 transition-transform"/>
        </Link>
        <Link to="/scholarship" className="swiss-card p-5 group">
          <UserPlus size={20}/>
          <div className="font-display text-lg font-bold mt-3">Scholarship registrations</div>
          <div className="text-xs text-slate-500 mt-1">Convert top scorers</div>
          <ArrowRight size={16} className="mt-3 text-slate-400 group-hover:translate-x-1 transition-transform"/>
        </Link>
      </div>
    </div>
  );
}
