import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, KpiCard } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MessageSquare, Mail, Smartphone, Bell, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "#25D366" },
  { value: "sms", label: "SMS", icon: Smartphone, color: "#0ea5e9" },
  { value: "email", label: "Email", icon: Mail, color: "#7c3aed" },
  { value: "push", label: "Push", icon: Bell, color: "#FF9500" },
];

export default function Communications() {
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ channel: "whatsapp", subject: "", body: "", recipient_type: "broadcast", to: "", student_id: "" });

  const load = () => api.get("/messages").then(r => setMessages(r.data));
  useEffect(() => { load(); api.get("/students").then(r => setStudents(r.data)); }, []);

  const send = async () => {
    if (!form.body) { toast.error("Message body required"); return; }
    if (form.recipient_type === "broadcast") {
      const recipients = students.map(s => ({ to: s.phone || s.email, recipient_id: s.id }));
      await api.post("/messages/broadcast", { channel: form.channel, subject: form.subject, body: form.body, recipients });
      toast.success(`Broadcast to ${recipients.length} recipients (MOCK)`);
    } else {
      if (!form.to) { toast.error("Recipient required"); return; }
      await api.post("/messages/send", { channel: form.channel, to: form.to, subject: form.subject, body: form.body });
      toast.success("Message sent (MOCK)");
    }
    setForm({ ...form, subject: "", body: "" });
    load();
  };

  const filtered = filter === "all" ? messages : messages.filter(m => m.channel === filter);
  const counts = CHANNELS.reduce((acc, c) => { acc[c.value] = messages.filter(m => m.channel === c.value).length; return acc; }, {});

  return (
    <div data-testid="comms-page">
      <PageHeader eyebrow="Outreach" title="Communications hub" subtitle="WhatsApp, SMS, Email and push notifications — all mocked for v1." />

      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 mb-6 text-sm flex items-center gap-2">
        <AlertCircle size={16}/> All channels are <b className="font-bold">MOCKED</b>. Messages are logged in the platform but not delivered to real recipients.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {CHANNELS.map(c => (
          <KpiCard key={c.value} label={c.label} value={counts[c.value] || 0} hint="messages sent" accent="slate" testId={`channel-count-${c.value}`}/>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 swiss-card p-5">
          <h3 className="font-display text-lg font-bold tracking-tight mb-4">Compose</h3>
          <div className="space-y-3">
            <Field label="Channel">
              <Select value={form.channel} onValueChange={v=>setForm({...form,channel:v})}>
                <SelectTrigger className="rounded-sm" data-testid="comms-channel"><SelectValue/></SelectTrigger>
                <SelectContent>{CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Recipients">
              <Select value={form.recipient_type} onValueChange={v=>setForm({...form,recipient_type:v})}>
                <SelectTrigger className="rounded-sm"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="broadcast">Broadcast (all students)</SelectItem>
                  <SelectItem value="single">Single recipient</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.recipient_type === "single" && (
              <Field label="To (phone/email)"><Input value={form.to} onChange={e=>setForm({...form,to:e.target.value})} className="rounded-sm"/></Field>
            )}
            {form.channel === "email" && <Field label="Subject"><Input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className="rounded-sm"/></Field>}
            <Field label="Message"><Textarea data-testid="comms-body" rows={6} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} className="rounded-sm" placeholder="Hi {student}, your fee installment is due…"/></Field>
            <Button data-testid="comms-send" onClick={send} className="w-full rounded-sm bg-slate-950 hover:bg-slate-800"><Send size={14}/> Send {form.recipient_type === "broadcast" ? "broadcast" : "message"}</Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold tracking-tight">Message log</h3>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="rounded-sm w-40" data-testid="comms-filter"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                {CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {filtered.map(m => {
              const ch = CHANNELS.find(c => c.value === m.channel);
              const Icon = ch?.icon || MessageSquare;
              return (
                <div key={m.id} className="swiss-card p-4 flex items-start gap-3" data-testid={`message-${m.id}`}>
                  <div className="w-9 h-9 grid place-items-center" style={{background: ch?.color || "#0f172a", color: "white"}}><Icon size={16}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold uppercase tracking-widest">{m.channel}</span>
                      <span>·</span>
                      <span className="font-mono">{m.to}</span>
                      <span className="ml-auto pill pill-green">{m.status}</span>
                    </div>
                    {m.subject && <div className="font-semibold text-sm mt-1">{m.subject}</div>}
                    <div className="text-sm text-slate-700 mt-1 line-clamp-2">{m.body}</div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="empty-state text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No messages yet</div>}
          </div>
        </div>
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
