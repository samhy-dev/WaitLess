import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Advances a store's queue: marks the currently "called" ticket (if any) as
// "done", then marks the lowest-numbered "waiting" ticket as "called" — which
// triggers a realtime alert on that customer's phone. Returns the newly
// called ticket, or { called: null } if no one is waiting.
// Frontend calls this via base44.functions.invoke("callTicket", { store_id }).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const storeId = body.store_id;

    if (!storeId) {
      return Response.json({ error: "store_id is required" }, { status: 400 });
    }

    // Mark any currently-called ticket as done (they've been served).
    const currentlyCalled = await base44.asServiceRole.entities.Ticket.filter(
      { store_id: storeId, status: "called" },
      "ticket_number"
    );
    for (const t of currentlyCalled) {
      await base44.asServiceRole.entities.Ticket.update(t.id, { status: "done" });
    }

    // Find the next waiting ticket (lowest number first).
    const waiting = await base44.asServiceRole.entities.Ticket.filter(
      { store_id: storeId, status: "waiting" },
      "ticket_number",
      1
    );

    if (waiting.length === 0) {
      return Response.json({ called: null });
    }

    const called = await base44.asServiceRole.entities.Ticket.update(
      waiting[0].id,
      { status: "called" }
    );
    return Response.json({ called });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});