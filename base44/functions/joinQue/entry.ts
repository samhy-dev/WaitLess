import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Customer joins a store's queue. Generates the next sequential ticket number
// for that store and creates a "waiting" ticket. The frontend calls this via
// base44.functions.invoke("joinQueue", { store_id }).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const storeId = body.store_id;

    if (!storeId) {
      return Response.json({ error: "store_id is required" }, { status: 400 });
    }

    // Find this store's highest ticket number so far (sort desc, take 1).
    const latest = await base44.asServiceRole.entities.Ticket.filter(
      { store_id: storeId },
      "-ticket_number",
      1
    );
    const nextNumber = latest.length > 0 ? latest[0].ticket_number + 1 : 1;

    // Create the ticket with the computed next number.
    let ticket = await base44.asServiceRole.entities.Ticket.create({
      store_id: storeId,
      ticket_number: nextNumber,
      status: "waiting"
    });

    // Guard against two customers joining at the exact same instant (both
    // computed the same number). If a clash is detected, the later ticket
    // (by id) is bumped past the true maximum.
    const clashes = await base44.asServiceRole.entities.Ticket.filter(
      { store_id: storeId, ticket_number: nextNumber }
    );
    if (clashes.some((c) => c.id < ticket.id)) {
      const trueMax = await base44.asServiceRole.entities.Ticket.filter(
        { store_id: storeId },
        "-ticket_number",
        1
      );
      const safeNumber = (trueMax[0]?.ticket_number || nextNumber) + 1;
      ticket = await base44.asServiceRole.entities.Ticket.update(ticket.id, {
        ticket_number: safeNumber
      });
    }

    return Response.json(ticket);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});