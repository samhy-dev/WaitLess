import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
          <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
          <p className="mt-1 text-xs text-slate-400">Last updated: July 2026</p>
        </div>

        <p>
          By creating an account or using WaitLess, you agree to these Terms of Service.
          Please read them carefully.
        </p>

        <section>
          <h2 className="font-semibold text-slate-900">1. Use of Service</h2>
          <p className="mt-2">
            WaitLess provides a virtual queue management tool for businesses. You agree
            to use the service only for lawful purposes and not to misuse, disrupt, or
            attempt to gain unauthorized access to the system.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">2. Account Responsibility</h2>
          <p className="mt-2">
            You are responsible for maintaining the confidentiality of your account
            credentials and for all activity that occurs under your account.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">3. Availability</h2>
          <p className="mt-2">
            WaitLess is provided "as is" without warranties of any kind. We do not
            guarantee uninterrupted or error-free service and are not liable for any
            loss of data, revenue, or business resulting from service interruptions.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">4. Data & Deletion</h2>
          <p className="mt-2">
            You may delete your store and its associated data at any time via Store
            Settings. Deleted data cannot be recovered.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">5. Changes to These Terms</h2>
          <p className="mt-2">
            We may update these Terms from time to time. Continued use of WaitLess
            after changes take effect constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">6. Contact Us</h2>
          <p className="mt-2">
            Questions about these Terms can be sent to{" "}
            <a href="mailto:waitlessqueue@gmail.com" className="text-primary underline">
              waitlessqueue@gmail.com
            </a>.
          </p>
        </section>
      </main>
    </div>
  );
}