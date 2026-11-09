export type AttributeKey = 'body' | 'reflexes' | 'tech' | 'intelligence' | 'cool';
export type SkillKey = 'shinobi' | 'headhunter' | 'engineer' | 'solo' | 'netrunner';
export type PerkTier = 4 | 9 | 15 | 20;
export type SkillMilestoneLevel = 15 | 35 | 60;

export interface MetaConfig {
  version: string;
  maxLevelPL: number;
  maxPointsPL: number;
  maxLevelBase: number;
  maxPointsBase: number;
  maxRelicPL: number;
  minAttr: number;
  maxAttr: number;
  startingPoints: number;
  startingMaxAttr: number;
  thresholds: [4, 9, 15, 20];
}

export interface AttributePerk {
  tier: PerkTier;
  name: string;
  desc: string;
}

export interface AttributeDetail {
  name: string;
  bonus: string;
  weapons: string[];
  perks: AttributePerk[];
}

export type AttributesMap = Record<AttributeKey, AttributeDetail>;

// --- Skill Tracks ---
export interface SkillMilestone<L extends SkillMilestoneLevel = SkillMilestoneLevel> {
  level: L;
  bonus: string;
}

export interface SkillTrack {
  id: SkillKey;
  name: string;
  attribute: AttributeKey;
  desc: string;
  milestones: [SkillMilestone<15>, SkillMilestone<35>, SkillMilestone<60>];
}

// --- Chrome (Cyberware) Capacity ---
export interface ChromeItem {
  id: string;
  name: string;
  slot: string;
  cost: number;
  armor: number;
  iconic: boolean;
  gearMatch?: string;
}

export interface ChromeCapacityConfig {
  /** 'estimate' = planner-derived numbers, not confirmed in-game. */
  confidence: 'verified' | 'estimate';
  baseCapacity: number;
  perLevel: number;
  renaissancePunk: {
    requiresTech: PerkTier;
    attributeThreshold: PerkTier;
    perAttribute: number;
  };
  engineerBonus: { skillLevel: number; capacity: number };
  shardBonusMax: number;
  edgerunner: {
    requiresTech: 20;
    maxOverCap: number;
    hpPenaltyPctPerPoint: number;
    furyChancePctPerPoint: number;
    furyDamageBonusPct: number;
    furyCritChanceBonusPct: number;
  };
  armorMultiplier: { itemId: string; multiplier: number };
  items: ChromeItem[];
}

// --- Presets ---
export interface PresetStats extends Record<AttributeKey, number> {
  relic: number;
}

export type PresetSkills = Record<SkillKey, number>;

export interface PresetGearItem {
  name: string;
  slot: string;
  district: string;
  location: string;
}

export interface BuildPreset {
  id: string;
  name: string;
  archetype: string;
  difficulty: string;
  summary: string;
  stats: PresetStats;
  skills: PresetSkills;
  gear: PresetGearItem[];
}

export interface DogtownExclusiveItem {
  name: string;
  slot: string;
  source: string;
  location: string;
}

export interface CyberpunkBuildDatabase {
  meta: MetaConfig;
  attributes: AttributesMap;
  skillTracks: SkillTrack[];
  chromeCapacity: ChromeCapacityConfig;
  presets: BuildPreset[];
  dogtown_exclusives: DogtownExclusiveItem[];
}