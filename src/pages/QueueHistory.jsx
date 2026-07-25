import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import Logo from "@/components/Logo";
import { ArrowLeft, History as HistoryIcon, Loader2, CheckCircle2, Lock } from "lucide-react";

export default function QueueHistory() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(null);

  const load = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("store_id", storeId)
        .eq("status", "done")
        .gte("created_at", start.toISOString())
        .order("ticket_number", { ascending: true });

      if (error) throw error;
      setTickets(data || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single()
      .then(async ({ data }) => {
        setStore(data);
        const { data: { session } } = await supabase.auth.getSession();
        if (data && session?.user?.id === data.owner_id) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      });

    load();

    const channel = supabase
      .channel(`history-tickets-${storeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `store_id=eq.${storeId}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, load]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-6">
        <div>
          <Lock className="h-10 w-10 text-slate-400 mx-auto" />
          <h1 className="mt-4 text-xl font-bold">Not authorized</h1>
          <p className="mt-2 text-sm text-slate-500">You don't have access to view this store's history.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-primary underline text-sm">
            Go home
          </button>
        </div>
      </div>
    );
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to={`/manage/${storeId}`} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7 rounded-lg" />
            <span className="font-semibold">{store?.name || "My Store"}</span>
          </div>
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <section>
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-slate-400" />
            <h1 className="text-lg font-bold tracking-tight">Queue history</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Served customers from {today} · {tickets.length} total
          </p>
        </section>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            No customers served yet today.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {tickets.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center justify-between px-4 py-3 ${i !== 0 ? "border-t border-slate-100" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                    {t.ticket_number}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Ticket #{t.ticket_number}
                    </p>
                    <p className="text-xs text-slate-400">
                      Served {new Date(t.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}