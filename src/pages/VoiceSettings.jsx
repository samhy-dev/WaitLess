import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue } from
"@/components/ui/select";
import Logo from "@/components/Logo";
import { ArrowLeft, Volume2, RotateCcw, Loader2, Check, MessageSquare } from "lucide-react";
import {
  DEFAULT_VOICE_PREFS,
  DEFAULT_VOICE_MESSAGE,
  prefsFromStore,
  getAvailableVoices,
  buildAnnouncement,
  speakWithPrefs } from
"@/lib/voicePrefs";

export default function VoiceSettings() {
  const { storeId } = useParams();
  const [prefs, setPrefs] = useState(DEFAULT_VOICE_PREFS);
  const [messageDraft, setMessageDraft] = useState("");
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingMessage, setSavingMessage] = useState(false);
  const [messageSaved, setMessageSaved] = useState(false);

  useEffect(() => {
    supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single()
      .then(({ data: s }) => {
        if (s) {
          const p = prefsFromStore(s);
          setPrefs(p);
          setMessageDraft(p.voice_message);
        }
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => {
    const update = () => setVoices(getAvailableVoices());
    update();
    try {
      window.speechSynthesis.addEventListener("voiceschanged", update);
      return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", update);
    } catch {}
  }, []);

  async function persist(next) {
    setPrefs(next);
    setSaving(true);
    setSaved(false);
    try {
      await supabase
        .from("stores")
        .update({
          voice_uri: next.voice_uri,
          voice_rate: next.voice_rate,
          voice_pitch: next.voice_pitch
        })
        .eq("id", storeId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore — the staff can retry
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMessage() {
    setSavingMessage(true);
    setMessageSaved(false);
    try {
      await supabase
        .from("stores")
        .update({ voice_message: messageDraft })
        .eq("id", storeId);
      setPrefs((p) => ({ ...p, voice_message: messageDraft }));
      setMessageSaved(true);
      setTimeout(() => setMessageSaved(false), 2000);
    } catch {
      // ignore — the staff can retry
    } finally {
      setSavingMessage(false);
    }
  }

  function handleResetMessage() {
    setMessageDraft("");
  }

  function handleVoiceChange(v) {
    persist({ ...prefs, voice_uri: v === "__default" ? "" : v });
  }

  function handleRateCommit([v]) {
    persist({ ...prefs, voice_rate: v });
  }

  function handlePitchCommit([v]) {
    persist({ ...prefs, voice_pitch: v });
  }

  function handleReset() {
    persist({ ...DEFAULT_VOICE_PREFS, voice_message: prefs.voice_message });
  }

  function handleTest() {
    speakWithPrefs(buildAnnouncement(42, messageDraft), prefs);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link
            to={`/manage/${storeId}`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <ArrowLeft className="h-6 w-6" />
            <span className="text-lg">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Logo className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-semibold">Voice</span>
          </div>
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Volume2 className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-slate-800">Preview</h2>
              <p className="text-sm text-slate-500">
                Hear how the announcement sounds on this device.
              </p>
            </div>
          </div>
          <Button onClick={handleTest} size="lg" className="mt-4 w-full">
            <Volume2 className="h-5 w-5" />
            Play sample
          </Button>
          <p className="mt-2 text-center text-xs text-slate-400">
            "{buildAnnouncement(42, messageDraft)}"
          </p>
        </section>

        {loading ?
        <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div> :

        <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                <Label className="text-sm font-medium text-slate-700">Custom message</Label>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Write what gets said when it's a customer's turn. Use{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5">{"{number}"}</code> where the
                ticket number should go.
              </p>
              <Textarea
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                placeholder={DEFAULT_VOICE_MESSAGE}
                className="mt-3"
                rows={3}
              />
              <div className="mt-3 flex items-center justify-between">
                {messageSaved ?
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <Check className="h-4 w-4" /> Saved
                  </span> :
                savingMessage ?
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                  </span> :

                <button
                  onClick={handleResetMessage}
                  className="text-xs text-slate-400 underline hover:text-slate-600">
                    Use default wording
                  </button>
                }
                <Button onClick={handleSaveMessage} size="sm" disabled={savingMessage}>
                  Save message
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Label className="text-sm font-medium text-slate-700">Voice</Label>
              <p className="text-xs text-slate-400">
                Available voices depend on the device hearing it.
              </p>
              <Select
              value={prefs.voice_uri || "__default"}
              onValueChange={handleVoiceChange}>
                <SelectTrigger className="mt-3">
                  <SelectValue placeholder="Default voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default">Default voice</SelectItem>
                  {voices.map((v) =>
                <SelectItem key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </SelectItem>
                )}
                </SelectContent>
              </Select>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">Speed</Label>
                <span className="text-sm font-semibold text-slate-700">
                  {prefs.voice_rate.toFixed(2)}x
                </span>
              </div>
              <Slider
              value={[prefs.voice_rate]}
              min={0.5}
              max={1.5}
              step={0.05}
              onValueChange={([v]) => setPrefs((p) => ({ ...p, voice_rate: v }))}
              onValueCommit={handleRateCommit}
              className="mt-4" />
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">Pitch</Label>
                <span className="text-sm font-semibold text-slate-700">
                  {prefs.voice_pitch.toFixed(2)}
                </span>
              </div>
              <Slider
              value={[prefs.voice_pitch]}
              min={0}
              max={2}
              step={0.05}
              onValueChange={([v]) => setPrefs((p) => ({ ...p, voice_pitch: v }))}
              onValueCommit={handlePitchCommit}
              className="mt-4" />
            </section>

            <div className="flex items-center justify-between">
              {saved ?
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <Check className="h-4 w-4" /> Saved
                </span> :
            saving ?
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                </span> :

            <span className="text-xs text-slate-400">
                  Applies to every customer&rsquo;s &ldquo;your turn&rdquo; alert.
                </span>
            }
              <Button onClick={handleReset} variant="outline" disabled={saving}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </>
        }
      </main>
    </div>);

}