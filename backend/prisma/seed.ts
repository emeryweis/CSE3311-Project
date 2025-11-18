/* seed_from_jsonl.ts
   Stream a JSONL file and upsert into Prisma `Location`.

   Usage:
     npx ts-node seed_from_jsonl.ts results/metadata_clean.jsonl
*/

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { PrismaClient, Prisma } from "@prisma/client";
import { loadEnv } from "../src/utils/loadEnv";

loadEnv();

const prisma = new PrismaClient();

type InputLoc = {
  name: string;
  description?: string | null;
  locationType: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  elevation?: number | null;
  terrainType?: string | null;
  climateZone?: string | null;
  amenities?: any | null;              // JSON
  costPerNight?: number | string | null;
  maxCapacity?: number | null;
  petFriendly?: boolean | null;
  reservationRequired?: boolean | null;
  seasonStart?: string | null;
  seasonEnd?: string | null;
  difficultyLevel?: number | null;
  safetyNotes?: string | null;
  regulations?: string | null;
  contactInfo?: Record<string, any> | null; // JSON
  websiteUrl?: string | null;
  images?: any[] | null;               // JSON
  verified?: boolean | null;
  isActive?: boolean | null;
  rating?: number | null;
  createdById?: string | null;
};

function normStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function asDecimal(v: unknown): Prisma.Decimal | null {
  if (v === null || v === undefined || v === "") return null;
  const s = typeof v === "string" ? v.trim() : String(v);
  if (!s || isNaN(Number(s))) return null;
  return new Prisma.Decimal(s);
}

function asDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return v instanceof Date ? v : null;
}

function roundCoord(n: number | null | undefined): number | null {
  if (typeof n !== "number" || !isFinite(n)) return null;
  return Math.round(n * 1000) / 1000; // ~110m precision
}

function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  for (const k of Object.keys(obj)) {
    if (obj[k] === undefined) delete obj[k];
  }
  return obj;
}

// Only fill DB null/empty fields with incoming values (no overwrites)
function mergePreferExisting<T extends Record<string, any>>(
  existing: T,
  incoming: T
): T {
  const out: T = { ...existing };
  for (const [k, incomingVal] of Object.entries(incoming)) {
    const currentVal = (existing as any)[k];
    const isNullish =
      currentVal === null ||
      currentVal === undefined ||
      (typeof currentVal === "string" && currentVal.trim() === "");
    if (isNullish && incomingVal !== undefined) {
      (out as any)[k] = incomingVal;
    }
  }
  return out;
}

async function upsertLocation(input: InputLoc) {
  // Map nullable JSONs:
  // - undefined -> omit key
  // - null      -> Prisma.DbNull (SQL NULL)
  // - value     -> value (as InputJsonValue)
  const amenitiesMapped =
    input.amenities === undefined
      ? undefined
      : input.amenities === null
      ? Prisma.DbNull
      : (input.amenities as Prisma.InputJsonValue);

  const contactInfoMapped =
    input.contactInfo === undefined
      ? undefined
      : input.contactInfo === null
      ? Prisma.DbNull
      : (input.contactInfo as Prisma.InputJsonValue);

  const imagesMapped =
    input.images === undefined
      ? undefined
      : input.images === null
      ? Prisma.DbNull
      : (input.images as Prisma.InputJsonValue);

  const rawPayload: any = {
    name: input.name,
    description: normStr(input.description),
    locationType: input.locationType || "Facility",
    latitude: input.latitude,
    longitude: input.longitude,
    address: normStr(input.address),
    city: normStr(input.city),
    state: normStr(input.state),
    country: normStr(input.country) || "US",
    elevation: input.elevation ?? null,
    terrainType: normStr(input.terrainType),
    climateZone: normStr(input.climateZone),

    amenities: amenitiesMapped,
    contactInfo: contactInfoMapped,
    images: imagesMapped,

    costPerNight: asDecimal(input.costPerNight),
    maxCapacity: typeof input.maxCapacity === "number" ? input.maxCapacity : null,
    petFriendly:
      input.petFriendly === null || input.petFriendly === undefined
        ? false
        : !!input.petFriendly,
    reservationRequired:
      input.reservationRequired === null || input.reservationRequired === undefined
        ? false
        : !!input.reservationRequired,
    seasonStart: asDate(input.seasonStart),
    seasonEnd: asDate(input.seasonEnd),
    difficultyLevel:
      typeof input.difficultyLevel === "number" ? input.difficultyLevel : null,
    safetyNotes: normStr(input.safetyNotes),
    regulations: normStr(input.regulations),
    websiteUrl: normStr(input.websiteUrl),
    verified: input.verified ?? true,
    isActive: input.isActive ?? true,
    rating: typeof input.rating === "number" ? input.rating : null,
    createdById: input.createdById ?? null, // must be null, not undefined
  };

  const payload = cleanUndefined(
    rawPayload
  ) as Prisma.LocationUncheckedCreateInput;

  // Find existing by websiteUrl OR name+rounded coords
  let existing: any = null;

  if (payload.websiteUrl) {
    existing = await prisma.location.findFirst({
      where: { websiteUrl: payload.websiteUrl },
    });
  }

  if (!existing) {
    const latKey = roundCoord(payload.latitude);
    const lonKey = roundCoord(payload.longitude);
    existing = await prisma.location.findFirst({
      where: {
        name: payload.name,
        latitude: {
          gte: (latKey ?? payload.latitude) - 0.001,
          lte: (latKey ?? payload.latitude) + 0.001,
        },
        longitude: {
          gte: (lonKey ?? payload.longitude) - 0.001,
          lte: (lonKey ?? payload.longitude) + 0.001,
        },
      },
    });
  }

  if (!existing) {
    const created = await prisma.location.create({ data: payload });
    return { action: "create", id: created.id };
  } else {
    const toUpdate = cleanUndefined(
      mergePreferExisting(existing, payload)
    ) as Prisma.LocationUncheckedCreateInput;
    delete (toUpdate as any).id;

    const updated = await prisma.location.update({
      where: { id: existing.id },
      data: toUpdate,
    });
    return { action: "update", id: updated.id };
  }
}

async function main() {
  const fileArg = process.argv[2] || path.join(__dirname, "metadata_clean.jsonl");
  const inputPath = path.resolve(process.cwd(), fileArg);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Seeding from: ${inputPath}`);
  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let read = 0,
    created = 0,
    updated = 0,
    skipped = 0,
    errors = 0;

  for await (const raw of rl) {
    const line = raw.trim();
    if (!line) continue;
    read++;
    try {
      const rec: InputLoc = JSON.parse(line);

      if (
        !rec.name ||
        typeof rec.latitude !== "number" ||
        typeof rec.longitude !== "number"
      ) {
        skipped++;
        continue;
      }

      const result = await upsertLocation(rec);
      if (result.action === "create") created++;
      else updated++;
    } catch (e: any) {
      errors++;
      console.error(`[line ${read}] ERROR:`, e?.message || e);
    }
  }

  console.log("\n===== Seed Summary =====");
  console.log(`Read lines:   ${read}`);
  console.log(`Created:      ${created}`);
  console.log(`Updated:      ${updated}`);
  console.log(`Skipped:      ${skipped}`);
  console.log(`Errors:       ${errors}`);
}

main()
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
