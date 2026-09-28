import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Repo } from "@/lib/data/types";

type DbRow = Record<string, unknown>;
type TableName =
  | "profiles"
  | "mobile_credentials"
  | "staff_secrets"
  | "auth_attempts"
  | "drivers"
  | "clients"
  | "vehicles"
  | "trips"
  | "trip_assignments"
  | "trip_images"
  | "inspections"
  | "trip_locations"
  | "checkpoints"
  | "trip_checkpoints"
  | "vehicle_handovers"
  | "driver_documents"
  | "invoices"
  | "invoice_items"
  | "payments"
  | "receipts"
  | "driver_payments"
  | "conversations"
  | "messages"
  | "notifications"
  | "activity_logs"
  | "company_settings";

let supabase: SupabaseClient | undefined;

function client() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is required. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabase;
}

function rowToModel<T>(row: DbRow): T {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase()),
      value,
    ]),
  ) as T;
}

function modelToRow(value: object): DbRow {
  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => [
      key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      field,
    ]),
  );
}

async function unwrap<T>(
  response: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await response;
  if (error) throw new Error(`Supabase request failed: ${error.message}`);
  return data as T;
}

async function listRows(table: TableName, orderBy?: string) {
  let query = client().from(table).select("*");
  if (orderBy) query = query.order(orderBy, { ascending: true });
  return unwrap<DbRow[]>(query);
}

async function findRow(table: TableName, column: string, value: string) {
  return unwrap<DbRow | null>(
    client().from(table).select("*").eq(column, value).maybeSingle(),
  );
}

async function saveRow(table: TableName, value: object, onConflict = "id") {
  await unwrap<unknown>(
    client().from(table).upsert(modelToRow(value), { onConflict }),
  );
}

async function insertRow(table: TableName, value: object) {
  await unwrap<unknown>(client().from(table).insert(modelToRow(value)));
}

function models<T>(rows: DbRow[]) {
  return rows.map((row) => rowToModel<T>(row));
}

