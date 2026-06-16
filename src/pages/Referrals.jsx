import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function Referrals() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ referrer_name: "", referred_name: "", referred_phone: "", reward_amount: 500 });

  const load = () => api.get("/referrals").then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.referrer_name || !form.referred_name || !form.referred_phone) { toast.error("All fields required"); return; }
    await api.post("/referrals", { ...form, reward_amount: Number(form.reward_amount) });
    toast.success("Referral added");
    setForm({ referrer_name: "", referred_name: "", referred_phone: "", reward_amount: 500 });
    load();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/referrals/${id}`, { status });
    toast.success(`Marked ${status}`);
    load();
  };

  return (
    <div data-testid="referrals-page">
      <PageHeader eyebrow="Growth" title="Referrals" subtitle="Track student referrals and reward conversions." />

      <div className="swiss-card p-5 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <Field label="Referrer"><Input value={form.referrer_name} onChange={e=>setForm({...form,referrer_name:e.target.value})} className="rounded-sm"/></Field>
        <Field label="Referred name"><Input value={form.referred_name} onChange={e=>setForm({...form,referred_name:e.target.value})} className="rounded-sm"/></Field>
        <Field label="Phone"><Input value={form.referred_phone} onChange={e=>setForm({...form,referred_phone:e.target.value})} className="rounded-sm"/></Field>
        <Field label="Reward (₹)"><Input type="number" value={form.reward_amount} onChange={e=>setForm({...form,reward_amount:e.target.value})} className="rounded-sm"/></Field>
        <Button onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={14}/> Add referral</Button>
      </div>

      <div className="bg-white border border-slate-200">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
            <th className="px-4 py-3 font-bold">Referrer</th>
            <th className="px-4 py-3 font-bold">Referred</th>
            <th className="px-4 py-3 font-bold">Phone</th>
            <th className="px-4 py-3 font-bold text-right">Reward</th>
            <th className="px-4 py-3 font-bold">Status</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold">{r.referrer_name}</td>
                <td className="px-4 py-3">{r.referred_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.referred_phone}</td>
                <td className="px-4 py-3 text-right font-mono">₹{r.reward_amount}</td>
                <td className="px-4 py-3"><span className={`pill ${r.status==='rewarded'?'pill-green':r.status==='joined'?'pill-blue':'pill-amber'}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-right space-x-1">
                  {r.status === "pending" && <Button size="sm" variant="outline" className="rounded-sm text-xs" onClick={()=>updateStatus(r.id, "joined")}>Joined</Button>}
                  {r.status === "joined" && <Button size="sm" className="rounded-sm text-xs bg-emerald-600 hover:bg-emerald-700" onClick={()=>updateStatus(r.id, "rewarded")}>Reward</Button>}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="empty-state text-center text-sm text-slate-500 py-10">No referrals</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-widest">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
