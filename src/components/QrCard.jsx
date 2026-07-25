import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Displays a QR code that opens the customer "join queue" page for a store.
// The store owner prints/displays this; customers scan it to grab a number.
export default function QrCard({ joinUrl }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&bgcolor=ffffff&data=${encodeURIComponent(joinUrl)}`;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <p className="text-sm font-semibold text-slate-700">Scan to join the queue</p>
      <p className="text-xs text-slate-400">
        Customers scan this to get a number on their phone
      </p>
      <img
        src={qrSrc}
        alt="Queue QR code"
        width={260}
        height={260}
        className="mx-auto mt-4 rounded-xl border border-slate-100"
      />
      <a href={qrSrc} target="_blank" rel="noreferrer" className="mt-4 inline-block">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
          Open / save QR
        </Button>
      </a>
    </div>
  );
}