export const supabaseRepo: Repo = {
  async getProfile(id) {
    const row = await findRow("profiles", "id", id);
    return row ? rowToModel<Awaited<ReturnType<Repo["getProfile"]>> extends infer T ? NonNullable<T> : never>(row) : null;
  },
  async listProfiles() {
    return models<Parameters<Repo["saveProfile"]>[0]>(await listRows("profiles"));
  },
  async saveProfile(profile) {
    await saveRow("profiles", profile);
  },
  async findCredential(phone) {
    const row = await findRow("mobile_credentials", "phone", phone);
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["findCredential"]>>>>(row) : null;
  },
  async saveCredential(credential) {
    await saveRow("mobile_credentials", credential, "profile_id");
  },
  async findAdmin(email) {
    const row = await findRow("staff_secrets", "email", email.toLowerCase());
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["findAdmin"]>>>>(row) : null;
  },
  async saveAdmin(secret) {
    await saveRow("staff_secrets", secret, "profile_id");
  },
  async logAttempt(attempt) {
    await insertRow("auth_attempts", attempt);
  },
  async recentAttempts(ip, sinceIso) {
    const { count, error } = await client()
      .from("auth_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("success", false)
      .gte("created_at", sinceIso);
    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return count ?? 0;
  },
  async getDriverByProfile(profileId) {
    const row = await findRow("drivers", "profile_id", profileId);
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["getDriverByProfile"]>>>>(row) : null;
  },
  async getDriver(id) {
    const row = await findRow("drivers", "id", id);
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["getDriver"]>>>>(row) : null;
  },
  async listDrivers() {
    return models<NonNullable<Awaited<ReturnType<Repo["getDriver"]>>>>(await listRows("drivers"));
  },
  async saveDriver(driver) {
    await saveRow("drivers", driver);
  },
  async getClientByProfile(profileId) {
    const row = await findRow("clients", "profile_id", profileId);
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["getClientByProfile"]>>>>(row) : null;
  },
  async getClient(id) {
    const row = await findRow("clients", "id", id);
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["getClient"]>>>>(row) : null;
  },
  async listClients() {
    return models<NonNullable<Awaited<ReturnType<Repo["getClient"]>>>>(await listRows("clients"));
  },
  async saveClient(value) {
    await saveRow("clients", value);
  },
  async listVehicles() {
    return models<NonNullable<Awaited<ReturnType<Repo["getVehicle"]>>>>(await listRows("vehicles"));
  },
  async getVehicle(id) {
    const row = await findRow("vehicles", "id", id);
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["getVehicle"]>>>>(row) : null;
  },
  async saveVehicle(vehicle) {
    await saveRow("vehicles", vehicle);
  },
  async listTrips() {
    return models<NonNullable<Awaited<ReturnType<Repo["getTrip"]>>>>(await listRows("trips"));
  },
  async getTrip(id) {
    const row = await findRow("trips", "id", id);
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["getTrip"]>>>>(row) : null;
  },
  async saveTrip(trip) {
    await saveRow("trips", trip);
  },
  async listAssignments() {
    return models<NonNullable<Awaited<ReturnType<Repo["listAssignments"]>>[number]>>(await listRows("trip_assignments"));
  },
  async saveAssignment(assignment) {
    await saveRow("trip_assignments", assignment);
  },
  async listPhotos(tripId) {
    const rows = await unwrap<DbRow[]>(client().from("trip_images").select("*").eq("trip_id", tripId));
    return models<NonNullable<Awaited<ReturnType<Repo["listPhotos"]>>[number]>>(rows);
  },
  async savePhoto(photo) {
    await saveRow("trip_images", photo);
  },
  async getInspection(tripId) {
    const row = await findRow("inspections", "trip_id", tripId);
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["getInspection"]>>>>(row) : null;
  },
  async saveInspection(inspection) {
    await saveRow("inspections", inspection, "trip_id");
  },
  async latestLocation(tripId) {
    const row = await unwrap<DbRow | null>(
      client().from("trip_locations").select("*").eq("trip_id", tripId).order("recorded_at", { ascending: false }).limit(1).maybeSingle(),
    );
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["latestLocation"]>>>>(row) : null;
  },
  async listLocations(tripId) {
    const rows = await unwrap<DbRow[]>(
      client().from("trip_locations").select("*").eq("trip_id", tripId).order("recorded_at", { ascending: true }),
    );
    return models<NonNullable<Awaited<ReturnType<Repo["listLocations"]>>[number]>>(rows);
  },
  async latestFleetLocations() {
    const rows = await unwrap<DbRow[]>(client().from("trip_locations").select("*").order("recorded_at", { ascending: false }));
    const latestByTrip = new Map<string, DbRow>();
    for (const row of rows) {
      const tripId = String(row.trip_id);
      if (!latestByTrip.has(tripId)) latestByTrip.set(tripId, row);
    }
    return models<NonNullable<Awaited<ReturnType<Repo["latestFleetLocations"]>>[number]>>([...latestByTrip.values()]);
  },
  async saveLocation(location) {
    await insertRow("trip_locations", location);
  },
  async listCheckpoints() {
    return models<NonNullable<Awaited<ReturnType<Repo["listCheckpoints"]>>[number]>>(await listRows("checkpoints", "sort_order"));
  },
  async listReached(tripId) {
    let query = client().from("trip_checkpoints").select("*").order("reached_at", { ascending: true });
    if (tripId) query = query.eq("trip_id", tripId);
    return models<NonNullable<Awaited<ReturnType<Repo["listReached"]>>[number]>>(await unwrap<DbRow[]>(query));
  },
  async saveReached(entry) {
    await saveRow("trip_checkpoints", entry, "trip_id,checkpoint_id");
  },
  async listHandovers(tripId) {
    let query = client().from("vehicle_handovers").select("*").order("created_at", { ascending: false });
    if (tripId) query = query.eq("trip_id", tripId);
    return models<NonNullable<Awaited<ReturnType<Repo["listHandovers"]>>[number]>>(await unwrap<DbRow[]>(query));
  },
  async findHandover(tokenOrCode) {
    const token = tokenOrCode.trim();
    const byToken = await findRow("vehicle_handovers", "token", token);
    const row = byToken ?? await findRow("vehicle_handovers", "code", token);
    return row ? rowToModel<NonNullable<Awaited<ReturnType<Repo["findHandover"]>>>>(row) : null;
  },
  async saveHandover(handover) {
    await saveRow("vehicle_handovers", handover);
  },
  async listDocuments(driverId) {
    const rows = await unwrap<DbRow[]>(client().from("driver_documents").select("*").eq("driver_id", driverId).order("created_at", { ascending: false }));
    return models<NonNullable<Awaited<ReturnType<Repo["listDocuments"]>>[number]>>(rows);
  },
  async saveDocument(document) {
    await saveRow("driver_documents", document);
  },
  async listInvoices() {
    const [invoiceRows, itemRows] = await Promise.all([
      listRows("invoices", "issued_on"),
      listRows("invoice_items"),
    ]);
    const itemsByInvoice = new Map<string, DbRow[]>();
    for (const item of itemRows) {
      const invoiceId = String(item.invoice_id);
      const items = itemsByInvoice.get(invoiceId) ?? [];
      items.push(item);
      itemsByInvoice.set(invoiceId, items);
    }
    return invoiceRows.map((row) => ({
      ...rowToModel<Omit<NonNullable<Awaited<ReturnType<Repo["listInvoices"]>>[number]>, "items">>(row),
      items: models<NonNullable<Awaited<ReturnType<Repo["listInvoices"]>>[number]["items"][number]>>(
        itemsByInvoice.get(String(row.id)) ?? [],
      ),
    }));
  },
  async saveInvoice(invoice) {
    const { items, ...record } = invoice;
    await saveRow("invoices", record);
    if (items.length > 0) {
      await unwrap<unknown>(client().from("invoice_items").upsert(
        items.map((item) => modelToRow({ ...item, invoiceId: invoice.id })),
      ));
    }
  },
  async nextInvoiceNumber() {
    return unwrap<string>(client().rpc("next_invoice_number"));
  },
  async nextReceiptNumber() {
    return unwrap<string>(client().rpc("next_receipt_number"));
  },
  async listPayments() {
    return models<NonNullable<Awaited<ReturnType<Repo["listPayments"]>>[number]>>(await listRows("payments", "created_at"));
  },
  async savePayment(payment) {
    await saveRow("payments", payment);
  },
  async listReceipts() {
    return models<NonNullable<Awaited<ReturnType<Repo["listReceipts"]>>[number]>>(await listRows("receipts", "issued_on"));
  },
  async saveReceipt(receipt) {
    await saveRow("receipts", receipt);
  },
  async listDriverPayments(driverId) {
    let query = client().from("driver_payments").select("*").order("created_at", { ascending: false });
    if (driverId) query = query.eq("driver_id", driverId);
    return models<NonNullable<Awaited<ReturnType<Repo["listDriverPayments"]>>[number]>>(await unwrap<DbRow[]>(query));
  },
  async saveDriverPayment(payment) {
    await saveRow("driver_payments", payment);
  },
  async listConversations() {
    return models<NonNullable<Awaited<ReturnType<Repo["listConversations"]>>[number]>>(await listRows("conversations", "last_message_at"));
  },
  async saveConversation(conversation) {
    await saveRow("conversations", conversation);
  },
  async listMessages(conversationId) {
    const rows = await unwrap<DbRow[]>(client().from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }));
    return models<NonNullable<Awaited<ReturnType<Repo["listMessages"]>>[number]>>(rows);
  },
  async saveMessage(message) {
    await saveRow("messages", message);
  },
  async listNotifications(profileId) {
    const rows = await unwrap<DbRow[]>(client().from("notifications").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }));
    return models<NonNullable<Awaited<ReturnType<Repo["listNotifications"]>>[number]>>(rows);
  },
  async saveNotification(notification) {
    await saveRow("notifications", notification);
  },
  async listActivity() {
    return models<NonNullable<Awaited<ReturnType<Repo["listActivity"]>>[number]>>(await listRows("activity_logs", "created_at")).reverse();
  },
  async logActivity(activity) {
    await insertRow("activity_logs", activity);
  },
  async getSettings() {
    const row = await unwrap<DbRow | null>(client().from("company_settings").select("*").eq("id", true).maybeSingle());
    if (!row) throw new Error("No company settings were found in Supabase.");
    const { id: _id, ...settings } = rowToModel<ReturnType<Repo["getSettings"]> extends Promise<infer T> ? T & { id?: boolean } : never>(row);
    return settings;
  },
  async saveSettings(settings) {
    await saveRow("company_settings", { ...settings, id: true });
  },
};
