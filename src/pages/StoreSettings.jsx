import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Loader2,
  Check,
  AlertTriangle,
  Trash2,
  Lock,
} from "lucide-react";
import Logo from "@/components/Logo";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function StoreSettings() {
  const { storeId } = useParams();
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [loadingStore, setLoadingStore] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [authorized, setAuthorized] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single()
      .then(async ({ data: s }) => {
        if (s) {
          setName(s.name || "");
          setOriginalName(s.name || "");
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (s && session?.user?.id === s.owner_id) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      })
      .finally(() => setLoadingStore(false));
  }, [storeId]);

  async function handleSaveName(e) {
    e.preventDefault();
    if (!name.trim() || name.trim() === originalName.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      await supabase.from("stores").update({ name: name.trim() }).eq("id", storeId);
      setOriginalName(name.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // ignore — button returns to normal
    } finally {
      setSaving(false);
    }
  }

  async function handleResetQueue() {
    const confirmed = window.confirm(
      "This will clear ALL tickets and restart numbering from 1. This cannot be undone."
    );
    if (!confirmed) return;
    setResetting(true);
    setResetDone(false);
    try {
      await supabase.from("tickets").delete().eq("store_id", storeId);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 2500);
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  }

  async function handleDeleteStore() {
    setDeleting(true);
    try {
      await supabase.from("tickets").delete().eq("store_id", storeId);
      await supabase.from("stores").delete().eq("id", storeId);
      try {
        const saved = JSON.parse(localStorage.getItem("waitless_my_stores") || "[]");
        const next = saved.filter((s) => s.store_id !== storeId);
        localStorage.setItem("waitless_my_stores", JSON.stringify(next));
      } catch {}
      navigate("/");
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  }

  const nameChanged = name.trim() !== originalName.trim();

  if (!loadingStore && authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-6">
        <div>
          <Lock className="h-10 w-10 text-slate-400 mx-auto" />
          <h1 className="mt-4 text-xl font-bold">Not authorized</h1>
          <p className="mt-2 text-sm text-slate-500">You don't have access to manage this store's settings.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-primary underline text-sm">
            Go home
          </button>
        </div>
      </div>
    );
  }

  if (loadingStore || authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link
            to={`/manage/${storeId}`}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7 rounded-lg" />
            <span className="font-semibold tracking-tight">Settings</span>
          </div>
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Store name
          </h2>
          <form onSubmit={handleSaveName} className="mt-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Store name"
            />
            <Button
              type="submit"
              disabled={saving || !nameChanged}
              className="mt-3 w-full"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : saved ? "Saved!" : "Save name"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-amber-800">
                Reset queue numbering
              </h2>
              <p className="mt-1 text-sm text-amber-700">
                Clears every ticket (waiting, called, and done) so the next
                customer starts at number 1 again. Use this at the start of a new day.
              </p>
            </div>
          </div>
          <Button
            onClick={handleResetQueue}
            disabled={resetting}
            variant="outline"
            className="mt-4 w-full border-amber-300 bg-white text-amber-700 hover:bg-amber-100"
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : resetDone ? (
              <Check className="h-4 w-4" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {resetting ? "Resetting…" : resetDone ? "Queue reset!" : "Reset queue for today"}
          </Button>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Trash2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-red-800">Delete store</h2>
              <p className="mt-1 text-sm text-red-700">
                Permanently removes this store and all of its tickets. This cannot be undone.
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={deleting} variant="destructive" className="mt-4 w-full">
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? "Deleting…" : "Delete store"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this store?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes {originalName || "this store"} and all of its tickets. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteStore}
                  disabled={deleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {deleting ? "Deleting…" : "Yes, delete store"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </div>
  );
}