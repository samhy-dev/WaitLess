import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { ArrowLeft, BarChart3, Loader2, Users, BellRing, CheckCircle2, Download, Star, Lock } from "lucide-react";

export default function Analytics() {
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
        .gte("created_at", start.toISOString());

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
      .channel(`analytics-tickets-${storeId}`)
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

  const served = tickets.filter((t) => t.status === "done").length;
  const called = tickets.filter((t) => t.status === "called").length;
  const waiting = tickets.filter((t) => t.status === "waiting").length;
  const total = tickets.length;
  const rated = tickets.filter((t) => t.rating);
  const avgRating = rated.length
    ? rated.reduce((sum, t) => sum + t.rating, 0) / rated.length
    : 0;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function handleDownloadPDF() {
    const doc = new jsPDF();
    const storeName = store?.name || "My Store";
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Waitless — Daily Summary", 14, 22);
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.text(storeName, 14, 32);
    doc.text(`Date: ${today}`, 14, 40);
    doc.setDrawColor(220);
    doc.line(14, 45, 196, 45);
    doc.setFontSize(11);
    let y = 58;
    const rows = [
      ["Total served today", served],
      ["In service (being called)", called],
      ["Waiting in line", waiting],
      ["Total tickets issued", total],
      ["Average rating", rated.length ? avgRating.toFixed(1) + " / 5" : "—"],
    ];
    rows.forEach(([label, val]) => {
      doc.setFont("helvetica", "bold");
      doc.text(String(val), 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(label, 34, y);
      y += 12;
    });
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, 285);
    doc.save(`waitless-summary-${storeName.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-6">
        <div>
          <Lock className="h-10 w-10 text-slate-400 mx-auto" />
          <h1 className="mt-4 text-xl font-bold">Not authorized</h1>
          <p className="mt-2 text-sm text-slate-500">You don't have access to view this store's analytics.</p>
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
            <BarChart3 className="h-5 w-5 text-slate-400" />
            <h1 className="text-lg font-bold tracking-tight">Daily summary</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">{today}</p>
        </section>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total served today
              </p>
              <div className="mt-2 text-7xl font-bold tracking-tight text-emerald-600">
                {served}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {total} ticket{total !== 1 ? "s" : ""} issued in total
              </p>
              <Button onClick={handleDownloadPDF} variant="outline" className="mt-4">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </section>

            <section className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-600">
                <CheckCircle2 className="mx-auto h-5 w-5" />
                <div className="mt-2 text-3xl font-bold tracking-tight">{served}</div>
                <p className="mt-1 text-xs font-medium opacity-80">Served</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-amber-600">
                <BellRing className="mx-auto h-5 w-5" />
                <div className="mt-2 text-3xl font-bold tracking-tight">{called}</div>
                <p className="mt-1 text-xs font-medium opacity-80">In service</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-600">
                <Users className="mx-auto h-5 w-5" />
                <div className="mt-2 text-3xl font-bold tracking-tight">{waiting}</div>
                <p className="mt-1 text-xs font-medium opacity-80">Waiting</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Customer rating
                  </p>
                  {rated.length > 0 ? (
                    <>
                      <div className="mt-1 text-4xl font-bold tracking-tight text-amber-500">
                        {avgRating.toFixed(1)}
                      </div>
                      <div className="mt-1 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={
                              "h-4 w-4 " +
                              (n <= Math.round(avgRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300")
                            }
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        from {rated.length} review{rated.length !== 1 ? "s" : ""}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">No ratings yet today.</p>
                  )}
                </div>
                <Star className="h-8 w-8 text-amber-400" />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}