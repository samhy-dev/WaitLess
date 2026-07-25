import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Hourglass, Loader2, BellRing, CheckCircle2, Ticket as TicketIcon, Star } from "lucide-react";
import Logo from "@/components/Logo";
import { speakWithPrefs, buildAnnouncement, prefsFromStore } from "@/lib/voicePrefs";

const STORAGE_KEY = "waitless_ticket";

function announceTurn(ticketNumber, prefs) {
  speakWithPrefs(buildAnnouncement(ticketNumber), prefs);
}

let _audioCtx = null;

function unlockAudio() {
  try {
    if (!_audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) _audioCtx = new Ctx();
    }
    if (_audioCtx && _audioCtx.state === "suspended") _audioCtx.resume();
  } catch {}
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

function playChime() {
  try {
    const ctx = _audioCtx;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const tones = [659.25, 880.0, 1174.66];
    tones.forEach((freq, i) => {
      const delay = i * 0.16;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.3, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.36);
    });
  } catch {}
}

export default function JoinQueue() {
  const { storeId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [storeName, setStoreName] = useState("");
  const prevStatus = useRef(null);
  const voicePrefsRef = useRef(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  async function handleRate(n) {
    setRating(n);
    setRatingSubmitted(true);
    setRatingLoading(true);
    try {
      await supabase.from("tickets").update({ rating: n }).eq("id", ticket.id);
    } catch {
      // ignore — the thank-you still shows
    } finally {
      setRatingLoading(false);
    }
  }

  useEffect(() => {
    supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single()
      .then(({ data: s }) => {
        if (s) {
          setStoreName(s.name || "");
          voicePrefsRef.current = prefsFromStore(s);
        }
      });
  }, [storeId]);

  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && saved.store_id === storeId && saved.ticket_id) {
      supabase
        .from("tickets")
        .select("*")
        .eq("id", saved.ticket_id)
        .single()
        .then(({ data, error }) => {
          if (error) localStorage.removeItem(STORAGE_KEY);
          else setTicket(data);
        });
    }
  }, [storeId]);

  // Realtime: makinig sa pagbabago ng ating ticket
  useEffect(() => {
    if (!ticket?.id) return;
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tickets", filter: `id=eq.${ticket.id}` },
        (payload) => setTicket(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket?.id]);

  const prevCallCount = useRef(null);
  useEffect(() => {
    if (ticket?.status === "called") {
      const firstCall = prevStatus.current !== "called";
      const repeated = (ticket.call_count ?? null) !== prevCallCount.current;
      if (firstCall || repeated) {
        playChime();
        announceTurn(ticket.ticket_number, voicePrefsRef.current);
        try {
          navigator.vibrate?.([200, 100, 200, 100, 200]);
        } catch {}
      }
    }
    prevStatus.current = ticket?.status || null;
    prevCallCount.current = ticket?.call_count ?? null;
  }, [ticket?.status, ticket?.call_count]);

  async function handleGetNumber() {
    unlockAudio();
    setLoading(true);
    setError("");
    try {
      // Gumawa ng anonymous session kung wala pang session
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) throw anonError;
        session = data.session;
      }

      // Kunin ang pinakamataas na ticket_number sa store para malaman susunod na number
      const { data: lastTicket } = await supabase
        .from("tickets")
        .select("ticket_number")
        .eq("store_id", storeId)
        .order("ticket_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextNumber = (lastTicket?.ticket_number || 0) + 1;

      const { data: newTicket, error: insertError } = await supabase
        .from("tickets")
        .insert({
          store_id: storeId,
          ticket_number: nextNumber,
          status: "waiting"
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setTicket(newTicket);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ store_id: storeId, ticket_id: newTicket.id })
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-200 via-slate-50 to-slate-200 text-slate-900">
      <header className="mx-auto flex max-w-md items-center justify-center px-4 py-6">
        <div className="flex items-center gap-2.5">
          <Logo className="h-10 w-10 rounded-lg" />
          <span className="text-2xl font-bold tracking-tight">{storeName || "Waitless"}</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-16">
        {!ticket && (
          <div className="mt-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <TicketIcon className="h-7 w-7" />
            </span>
            {storeName && (
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Welcome to {storeName}
              </p>
            )}
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Get your queue number</h1>
            <p className="mt-2 text-sm text-slate-500">
              No need to stand around — get your number and we'll let you know when you're up.
            </p>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <Button
              onClick={handleGetNumber}
              disabled={loading}
              size="lg"
              className="mt-6 w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TicketIcon className="h-4 w-4" />
              )}
              {loading ? "Getting number…" : "Get my number"}
            </Button>
          </div>
        )}

        {ticket?.status === "waiting" && (
          <div className="mt-8 animate-fade-in">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Your number
              </p>
              <div className="mt-2 text-7xl font-bold tracking-tight text-amber-600">
                {ticket.ticket_number}
              </div>
              <p className="mt-4 text-sm font-medium text-amber-700">
                You're in line. We'll alert you the moment it's your turn.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-xs text-amber-500">
                <Hourglass className="h-3.5 w-3.5 animate-pulse" />
                Waiting…
              </span>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">
              Keep this page open. No need to refresh.
            </p>
          </div>
        )}

        {ticket?.status === "called" && (
          <div className="mt-8 animate-fade-in">
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-8 text-center shadow-lg ring-4 ring-emerald-200">
              <BellRing className="mx-auto h-10 w-10 animate-pulse text-emerald-600" />
              <h2 className="mt-3 text-2xl font-bold text-emerald-700">It's your turn!</h2>
              <div className="mt-3 text-7xl font-bold tracking-tight text-emerald-600">
                {ticket.ticket_number}
              </div>
              <p className="mt-4 text-sm font-medium text-emerald-700">
                Please head to the counter now.
              </p>
            </div>
          </div>
        )}

        {ticket?.status === "done" && (
          <div className="mt-8 animate-fade-in text-center">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <h2 className="mt-3 text-xl font-bold">You've been served</h2>
              <p className="mt-2 text-sm text-slate-500">
                Thanks for stopping by. See you next time!
              </p>

              {ticket.rating || ratingSubmitted ? (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-sm font-medium text-slate-700">You rated your visit</p>
                  <div className="mt-2 flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={
                          "h-7 w-7 " +
                          (n <= (ticket.rating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300")
                        }
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-emerald-600">Thanks for your feedback!</p>
                </div>
              ) : (
                <div
                  className="mt-5 border-t border-slate-100 pt-5"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <p className="text-sm font-medium text-slate-700">How was your experience?</p>
                  <div className="mt-2 flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={ratingLoading}
                        onClick={() => handleRate(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        className="p-0.5 disabled:opacity-50"
                      >
                        <Star
                          className={
                            "h-8 w-8 transition-colors " +
                            (n <= hoverRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 hover:text-amber-300")
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}