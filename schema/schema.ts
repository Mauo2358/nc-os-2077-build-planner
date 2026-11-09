import { z } from 'zod';

// --- Primitives & Enums ---
export const PerkTierSchema = z.union([
  z.literal(4),
  z.literal(9),
  z.literal(15),
  z.literal(20),
]);

export const AttributeKeySchema = z.enum(['body', 'reflexes', 'tech', 'intelligence', 'cool']);
export const SkillKeySchema = z.enum(['shinobi', 'headhunter', 'engineer', 'solo', 'netrunner']);

export const AttributePointSchema = z.number().int().min(3).max(20);
export const RelicPointSchema = z.number().int().min(0).max(9);
export const SkillLevelSchema = z.number().int().min(1).max(60);
const KebabIdSchema = z.string().regex(/^[a-z0-9-]+$/, 'ID must be kebab-case');

// --- Meta Configuration ---
export const MetaConfigSchema = z.object({
  version: z.string().min(1),
  maxLevelPL: z.literal(60),
  maxPointsPL: z.literal(81),
  maxLevelBase: z.literal(50),
  maxPointsBase: z.literal(71),
  maxRelicPL: z.literal(9),
  minAttr: z.literal(3),
  maxAttr: z.literal(20),
  startingPoints: z.literal(7),
  startingMaxAttr: z.literal(6),
  thresholds: z.tuple([
    z.literal(4),
    z.literal(9),
    z.literal(15),
    z.literal(20),
  ]),
});

// --- Attributes & Perks ---
export const AttributePerkSchema = z.object({
  tier: PerkTierSchema,
  name: z.string().min(1),
  desc: z.string().min(1),
});

export const AttributeDetailSchema = z.object({
  name: z.string().min(1),
  bonus: z.string().min(1),
  weapons: z.array(z.string().min(1)).nonempty(),
  perks: z
    .array(AttributePerkSchema)
    .length(4, 'Each attribute must define milestones for all 4 tiers (4, 9, 15, 20).'),
});

export const AttributesMapSchema = z.object({
  body: AttributeDetailSchema,
  reflexes: AttributeDetailSchema,
  tech: AttributeDetailSchema,
  intelligence: AttributeDetailSchema,
  cool: AttributeDetailSchema,
});

// --- Skill Tracks ---
const skillMilestone = <L extends 15 | 35 | 60>(level: L) =>
  z.object({ level: z.literal(level), bonus: z.string().min(1) });

export const SkillTrackSchema = z.object({
  id: SkillKeySchema,
  name: z.string().min(1),
  attribute: AttributeKeySchema,
  desc: z.string().min(1),
  // Exactly three milestones, in order: 15, 35, 60.
  milestones: z.tuple([skillMilestone(15), skillMilestone(35), skillMilestone(60)]),
});

// --- Chrome (Cyberware) Capacity ---
export const ChromeItemSchema = z.object({
  id: KebabIdSchema,
  name: z.string().min(1),
  slot: z.string().min(1),
  cost: z.number().int().min(0),
  armor: z.number().int().min(0),
  iconic: z.boolean(),
  // Optional substring matched against preset gear names to pre-equip the item.
  gearMatch: z.string().min(1).optional(),
});

export const ChromeCapacitySchema = z
  .object({
    // 'estimate' = planner-derived numbers, not confirmed in-game.
    confidence: z.enum(['verified', 'estimate']),
    baseCapacity: z.number().int().min(0),
    perLevel: z.number().int().min(0),
    renaissancePunk: z.object({
      requiresTech: PerkTierSchema,
      attributeThreshold: PerkTierSchema,
      perAttribute: z.number().int().min(0),
    }),
    engineerBonus: z.object({
      skillLevel: SkillLevelSchema,
      capacity: z.number().int().min(0),
    }),
    shardBonusMax: z.number().int().min(0),
    edgerunner: z.object({
      requiresTech: z.literal(20),
      maxOverCap: z.number().int().min(0),
      hpPenaltyPctPerPoint: z.number().min(0),
      furyChancePctPerPoint: z.number().min(0),
      furyDamageBonusPct: z.number().min(0),
      furyCritChanceBonusPct: z.number().min(0),
    }),
    armorMultiplier: z.object({
      itemId: KebabIdSchema,
      multiplier: z.number().min(1),
    }),
    items: z.array(ChromeItemSchema).nonempty(),
  })
  .superRefine((cc, ctx) => {
    const ids = cc.items.map((i) => i.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'chromeCapacity.items must have unique ids.',
        path: ['items'],
      });
    }
    if (!ids.includes(cc.armorMultiplier.itemId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `armorMultiplier.itemId "${cc.armorMultiplier.itemId}" is not in chromeCapacity.items.`,
        path: ['armorMultiplier', 'itemId'],
      });
    }
  });

// --- Presets ---
export const PresetStatsSchema = z
  .object({
    body: AttributePointSchema,
    reflexes: AttributePointSchema,
    tech: AttributePointSchema,
    intelligence: AttributePointSchema,
    cool: AttributePointSchema,
    relic: RelicPointSchema,
  })
  .superRefine((stats, ctx) => {
    const totalAllocated =
      stats.body + stats.reflexes + stats.tech + stats.intelligence + stats.cool;

    if (totalAllocated > 81) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total attribute points (${totalAllocated}) exceed Phantom Liberty cap of 81.`,
        path: ['body'],
      });
    }
  });

export const PresetSkillsSchema = z.object({
  shinobi: SkillLevelSchema,
  headhunter: SkillLevelSchema,
  engineer: SkillLevelSchema,
  solo: SkillLevelSchema,
  netrunner: SkillLevelSchema,
});

export const PresetGearItemSchema = z.object({
  name: z.string().min(1),
  slot: z.string().min(1),
  district: z.string().min(1),
  location: z.string().min(1),
});

export const BuildPresetSchema = z.object({
  id: KebabIdSchema,
  name: z.string().min(1),
  archetype: z.string().min(1),
  difficulty: z.string().min(1),
  summary: z.string().min(1),
  stats: PresetStatsSchema,
  skills: PresetSkillsSchema,
  gear: z.array(PresetGearItemSchema).nonempty(),
});

// --- Dogtown Exclusives ---
export const DogtownExclusiveItemSchema = z.object({
  name: z.string().min(1),
  slot: z.string().min(1),
  source: z.string().min(1),
  location: z.string().min(1),
});

// --- Root Schema ---
export const CyberpunkBuildDatabaseSchema = z
  .object({
    meta: MetaConfigSchema,
    attributes: AttributesMapSchema,
    skillTracks: z.array(SkillTrackSchema).length(5, 'Define exactly one track per skill (5 total).'),
    chromeCapacity: ChromeCapacitySchema,
    presets: z.array(BuildPresetSchema).nonempty(),
    dogtown_exclusives: z.array(DogtownExclusiveItemSchema).nonempty(),
  })
  .superRefine((db, ctx) => {
    const ids = db.skillTracks.map((t) => t.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'skillTracks must have one entry per skill id (no duplicates).',
        path: ['skillTracks'],
      });
    }
  });

// Optional: Infer the TypeScript type directly from the Zod schema
export type InferredCyberpunkDatabase = z.infer<typeof CyberpunkBuildDatabaseSchema>;