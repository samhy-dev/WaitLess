import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Creates a new store and returns it (with its id, which is encoded in the
// customer QR code URL). The frontend calls this via
// base44.functions.invoke("createStore", { name }).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const name = (body.name || "My Store").toString().trim() || "My Store";

    const store = await base44.asServiceRole.entities.Store.create({ name });
    return Response.json(store);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
