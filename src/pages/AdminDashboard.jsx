import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import QrCard from "@/components/QrCard";
import Logo from "@/components/Logo";
import { ArrowLeft, Megaphone, Users, Loader2, ExternalLink, Settings, History, BarChart3, Repeat, Volume2, Lock } from "lucide-react";

export default function AdminDashboard() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const joinUrl = `${window.location.origin}/join/${storeId}`;

  const [store, setStore] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [repeating, setRepeating] = useState(false);
  const [authorized, setAuthorized] = useState(null); // null = checking

  const loadTickets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("store_id", storeId)
        .neq("status", "done")
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

    loadTickets();

    const channel = supabase
      .channel(`admin-tickets-${storeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `store_id=eq.${storeId}` },
        () => loadTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, loadTickets]);

  async function handleCallNext() {
    setCalling(true);
    try {
      const { data: current } = await supabase
        .from("tickets")
        .select("*")
        .eq("store_id", storeId)
        .eq("status", "called")
        .maybeSingle();

      if (current) {
        await supabase.from("tickets").update({ status: "done" }).eq("id", current.id);
      }

      const { data: next } = await supabase
        .from("tickets")
        .select("*")
        .eq("store_id", storeId)
        .eq("status", "waiting")
        .order("ticket_number", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (next) {
        await supabase.from("tickets").update({ status: "called" }).eq("id", next.id);
      }

      await loadTickets();
    } catch (err) {
      console.error("Failed to call next:", err);
    } finally {
      setCalling(false);
    }
  }

  async function handleRepeatCall() {
    if (!called) return;
    setRepeating(true);
    try {
      await supabase
        .from("tickets")
        .update({ call_count: (called.call_count || 0) + 1 })
        .eq("id", called.id);
    } catch {
      // ignore — the subscription refreshes state
    } finally {
      setRepeating(false);
    }
  }

  const waiting = tickets.filter((t) => t.status === "waiting");
  const called = tickets.find((t) => t.status === "called");

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-6">
        <div>
          <Lock className="h-10 w-10 text-slate-400 mx-auto" />
          <h1 className="mt-4 text-xl font-bold">Not authorized</h1>
          <p className="mt-2 text-sm text-slate-500">You don't have access to manage this store.</p>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-300 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <ArrowLeft className="h-6 w-6" />
            <span className="text-lg">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Logo className="h-9 w-9 rounded-lg" />
            <span className="text-3xl [font-family:'Montserrat',_sans-serif] font-bold">{store?.name || "My Store"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/settings/${storeId}`} className="flex items-center rounded-lg p-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              <Settings className="h-6 w-6" />
            </Link>
            <a href={joinUrl} target="_blank" rel="noreferrer" className="flex items-center rounded-lg p-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              <ExternalLink className="h-6 w-6" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div className="flex gap-2">
          <Link
            to={`/queue-history/${storeId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
            <History className="h-4 w-4" />
            History
          </Link>
          <Link
            to={`/analytics/${storeId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link>
          <Link
            to={`/voice-settings/${storeId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <Volume2 className="h-4 w-4" />
            Voice
          </Link>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Now serving
          </p>
          {called ?
          <div className="mt-2 text-6xl font-bold tracking-tight text-emerald-600">
              {called.ticket_number}
            </div> :
          <div className="mt-2 text-2xl font-semibold text-slate-300">—</div>
          }
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleCallNext}
              disabled={calling || waiting.length === 0}
              size="lg"
              className="h-16 flex-1 text-lg">
              {calling ?
              <Loader2 className="h-6 w-6 animate-spin" /> :
              <Megaphone className="h-6 w-6" />
              }
              {calling ? "Calling…" : "Next call"}
            </Button>
            <Button
              onClick={handleRepeatCall}
              disabled={repeating || !called}
              variant="outline"
              size="lg"
              className="h-16 flex-1 text-lg">
              {repeating ?
              <Loader2 className="h-6 w-6 animate-spin" /> :
              <Repeat className="h-6 w-6" />
              }
              {repeating ? "Repeating…" : "Repeat call number"}
            </Button>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            <Users className="mr-1 inline h-4 w-4" />
            {waiting.length} waiting in line
          </p>
        </section>

        <QrCard joinUrl={joinUrl} />

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">WAITING LIST
          </h2>
          {loading ?
          <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div> :
          waiting.length === 0 ?
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              No one in line yet. Share your QR code to get started.
            </div> :
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {waiting.map((t) =>
            <div
              key={t.id}
              className="animate-fade-in flex h-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-sm">
                  {t.ticket_number}
                </div>
            )}
            </div>
          }
        </section>
      </main>
    </div>);
}