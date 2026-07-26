import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7 rounded-lg" />
            <span className="font-semibold">WaitLess</span>
          </div>
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 text-sm leading-relaxed text-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="mt-1 text-xs text-slate-400">Last updated: July 2026</p>
        </div>

        <p>
          WaitLess ("we," "our," or "us") respects your privacy. This Privacy Policy explains
          what information we collect, how we use it, and your rights regarding that information.
        </p>

        <section>
          <h2 className="font-semibold text-slate-900">1. Information We Collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account information: email address, and if you sign in with Google, your name and profile picture.</li>
            <li>Store information: store name and settings you create.</li>
            <li>Queue data: ticket numbers, timestamps, and optional customer feedback/ratings.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">2. How We Use Your Information</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>To create and manage your store account.</li>
            <li>To operate the queue system (ticket generation, notifications, analytics).</li>
            <li>To communicate with you regarding your account (e.g. password reset emails).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">3. Data Storage</h2>
          <p className="mt-2">
            Your data is stored securely using Supabase, a third-party database provider.
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">4. Your Rights</h2>
          <p className="mt-2">
            You may request access to, correction of, or deletion of your personal data
            at any time by contacting us. You can also delete your store directly from
            the Store Settings page, which removes all associated data.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">5. Cookies & Local Storage</h2>
          <p className="mt-2">
            WaitLess uses browser storage to keep you signed in and remember your
            preferences. We do not use third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">6. Contact Us</h2>
          <p className="mt-2">
            If you have questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:waitlessqueue@gmail.com" className="text-primary underline">
              waitlessqueue@gmail.com
            </a>.
          </p>
        </section>
      </main>
    </div>
  );
}