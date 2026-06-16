import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Boxes, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Inventory() {
  return (
    <div data-testid="inventory-page">
      <PageHeader eyebrow="Operations" title="Inventory & HR" subtitle="Books, assets and leave requests." />
      <Tabs defaultValue="inventory">
        <TabsList className="rounded-sm bg-transparent border border-slate-200 p-0 h-auto">
          <TabsTrigger value="inventory" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold">Inventory</TabsTrigger>
          <TabsTrigger value="leaves" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold">Leave requests</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory" className="mt-6"><Items/></TabsContent>
        <TabsContent value="leaves" className="mt-6"><Leaves/></TabsContent>
      </Tabs>
    </div>
  );
}

function Items() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", category: "book", quantity: 1, unit_price: 0 });
  const load = () => api.get("/inventory").then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    await api.post("/inventory", { ...form, quantity: Number(form.quantity), unit_price: Number(form.unit_price) });
    toast.success("Item added"); setForm({ name: "", category: "book", quantity: 1, unit_price: 0 }); load();
  };

  return (
    <>
      <div className="swiss-card p-5 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <Field label="Name"><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="rounded-sm"/></Field>
        <Field label="Category">
          <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
            <SelectTrigger className="rounded-sm"><SelectValue/></SelectTrigger>
            <SelectContent>{["book","asset","stationery"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Quantity"><Input type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="rounded-sm"/></Field>
        <Field label="Unit price (₹)"><Input type="number" value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})} className="rounded-sm"/></Field>
        <Button onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={14}/> Add item</Button>
      </div>

      <div className="bg-white border border-slate-200">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
            <th className="px-4 py-3 font-bold">Name</th>
            <th className="px-4 py-3 font-bold">Category</th>
            <th className="px-4 py-3 font-bold text-right">Qty</th>
            <th className="px-4 py-3 font-bold text-right">Price</th>
            <th className="px-4 py-3 font-bold text-right">Total</th>
          </tr></thead>
          <tbody>
            {list.map(i => (
              <tr key={i.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold">{i.name}</td>
                <td className="px-4 py-3"><span className="pill pill-slate">{i.category}</span></td>
                <td className="px-4 py-3 text-right font-mono">{i.quantity}</td>
                <td className="px-4 py-3 text-right font-mono">₹{i.unit_price}</td>
                <td className="px-4 py-3 text-right font-display font-black">₹{(i.quantity * i.unit_price).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="empty-state text-center text-sm text-slate-500 py-10">No items</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Leaves() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ user_name: "", from_date: "", to_date: "", reason: "" });
  const load = () => api.get("/leaves").then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.user_name || !form.from_date) { toast.error("Name & dates required"); return; }
    await api.post("/leaves", { ...form, user_id: "self" });
    toast.success("Leave applied"); setForm({ user_name: "", from_date: "", to_date: "", reason: "" }); load();
  };
  const setStatus = async (id, status) => { await api.put(`/leaves/${id}`, { status }); load(); };

  return (
    <>
      <div className="swiss-card p-5 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <Field label="Employee"><Input value={form.user_name} onChange={e=>setForm({...form,user_name:e.target.value})} className="rounded-sm"/></Field>
        <Field label="From"><Input type="date" value={form.from_date} onChange={e=>setForm({...form,from_date:e.target.value})} className="rounded-sm"/></Field>
        <Field label="To"><Input type="date" value={form.to_date} onChange={e=>setForm({...form,to_date:e.target.value})} className="rounded-sm"/></Field>
        <Field label="Reason"><Input value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} className="rounded-sm"/></Field>
        <Button onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={14}/> Apply</Button>
      </div>

      <div className="bg-white border border-slate-200">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
            <th className="px-4 py-3 font-bold">Employee</th>
            <th className="px-4 py-3 font-bold">From</th>
            <th className="px-4 py-3 font-bold">To</th>
            <th className="px-4 py-3 font-bold">Reason</th>
            <th className="px-4 py-3 font-bold">Status</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {list.map(l => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold">{l.user_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.from_date}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.to_date}</td>
                <td className="px-4 py-3 text-slate-600">{l.reason}</td>
                <td className="px-4 py-3"><span className={`pill ${l.status==='approved'?'pill-green':l.status==='rejected'?'pill-red':'pill-amber'}`}>{l.status}</span></td>
                <td className="px-4 py-3 text-right space-x-1">
                  {l.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" className="rounded-sm text-xs" onClick={()=>setStatus(l.id, "rejected")}>Reject</Button>
                      <Button size="sm" className="rounded-sm text-xs bg-emerald-600 hover:bg-emerald-700" onClick={()=>setStatus(l.id, "approved")}>Approve</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="empty-state text-center text-sm text-slate-500 py-10">No leaves</td></tr>}
          </tbody>
        </table>
      </div>
    </>
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
