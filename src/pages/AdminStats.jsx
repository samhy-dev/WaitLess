import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, QrCode, Download, Lock } from "lucide-react";
import Logo from "@/components/Logo";

// Palitan mo ito ng sarili mong email
const ADMIN_EMAIL = "waitlessqueque@gmail.com";

export default function AdminStats() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrScans, setQrScans] = useState(0);
  const [pwaInstalls, setPwaInstalls] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email;
      if (email === ADMIN_EMAIL) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
      setCheckingAuth(false);
    });
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadStats();
  }, [authorized]);

  async function loadStats() {
    setLoading(true);
    try {
      const { count: qrCount } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "qr_scan");

      const { count: installCount } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "pwa_install");

      setQrScans(qrCount || 0);
      setPwaInstalls(installCount || 0);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
        <Lock className="h-8 w-8 text-slate-300" />
        <h1 className="mt-3 text-lg font-semibold">Not authorized</h1>
        <p className="mt-1 text-sm text-slate-500">You don't have access to this page.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-sm text-slate-500 underline"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-300 text-slate-900">
      <header className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
        <Logo className="h-8 w-8 rounded-lg" />
        <span className="text-xl font-bold tracking-tight">Admin Stats</span>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <QrCode className="h-6 w-6" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                QR Scans
              </p>
              <div className="mt-1 text-5xl font-bold tracking-tight">{qrScans}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Download className="h-6 w-6" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                PWA Installs
              </p>
              <div className="mt-1 text-5xl font-bold tracking-tight">{pwaInstalls}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}