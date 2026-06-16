import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, KpiCard } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wallet, Receipt, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Fees() {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ invoice_id: "", amount: 0, method: "cash" });
  const [form, setForm] = useState({ student_id: "", course_id: "", total_amount: 0, installments: 3 });

  const load = () => api.get("/invoices").then(r => setInvoices(r.data));
  useEffect(() => {
    load();
    api.get("/students").then(r => setStudents(r.data));
    api.get("/courses").then(r => setCourses(r.data));
  }, []);

  const totalCollected = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
  const totalPending = invoices.reduce((s, i) => s + ((i.amount || 0) - (i.paid_amount || 0)), 0);
  const overdueCount = invoices.filter(i => i.status !== "paid").length;
  const paidCount = invoices.filter(i => i.status === "paid").length;

  const generate = async () => {
    if (!form.student_id || !form.course_id || !form.total_amount) { toast.error("All fields required"); return; }
    await api.post("/invoices/generate-from-course", { ...form, total_amount: Number(form.total_amount), installments: Number(form.installments) });
    toast.success(`${form.installments} invoices generated`);
    setOpen(false);
    setForm({ student_id: "", course_id: "", total_amount: 0, installments: 3 });
    load();
  };

  const recordPayment = async () => {
    if (!payForm.invoice_id || !payForm.amount) { toast.error("Amount required"); return; }
    await api.post(`/invoices/${payForm.invoice_id}/pay`, { amount: Number(payForm.amount), method: payForm.method });
    toast.success("Payment recorded (mock)");
    setPayOpen(false);
    setPayForm({ invoice_id: "", amount: 0, method: "cash" });
    load();
  };

  const studentName = (id) => students.find(s => s.id === id)?.name || "Unknown";

  return (
    <div data-testid="fees-page">
      <PageHeader
        eyebrow="Finance"
        title="Fees & invoicing"
        subtitle="Installments, receipts and mock payment recording."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button data-testid="invoice-generate" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16}/> Generate invoice</Button></DialogTrigger>
            <DialogContent className="rounded-sm">
              <DialogHeader><DialogTitle className="font-display tracking-tight">Generate fee invoices</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Field label="Student">
                  <Select value={form.student_id} onValueChange={v=>setForm({...form,student_id:v})}>
                    <SelectTrigger className="rounded-sm" data-testid="invoice-student"><SelectValue placeholder="Pick student"/></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Course">
                  <Select value={form.course_id} onValueChange={v => {
                    const c = courses.find(x => x.id === v);
                    setForm({ ...form, course_id: v, total_amount: c?.fee || form.total_amount });
                  }}>
                    <SelectTrigger className="rounded-sm" data-testid="invoice-course"><SelectValue placeholder="Pick course"/></SelectTrigger>
                    <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} (₹{c.fee})</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Total amount (₹)"><Input data-testid="invoice-amount" type="number" value={form.total_amount} onChange={e=>setForm({...form,total_amount:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Installments"><Input data-testid="invoice-installments" type="number" min={1} value={form.installments} onChange={e=>setForm({...form,installments:e.target.value})} className="rounded-sm"/></Field>
                </div>
              </div>
              <DialogFooter><Button data-testid="invoice-save" onClick={generate} className="rounded-sm bg-slate-950 hover:bg-slate-800">Generate</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Collected" value={`₹${totalCollected.toLocaleString("en-IN")}`} accent="emerald" />
        <KpiCard label="Pending" value={`₹${totalPending.toLocaleString("en-IN")}`} accent="amber" />
        <KpiCard label="Paid invoices" value={paidCount} accent="slate" />
        <KpiCard label="Open invoices" value={overdueCount} accent="red" />
      </div>

      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-bold">Student</th>
              <th className="px-4 py-3 font-bold">Installment</th>
              <th className="px-4 py-3 font-bold">Due</th>
              <th className="px-4 py-3 font-bold text-right">Amount</th>
              <th className="px-4 py-3 font-bold text-right">Paid</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`invoice-row-${i.id}`}>
                <td className="px-4 py-3 font-semibold">{studentName(i.student_id)}</td>
                <td className="px-4 py-3 text-slate-600">#{i.installment_no}</td>
                <td className="px-4 py-3 font-mono text-xs">{i.due_date || "—"}</td>
                <td className="px-4 py-3 text-right font-mono">₹{(i.amount || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-700">₹{(i.paid_amount || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3"><span className={`pill ${i.status === "paid" ? "pill-green" : i.status === "partial" ? "pill-amber" : "pill-red"}`}>{i.status}</span></td>
                <td className="px-4 py-3 text-right">
                  {i.status !== "paid" && (
                    <Button size="sm" variant="outline" className="rounded-sm text-xs" data-testid={`invoice-pay-${i.id}`} onClick={()=>{setPayForm({invoice_id: i.id, amount: i.amount - (i.paid_amount||0), method: "cash"}); setPayOpen(true);}}>
                      <Receipt size={12}/> Record payment
                    </Button>
                  )}
                  {i.status === "paid" && <CheckCircle2 size={16} className="text-emerald-600 inline" />}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={7} className="empty-state text-center text-sm text-slate-500 py-10">No invoices yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="rounded-sm">
          <DialogHeader><DialogTitle className="font-display tracking-tight">Record payment (Mock)</DialogTitle></DialogHeader>
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 mb-3 flex items-center gap-2"><AlertCircle size={12}/> Payment gateway is MOCKED. No actual money is collected.</div>
          <div className="space-y-3">
            <Field label="Amount (₹)"><Input data-testid="pay-amount" type="number" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})} className="rounded-sm"/></Field>
            <Field label="Method">
              <Select value={payForm.method} onValueChange={v=>setPayForm({...payForm,method:v})}>
                <SelectTrigger className="rounded-sm" data-testid="pay-method"><SelectValue/></SelectTrigger>
                <SelectContent>{["cash","upi","card","online"].map(m => <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter><Button data-testid="pay-confirm" onClick={recordPayment} className="rounded-sm bg-slate-950 hover:bg-slate-800"><Wallet size={16}/> Mark as paid</Button></DialogFooter>
        </DialogContent>
      </Dialog>
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
