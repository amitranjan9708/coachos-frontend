import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <div className="text-sm tracking-widest uppercase">Loading CoachOS…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.force_password_reset) return <ForcePasswordReset user={user} />;
  return children;
}

import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

function ForcePasswordReset({ user }) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pwd !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (pwd.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { new_password: pwd });
      toast.success("Password updated!");
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
        <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-full mb-6">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Update Required</h2>
        <p className="text-slate-500 mb-6 text-sm">
          For security reasons, you must change your default password before accessing your dashboard.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>New Password</Label>
            <Input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required className="mt-1" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
