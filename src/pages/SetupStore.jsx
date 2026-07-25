import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, ArrowLeft, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

export default function SetupStore() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a store name.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) throw anonError;
        session = data.session;
      }

      const { data: store, error: insertError } = await supabase
        .from("stores")
        .insert({ name: name.trim(), owner_id: session.user.id })
        .select()
        .single();

      if (insertError) throw insertError;

      localStorage.setItem("waitless_store", JSON.stringify({ store_id: store.id }));
      navigate(`/manage/${store.id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7 rounded-lg" />
          <span className="font-semibold tracking-tight [font-family:'Rubik_Mono_One',_system-ui] text-xl">Waitless</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-16">
        <section className="mt-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Store className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Set up your store</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter your store name to create a digital queue space. You'll get a QR
            code customers can scan to grab a number.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="storeName" className="text-sm font-medium text-slate-700">
            Store name
          </label>
          <Input
            id="storeName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mike's Barber Shop"
            className="mt-2"
            autoFocus />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-4 w-full" size="lg">
            {loading ?
            <Loader2 className="h-4 w-4 animate-spin" /> :

            <Store className="h-4 w-4" />
            }
            {loading ? "Creating…" : "Create my store"}
          </Button>
        </form>
      </main>
    </div>);

}