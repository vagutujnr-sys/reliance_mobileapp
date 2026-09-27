"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, getSession, setSession } from "@/lib/auth/session";
import { changePin, loginWithPassword, loginWithPhone } from "@/lib/server/auth-service";
import {
  acceptHandover,
  arriveAtPickup,
  finishTrip,
  markNotificationsRead,
  openHandover,
  recordLocation,
  saveTripPhoto,
  startTrip,
  submitInspection,
} from "@/lib/server/driver-service";
import { submitPaymentProof } from "@/lib/server/owner-service";
import {
  addDriverPayment,
  confirmCheckpoint,
  createClientAccount,
  createDriverAccount,
  createInvoice,
  createStaffAccount,
  createTrip,
  issuePin,
  saveCompany,
  saveVehicle,
  setAccess,
  setChatOverride,
  verifyPayment,
} from "@/lib/server/admin-service";
import { sendChat } from "@/lib/server/chat-service";
import type { AccountStatus, Condition, FuelLevel, PhotoSlot, VehicleStatus } from "@/lib/data/types";
import { ServiceError } from "@/lib/server/context";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function fail(error: unknown): ActionResult<never> {
  if (error instanceof ServiceError || error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Something went wrong. Please try again." };
}

async function clientIp() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function mobileLogin(phone: string, pin: string): Promise<ActionResult<{ href: string }>> {
  try {
    const account = await loginWithPhone(phone, pin, await clientIp());
    if (account.role !== "driver" && account.role !== "client") {
      return { ok: false, error: "This phone number is not enabled for the mobile app." };
    }
    await setSession({ sub: account.id, role: account.role, name: account.name });
    return { ok: true, data: { href: account.role === "driver" ? "/driver" : "/owner" } };
  } catch (error) {
    return fail(error);
  }
}

export async function adminLogin(email: string, password: string): Promise<ActionResult> {
  try {
    const account = await loginWithPassword(email, password);
    await setSession({ sub: account.id, role: account.role, name: account.name });
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function logout() {
  const session = await getSession();
  await clearSession();
  redirect(session?.role === "admin" || session?.role === "super_admin" ? "/admin/login" : "/login");
}

export async function updatePin(currentPin: string, nextPin: string): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session) return { ok: false, error: "Sign in again." };
    await changePin(session.sub, currentPin, nextPin);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function markArrived(tripId: string, coords: { latitude: number; longitude: number } | null): Promise<ActionResult> {
  try {
    const session = await requireMobile("driver");
    await arriveAtPickup(session.sub, tripId, coords);
    revalidatePath(`/driver/trips/${tripId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function uploadTripPhoto(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    const session = await requireMobile("driver");
    const tripId = String(formData.get("tripId") || "");
    const slot = String(formData.get("slot") || "") as PhotoSlot;
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a photo." };
    if (file.size > 8_000_000) return { ok: false, error: "Photos must be under 8MB." };
    if (!file.type.startsWith("image/")) return { ok: false, error: "Upload an image file." };
    const extension = file.type.includes("png") ? "png" : "jpg";
    const name = `${tripId}-${slot}-${Date.now()}.${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/${name}`;
    await saveTripPhoto(session.sub, tripId, slot, url);
    revalidatePath(`/driver/trips/${tripId}/pickup`);
    return { ok: true, data: { url } };
  } catch (error) {
    return fail(error);
  }
}

export async function saveInspection(input: {
  tripId: string;
  exterior: Condition;
  tyres: Condition;
  windows: Condition;
  lights: Condition;
  fuelLevel: FuelLevel;
  visibleDamage: boolean;
  notes: string;
}): Promise<ActionResult> {
  try {
    const session = await requireMobile("driver");
    await submitInspection(session.sub, input.tripId, input);
    revalidatePath(`/driver/trips/${input.tripId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function beginTrip(tripId: string, coords: { latitude: number; longitude: number } | null): Promise<ActionResult> {
  try {
    const session = await requireMobile("driver");
    await startTrip(session.sub, tripId, coords);
    revalidatePath("/driver");
    revalidatePath(`/driver/trips/${tripId}/tracking`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function endTrip(tripId: string, coords: { latitude: number; longitude: number } | null): Promise<ActionResult> {
  try {
    const session = await requireMobile("driver");
    await finishTrip(session.sub, tripId, coords);
    revalidatePath("/driver");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function pushLocation(input: {
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speedKmh: number | null;
}): Promise<ActionResult<{ milestone: string | null }>> {
  try {
    const session = await requireMobile("driver");
    const result = await recordLocation(session.sub, input.tripId, input);
    return { ok: true, data: { milestone: result.milestone } };
  } catch (error) {
    return fail(error);
  }
}

export async function createHandoverCode(tripId: string): Promise<ActionResult<{ code: string; token: string; vehicle: string; registration: string; destination: string }>> {
  try {
    const session = await requireMobile("driver");
    const data = await openHandover(session.sub, tripId);
    return { ok: true, data };
  } catch (error) {
    return fail(error);
  }
}

export async function receiveHandover(tokenOrCode: string, coords: { latitude: number; longitude: number } | null): Promise<ActionResult<{ tripId: string }>> {
  try {
    const session = await requireMobile("driver");
    const data = await acceptHandover(session.sub, tokenOrCode, coords);
    revalidatePath("/driver");
    return { ok: true, data: { tripId: data.tripId } };
  } catch (error) {
    return fail(error);
  }
}

export async function readNotifications(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await markNotificationsRead(session.sub);
  revalidatePath("/driver/notifications");
}

export async function uploadProof(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireMobile("client");
    const paymentId = String(formData.get("paymentId") || "");
    const reference = String(formData.get("reference") || "");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Attach proof of payment." };
    const name = `proof-${paymentId}-${Date.now()}`;
    const directory = path.join(process.cwd(), "storage", "private");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()));
    await submitPaymentProof(session.sub, paymentId, `private://${name}`, reference);
    revalidatePath("/owner/payments");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function postMessage(conversationId: string, body: string): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session) return { ok: false, error: "Sign in again." };
    await sendChat(session.sub, conversationId, body);
    revalidatePath("/admin/chat");
    revalidatePath("/owner/chat");
    revalidatePath("/driver/chat");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function adminCreateClient(input: { fullName: string; phone: string; email: string; address: string; appAccess: boolean }): Promise<ActionResult<{ pin: string | null }>> {
  try {
    const session = await requireStaff();
    const data = await createClientAccount(session.sub, input);
    revalidatePath("/admin/clients");
    return { ok: true, data: { pin: data.pin } };
  } catch (error) {
    return fail(error);
  }
}

export async function adminCreateDriver(input: { fullName: string; phone: string; licenceNumber: string; nationalId: string }): Promise<ActionResult<{ pin: string; code: string }>> {
  try {
    const session = await requireStaff();
    const data = await createDriverAccount(session.sub, input);
    revalidatePath("/admin/drivers");
    return { ok: true, data: { pin: data.pin, code: data.code } };
  } catch (error) {
    return fail(error);
  }
}

export async function adminSaveVehicle(input: {
  id?: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  colour: string;
  registration: string;
  vin: string;
  engineNumber: string;
  origin: string;
  destination: string;
  shippingReference: string;
  insuranceStatus: "insured" | "not_insured";
  insuranceProvider: string;
  insuranceExpiry: string;
  status: VehicleStatus;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireStaff();
    const id = await saveVehicle(session.sub, input);
    revalidatePath("/admin/vehicles");
    return { ok: true, data: { id } };
  } catch (error) {
    return fail(error);
  }
}

export async function adminCreateTrip(input: { vehicleId: string; driverId: string; origin: string; destination: string; eta: string; distanceKm: number }): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireStaff();
    const id = await createTrip(session.sub, input);
    revalidatePath("/admin/trips");
    return { ok: true, data: { id } };
  } catch (error) {
    return fail(error);
  }
}

export async function adminCreateInvoice(input: { clientId: string; vehicleId: string; description: string; amount: number; dueOn: string; notes: string }): Promise<ActionResult> {
  try {
    const session = await requireStaff();
    await createInvoice(session.sub, input);
    revalidatePath("/admin/invoices");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function adminVerifyPayment(paymentId: string, approve: boolean): Promise<ActionResult> {
  try {
    const session = await requireStaff();
    await verifyPayment(session.sub, paymentId, approve);
    revalidatePath("/admin/payments");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function adminAddDriverPayment(input: { driverId: string; route: string; amount: number; status: "pending" | "approved" | "paid" }): Promise<ActionResult> {
  try {
    const session = await requireStaff();
    await addDriverPayment(session.sub, input);
    revalidatePath("/admin/payments");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function adminSetAccess(kind: "client" | "driver", id: string, status: AccountStatus): Promise<ActionResult> {
  try {
    const session = await requireStaff();
    await setAccess(session.sub, kind, id, status);
    revalidatePath("/admin/clients");
    revalidatePath("/admin/drivers");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function adminIssuePin(kind: "client" | "driver", id: string): Promise<ActionResult<{ pin: string }>> {
  try {
    const session = await requireStaff();
    const pin = await issuePin(session.sub, kind, id);
    return { ok: true, data: { pin } };
  } catch (error) {
    return fail(error);
  }
}

export async function adminConfirmCheckpoint(tripId: string, checkpointId: string): Promise<ActionResult> {
  try {
    const session = await requireStaff();
    await confirmCheckpoint(session.sub, tripId, checkpointId);
    revalidatePath("/admin/live");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function adminSaveSettings(input: { supportPhone: string; supportEmail: string; paymentInstructions: string }): Promise<ActionResult> {
  try {
    const session = await requireStaff();
    await saveCompany(session.sub, input);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function adminCreateStaff(input: { fullName: string; email: string; password: string }): Promise<ActionResult> {
  try {
    const session = await requireStaff();
    await createStaffAccount(session.sub, input);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function adminChatMode(clientId: string, override: "auto" | "open" | "closed"): Promise<ActionResult> {
  try {
    const session = await requireStaff();
    await setChatOverride(session.sub, clientId, override);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

async function requireMobile(role: "driver" | "client") {
  const session = await getSession();
  if (!session || session.role !== role) throw new ServiceError("Sign in again.");
  return session;
}

async function requireStaff() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) throw new ServiceError("Admin access is required.");
  return session;
}
