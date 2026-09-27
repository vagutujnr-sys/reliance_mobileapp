import "server-only";
import { formatDateTime } from "@/lib/format";
import { chatAllowed } from "@/lib/domain/journey";
import type { Conversation } from "@/lib/data/types";
import type { ChatThread } from "@/lib/data/views";
import { db, notify, nowIso, ServiceError } from "@/lib/server/context";

export async function inboxFor(profileId: string) {
  const repo = await db();
  const profile = await repo.getProfile(profileId);
  if (!profile) throw new ServiceError("Account not found.");
  const all = await repo.listConversations();
  if (profile.role === "admin" || profile.role === "super_admin") {
    return all.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)).map(presentAdmin);
  }
  return all.filter((item) => item.profileId === profileId).map((item) => presentUser(item));
}

function presentAdmin(conversation: Conversation) {
  return {
    id: conversation.id,
    title: conversation.title,
    kind: conversation.kind,
    preview: conversation.lastMessage,
    time: formatDateTime(conversation.lastMessageAt),
    unread: conversation.unreadForAdmin,
  };
}

function presentUser(conversation: Conversation) {
  return {
    id: conversation.id,
    title: conversation.title,
    kind: conversation.kind,
    preview: conversation.lastMessage,
    time: formatDateTime(conversation.lastMessageAt),
    unread: conversation.unreadForProfile,
  };
}

export async function getThread(profileId: string, conversationId: string): Promise<ChatThread> {
  const repo = await db();
  const profile = await repo.getProfile(profileId);
  const conversation = (await repo.listConversations()).find((item) => item.id === conversationId);
  if (!profile || !conversation) throw new ServiceError("Conversation not found.");
  const staff = profile.role === "admin" || profile.role === "super_admin";
  if (!staff && conversation.profileId !== profileId) throw new ServiceError("Conversation not found.");
  const open = await threadOpen(repo, conversation, staff);
  const messages = await repo.listMessages(conversation.id);
  if (staff && conversation.unreadForAdmin) {
    conversation.unreadForAdmin = 0;
    await repo.saveConversation(conversation);
  }
  if (!staff && conversation.unreadForProfile) {
    conversation.unreadForProfile = 0;
    await repo.saveConversation(conversation);
  }
  return {
    id: conversation.id,
    title: staff ? conversationTitle(conversation) : "Reliance Mobility",
    open: open.ok,
    closedReason: open.ok ? null : open.reason,
    messages: messages.map((message) => ({
      id: message.id,
      mine: staff ? message.senderRole === "admin" : message.senderRole === profile.role,
      sender: message.senderName,
      body: message.body,
      timeLabel: formatDateTime(message.createdAt),
    })),
  };
}

function conversationTitle(conversation: Conversation) {
  return conversation.kind === "driver_admin" ? `Driver · ${conversation.title}` : conversation.title;
}

async function threadOpen(repo: Awaited<ReturnType<typeof db>>, conversation: Conversation, staff: boolean) {
  if (conversation.kind === "driver_admin") return { ok: true, reason: "" };
  if (staff) return { ok: true, reason: "" };
  const client = await repo.getClient(conversation.participantId);
  if (!client) return { ok: false, reason: "Chat is not available." };
  const vehicles = (await repo.listVehicles()).filter((item) => item.ownerId === client.id);
  const checkpoints = await repo.listCheckpoints();
  for (const vehicle of vehicles) {
    const trip = (await repo.listTrips()).filter((item) => item.vehicleId === vehicle.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const reached = trip ? await repo.listReached(trip.id) : [];
    if (chatAllowed({ override: client.chatOverride, appAccess: client.appAccess, checkpoints, reached, status: vehicle.status })) {
      return { ok: true, reason: "" };
    }
  }
  return { ok: false, reason: "Chat opens when your vehicle reaches South Africa, or when Reliance enables it." };
}

export async function sendChat(profileId: string, conversationId: string, body: string) {
  const text = body.trim();
  if (!text) throw new ServiceError("Write a message first.");
  const repo = await db();
  const profile = await repo.getProfile(profileId);
  const conversation = (await repo.listConversations()).find((item) => item.id === conversationId);
  if (!profile || !conversation) throw new ServiceError("Conversation not found.");
  const staff = profile.role === "admin" || profile.role === "super_admin";
  if (!staff && conversation.profileId !== profileId) throw new ServiceError("Conversation not found.");
  const open = await threadOpen(repo, conversation, staff);
  if (!open.ok) throw new ServiceError(open.reason);
  const role = staff ? "admin" : profile.role === "driver" ? "driver" : "client";
  await repo.saveMessage({
    id: crypto.randomUUID(),
    conversationId,
    senderRole: role,
    senderName: staff ? "Reliance Mobility" : profile.fullName,
    body: text,
    createdAt: nowIso(),
  });
  conversation.lastMessage = text;
  conversation.lastMessageAt = nowIso();
  if (staff) conversation.unreadForProfile += 1;
  else conversation.unreadForAdmin += 1;
  await repo.saveConversation(conversation);
  if (!staff) {
    const admins = (await repo.listProfiles()).filter((item) => item.role === "admin" || item.role === "super_admin");
    for (const admin of admins) await notify(repo, admin.id, "New message", `${profile.fullName}: ${text.slice(0, 80)}`, "/admin/chat");
  } else {
    await notify(repo, conversation.profileId, "Reliance Mobility", text.slice(0, 120), profile.role === "driver" ? "/driver/chat" : "/owner/chat");
  }
}
