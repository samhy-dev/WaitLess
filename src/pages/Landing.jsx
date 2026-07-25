import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import {
  ArrowRight,
  Store,
  QrCode,
  BellRing,
  Loader2 } from
"lucide-react";

const STEPS = [
{ icon: Store, title: "Create your store", desc: "One tap — no signup, no details." },
{ icon: QrCode, title: "Print your QR code", desc: "Display it where customers line up." },
{ icon: BellRing, title: "Call & notify", desc: "Customers get alerted on their phone when it's their turn." }];


export default function Landing() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [myStores, setMyStores] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("waitless_my_stores") || "[]");
    if (Array.isArray(saved)) setMyStores(saved);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // Kunin ang kasalukuyang session, o gumawa ng anonymous session
      // kung wala pang naka-login (guest, walang email/password)
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) throw anonError;
        session = data.session;
      }

      const storeName = name.trim() || "My Store";
      const { data: store, error: insertError } = await supabase
        .from("stores")
        .insert({ name: storeName, owner_id: session.user.id })
        .select()
        .single();

      if (insertError) throw insertError;

      const entry = { store_id: store.id, name: store.name };
      const updated = [entry, ...myStores.filter((s) => s.store_id !== store.id)];
      setMyStores(updated);
      localStorage.setItem("waitless_my_stores", JSON.stringify(updated));
      navigate(`/manage/${store.id}`);
    } catch (err) {
      console.error("Failed to create store:", err);
    } finally {
      setLoading(false);
    }
  }

  return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-300 text-slate-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 rounded-lg" />
          <span className="tracking-tight font-bold [font-family:'Rubik_Mono_One',_system-ui] text-xl">Waitless</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <section className="pt-8 text-center">
          <h1 className="tracking-tight [font-family:'Quicking',_sans-serif] font-normal text-4xl sm:text-4xl">Generate your STORE'S - QR code now </h1>
          <p className="mx-auto mt-3 max-w-md text-slate-500 [font-family:'Newsreader',_serif] text-sm">Skip the setup hassle — your queue is ready in second</p>
        </section>

        <section className="mx-auto mt-8 max-w-md">
          <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            
            <label htmlFor="storeName" className="text-sm font-medium text-slate-700">
              Store name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input id="storeName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mike's Barber Shop" className="mt-2" />
            
            <Button type="submit" disabled={loading} className="mt-3 w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
              {loading ? "Creating…" : "Create New Store"}
            </Button>
          </form>
        </section>

        {myStores.length > 0 && <section className="mx-auto mt-8 max-w-md">
            <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">YOUR STORES

        </h2>
            <div className="space-y-2">
              {myStores.map((s) => <button key={s.store_id} onClick={() => navigate(`/manage/${s.store_id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
            
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Store className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold text-slate-800">{s.name}</span>
                    <span className="block text-xs text-slate-400">Open dashboard</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
          )}
            </div>
          </section>
      }

        <section className="mt-12">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">HOW IT WORKS

        </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) =>
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer">
              
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                  <step.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
              </div>
          )}
          </div>
        </section>
      </main>
    </div>;

}