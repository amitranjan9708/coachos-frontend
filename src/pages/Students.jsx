import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Search, Trash2, Upload, Download, KeyRound, User, Mail, Phone, Book, Users, Banknote } from "lucide-react";
import { toast } from "sonner";

const UNASSIGNED = "__none__";

export default function Students() {
  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [q, setQ] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", dob: "", guardian_name: "", guardian_phone: "", roll_no: "", course_id: UNASSIGNED, batch_id: UNASSIGNED });

  const load = () => api.get("/students").then(r => setList(r.data));
  useEffect(() => {
    load();
    api.get("/courses").then(r => setCourses(r.data));
    api.get("/batches").then(r => setBatches(r.data));
  }, []);

  const create = async () => {
    if (!form.name || !form.phone) { toast.error("Name & phone required"); return; }
    const payload = {
      ...form,
      course_id: form.course_id === UNASSIGNED ? null : form.course_id,
      batch_id: form.batch_id === UNASSIGNED ? null : form.batch_id,
    };
    await api.post("/students", payload);
    toast.success("Student enrolled");
    setOpen(false);
    setForm({ name: "", phone: "", email: "", dob: "", guardian_name: "", guardian_phone: "", roll_no: "", course_id: UNASSIGNED, batch_id: UNASSIGNED });
    load();
    api.get("/batches").then(r => setBatches(r.data));
  };

  const remove = async (id) => {
    await api.delete(`/students/${id}`);
    toast.success("Removed");
    load();
    api.get("/batches").then(r => setBatches(r.data));
  };

  const reassignBatch = async (studentId, batchId) => {
    const target = batches.find(b => b.id === batchId);
    await api.post(`/students/${studentId}/assign-batch`, {
      batch_id: batchId === UNASSIGNED ? null : batchId,
      course_id: target?.course_id || null,
    });
    toast.success(batchId === UNASSIGNED ? "Unassigned" : `Moved to ${target?.name}`);
    load();
    api.get("/batches").then(r => setBatches(r.data));
  };

  const resetPassword = async (studentId) => {
    try {
      const student = list.find(s => s.id === studentId);
      if (!student.dob) {
        toast.error("Student has no DOB set. Cannot reset password.");
        return;
      }
      
      const res = await api.get(`/users`);
      const user = res.data.find(u => u.email === student.email);
      if (!user) {
         toast.error("User account not found for this student.");
         return;
      }
      await api.post(`/auth/users/${user.id}/reset-to-dob`);
      toast.success("Password reset to DOB successfully!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to reset password");
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      const res = await api.post("/students/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(`Successfully enrolled ${res.data.inserted} students`);
      if (res.data.errors && res.data.errors.length > 0) {
        toast.error(`Errors in ${res.data.errors.length} rows. Check console.`);
        console.warn("Bulk Upload Errors:", res.data.errors);
      }
      setBulkOpen(false);
      setBulkFile(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Phone,Email,DOB,Guardian\nJohn Doe,9876543210,john@example.com,2005-08-15,Jane Doe";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const loadProfile = async (id) => {
    try {
      const res = await api.get(`/students/${id}/profile`);
      setProfile(res.data);
    } catch (e) {
      toast.error("Failed to load profile");
    }
  };

  const filtered = list
    .filter(s => batchFilter === "all" ? true : (batchFilter === UNASSIGNED ? !s.batch_id : s.batch_id === batchFilter))
    .filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.phone.includes(q));

  return (
    <div data-testid="students-page">
      <PageHeader
        eyebrow="Roster"
        title="Students"
        subtitle="Enrolled students across all batches and branches. Assign each student to a batch to enable attendance and fees."
        actions={
          <>
            <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-white">
              <Search size={14} className="text-slate-400"/>
              <input data-testid="students-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" className="bg-transparent outline-none text-sm w-44" />
            </div>
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="rounded-sm w-48" data-testid="students-batch-filter"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
              <DialogTrigger asChild><Button data-testid="student-bulk" variant="outline" className="rounded-sm"><Upload size={16} className="mr-2"/> Bulk Upload</Button></DialogTrigger>
              <DialogContent className="rounded-sm max-w-md">
                <DialogHeader><DialogTitle className="font-display tracking-tight">Bulk Upload Students</DialogTitle></DialogHeader>
                <div className="space-y-4 my-4">
                  <p className="text-sm text-slate-500">
                    Upload a CSV file with student details. Ensure it matches the template format exactly.
                    Students with an email and DOB will automatically have an account created (password = DOB).
                  </p>
                  <Button variant="secondary" onClick={downloadTemplate} className="w-full"><Download size={16} className="mr-2"/> Download CSV Template</Button>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-700">Upload Filled CSV</Label>
                    <Input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files[0])} className="mt-2" />
                  </div>
                </div>
                <DialogFooter><Button data-testid="bulk-save" onClick={handleBulkUpload} disabled={uploading || !bulkFile} className="rounded-sm bg-slate-950 hover:bg-slate-800">{uploading ? "Uploading..." : "Upload CSV"}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button data-testid="student-add" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16}/> Enroll student</Button></DialogTrigger>
              <DialogContent className="rounded-sm max-w-lg">
                <DialogHeader><DialogTitle className="font-display tracking-tight">Enroll a new student</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name"><Input data-testid="student-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Phone"><Input data-testid="student-phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Email"><Input data-testid="student-email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="DOB (YYYY-MM-DD)"><Input data-testid="student-dob" type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Roll No."><Input data-testid="student-roll" value={form.roll_no} onChange={e=>setForm({...form,roll_no:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Guardian name"><Input value={form.guardian_name} onChange={e=>setForm({...form,guardian_name:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Guardian phone"><Input value={form.guardian_phone} onChange={e=>setForm({...form,guardian_phone:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Course">
                    <Select value={form.course_id} onValueChange={v=>setForm({...form,course_id:v})}>
                      <SelectTrigger className="rounded-sm"><SelectValue placeholder="Choose"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>None</SelectItem>
                        {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Batch">
                    <Select value={form.batch_id} onValueChange={v=>setForm({...form,batch_id:v})}>
                      <SelectTrigger className="rounded-sm"><SelectValue placeholder="Choose"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>None</SelectItem>
                        {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <DialogFooter><Button data-testid="student-save" onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Enroll</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-bold">Roll</th>
              <th className="px-4 py-3 font-bold">Name</th>
              <th className="px-4 py-3 font-bold">Phone</th>
              <th className="px-4 py-3 font-bold">Guardian</th>
              <th className="px-4 py-3 font-bold">Batch</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} onClick={(e) => {
                if (e.target.closest("button") || e.target.closest("button[role='combobox']")) return;
                loadProfile(s.id);
              }} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" data-testid={`student-row-${s.id}`}>
                <td className="px-4 py-3 font-mono text-xs">{s.roll_no || "—"}</td>
                <td className="px-4 py-3 font-semibold">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.phone}</td>
                <td className="px-4 py-3 text-slate-600">{s.guardian_name || "—"}</td>
                <td className="px-4 py-3">
                  <Select value={s.batch_id || UNASSIGNED} onValueChange={(v)=>reassignBatch(s.id, v)}>
                    <SelectTrigger className="rounded-sm h-8 text-xs w-44" data-testid={`student-batch-${s.id}`}><SelectValue placeholder="Unassigned"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3"><span className="pill pill-green">{s.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <button title="Reset Password to DOB" data-testid={`student-reset-${s.id}`} onClick={()=>resetPassword(s.id)} className="text-slate-400 hover:text-indigo-600 mr-3"><KeyRound size={14}/></button>
                  <button data-testid={`student-delete-${s.id}`} onClick={()=>remove(s.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="empty-state text-center text-sm text-slate-500 py-10">No students yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Sheet open={!!profile} onOpenChange={(o) => !o && setProfile(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto w-full">
          {profile && (
            <div className="mt-6 space-y-8">
              {/* Header section */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl uppercase shadow-sm">
                  {profile.student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-2xl font-bold font-display truncate text-slate-900">{profile.student.name}</h2>
                    <span className="pill pill-green shrink-0">{profile.student.status}</span>
                  </div>
                  <div className="text-sm font-mono text-slate-500 mt-1">Roll: {profile.student.roll_no || "N/A"}</div>
                  
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {profile.student.phone}</div>
                    {profile.student.email && <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {profile.student.email}</div>}
                    {profile.student.dob && <div className="flex items-center gap-2"><User size={14} className="text-slate-400"/> DOB: {profile.student.dob}</div>}
                  </div>
                </div>
              </div>

              {/* Academic Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2"><Book size={14}/> Academic Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Enrolled Course</div>
                    <div className="font-bold text-slate-900 truncate">{profile.course?.name || "Not Assigned"}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Assigned Batch</div>
                    <div className="font-bold text-slate-900 truncate">{profile.batch?.name || "Not Assigned"}</div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2"><Banknote size={14}/> Financials</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {profile.invoices.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">Amount</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">Paid</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">Due Date</th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profile.invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-medium">₹{inv.amount}</td>
                            <td className="px-4 py-3 font-mono text-emerald-600">₹{inv.paid_amount}</td>
                            <td className="px-4 py-3 text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-sm">No invoices found for this student.</div>
                  )}
                </div>
              </div>
              
              {/* Payment Records (optional: if payments list is also needed) */}
              {profile.payments.length > 0 && (
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">Recent Transactions</div>
                  <div className="divide-y divide-slate-100">
                    {profile.payments.map(pay => (
                      <div key={pay.id} className="px-4 py-3 flex items-center justify-between text-sm hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <span className="text-xs font-bold">₹</span>
                          </div>
                          <div>
                            <div className="font-bold">₹{pay.amount}</div>
                            <div className="text-xs text-slate-500 font-mono">{pay.receipt_no}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="uppercase text-[10px] tracking-wider font-bold text-slate-500">{pay.method}</div>
                          <div className="text-xs text-slate-400">{new Date(pay.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-widest text-slate-700">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
