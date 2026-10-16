"use server";

import { randomBytes } from "node:crypto";
import type { PropertyPurpose, PropertyType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MAX_ACTIVE_ALERTS_PER_USER } from "@/lib/alerts/saved-search";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { safeInternalPath } from "@/lib/validation/profile";

const TYPES: readonly PropertyType[] = ["HOUSE", "APARTMENT", "STUDIO", "LAND", "COMMERCIAL_ROOM", "WAREHOUSE", "OTHER"];

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalCents(value: string) {
  if (!value) return null;
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 && amount <= 100_000_000 ? Math.round(amount * 100) : null;
}

function withParam(path: string, name: string, value: string) {
  const [base, hash] = path.split("#");
  return `${base}${base.includes("?") ? "&" : "?"}${name}=${value}${hash ? `#${hash}` : ""}`;
}

export async function createSavedSearch(formData: FormData) {
  const back = safeInternalPath(field(formData, "voltar"), "/imoveis");
  const user = await requireCurrentUser(back);
  if (field(formData, "consentimento") !== "1") redirect(withParam(back, "alerta", "erro"));

  const rateLimit = await checkRateLimit({ scope: "criar-alerta", identifier: user.id, limit: 20, windowSeconds: 60 * 60 });
  if (!rateLimit.allowed) redirect(withParam(back, "alerta", "limite"));

  const city = field(formData, "cidade")
    ? await prisma.city.findFirst({ where: { slug: field(formData, "cidade"), isActive: true }, select: { id: true } })
    : null;
  const neighborhood = city && field(formData, "bairro")
    ? await prisma.neighborhood.findFirst({ where: { cityId: city.id, slug: field(formData, "bairro"), needsReview: false }, select: { id: true } })
    : null;
  const finalidade = field(formData, "finalidade");
  const purpose: PropertyPurpose | null = finalidade === "aluguel" ? "RENT" : finalidade === "venda" ? "SALE" : null;
  const tipo = field(formData, "tipo") as PropertyType;
  const bedrooms = Number.parseInt(field(formData, "quartos"), 10);
  const criteria = {
    cityId: city?.id ?? null,
    neighborhoodId: neighborhood?.id ?? null,
    purpose,
    type: TYPES.includes(tipo) ? tipo : null,
    minPriceCents: optionalCents(field(formData, "precoMin")),
    maxPriceCents: optionalCents(field(formData, "precoMax")),
    minBedrooms: Number.isInteger(bedrooms) && bedrooms >= 0 && bedrooms <= 30 ? bedrooms : null,
  };

  const [activeCount, duplicate] = await Promise.all([
    prisma.savedSearch.count({ where: { userId: user.id, isActive: true } }),
    prisma.savedSearch.findFirst({ where: { userId: user.id, isActive: true, ...criteria }, select: { id: true } }),
  ]);
  if (duplicate) redirect(withParam(back, "alerta", "existe"));
  if (activeCount >= MAX_ACTIVE_ALERTS_PER_USER) redirect(withParam(back, "alerta", "maximo"));

  await prisma.savedSearch.create({
    data: { userId: user.id, ...criteria, unsubscribeToken: randomBytes(24).toString("base64url") },
  });
  revalidatePath("/alertas");
  redirect(withParam(back, "alerta", "criado"));
}

export async function deleteSavedSearch(formData: FormData) {
  const user = await requireCurrentUser("/alertas");
  const id = field(formData, "id");
  await prisma.savedSearch.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/alertas");
  redirect("/alertas?removido=1");
}

/** Cancelamento pelo link do e-mail, sem exigir login. */
export async function unsubscribeSavedSearch(formData: FormData) {
  const token = field(formData, "token");
  if (token) await prisma.savedSearch.updateMany({ where: { unsubscribeToken: token }, data: { isActive: false } });
  redirect("/alertas/cancelar?concluido=1");
}
