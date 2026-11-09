import { useState, useEffect, useRef, useMemo } from 'react';
import buildDb from './cyberpunk_2077_build_db_v2.json';

const PERK_TREES = {
  body: [
    { tier: 'LV 4 // NOVICE', pts: '3/5 PTS', name: 'PAINJUGGLER / COMEBACK KID', desc: '+10% Health Regen in combat. Adrenaline Rush unlocked at 15 Body.' },
    { tier: 'LV 9 // ADEPT', pts: '5/5 PTS', name: 'DIE! DIE! DIE! / LIKE A FEATHER', desc: 'Increased fire rate and tighter spread as Stamina decreases; no movement penalty with Shotguns/LMGs.' },
    { tier: 'LV 15 // EXPERT', pts: '7/7 PTS', name: 'ADRENALINE RUSH / BLOOD DAEMON', desc: '+35% Max HP as Adrenaline Shield; +40 HP restored per enemy affected by your active Quickhacks on kill.' },
    { tier: 'LV 20 // MASTER', pts: '3/3 PTS', name: 'RIP AND TEAR / PAIN TO GAIN', desc: '+20% Instant Health Item recharge on every kill during Adrenaline Rush, creating infinite Overclock fuel.' }
  ],
  reflexes: [
    { tier: 'LV 4 // NOVICE', pts: '3/5 PTS', name: 'SLIPPERY / MULTITASKER', desc: 'Harder for enemies to hit you while moving fast; shoot while sprinting, sliding, and vaulting.' },
    { tier: 'LV 9 // ADEPT', pts: '5/5 PTS', name: 'DASH / LEAD AND STEEL', desc: 'Replace dodge with high-speed Dash. Block incoming bullets with Blades (+100% mitigation).' },
    { tier: 'LV 15 // EXPERT', pts: '7/7 PTS', name: 'AIR DASH / AERODYNAMIC', desc: 'Dash mid-air for superior mobility and +30% Mitigation Strength while airborne.' },
    { tier: 'LV 20 // MASTER', pts: '3/3 PTS', name: 'SLAUGHTERHOUSE / SUBMACHINE FUN', desc: 'Instant SMG reload & +22% fire rate when swapping SMGs; Air Dashes restore +25 Stamina.' }
  ],
  tech: [
    { tier: 'LV 4 // NOVICE', pts: '3/5 PTS', name: 'GLUTTON FOR WAR / FIRST AID', desc: '+5% instant cooldown reduction on Health Items & Grenades per kill; +15% faster Blood Pump recharge.' },
    { tier: 'LV 9 // ADEPT', pts: '5/5 PTS', name: 'ALL THINGS CYBER / RENAISSANCE PUNK', desc: '+10% all Cyberware stat modifiers; +4 Cyberware Capacity for each Attribute at 9 or higher.' },
    { tier: 'LV 15 // EXPERT', pts: '7/7 PTS', name: 'LICENSE TO CHROME / CYBORG', desc: '+40 Armor & unlocks 3rd Skeleton slot; -15% cooldown on all Cyberware when all available slots are filled.' },
    { tier: 'LV 20 // MASTER', pts: '3/3 PTS', name: 'EDGERUNNER / TICKING TIME BOMB', desc: 'Exceed Cyberware Capacity by up to 50 pts; 0.1% chance per point over to trigger Fury (+10% Dmg, +30% Crit, +50% Crit Dmg) accompanied by psychopathic laughter.' }
  ],
  intelligence: [
    { tier: 'LV 4 // NOVICE', pts: '3/5 PTS', name: 'EYE IN THE SKY / PROXIMATE PROP', desc: 'Reduced RAM cost the closer you are to the target; +35% RAM recovery rate.' },
    { tier: 'LV 9 // ADEPT', pts: '5/5 PTS', name: 'EMBEDDED EXPLOIT / ICEPICK', desc: '+60% Quickhack damage to enemies affected by Control/Covert hacks; -1 RAM cost for Combat/Ultimate hacks.' },
    { tier: 'LV 15 // EXPERT', pts: '7/7 PTS', name: 'OVERCLOCK / SUBLIMATION', desc: 'Spend HP instead of RAM to upload Blackwall Gateway; all RAM recovery effects also regenerate HP during Overclock.' },
    { tier: 'LV 20 // MASTER', pts: '3/3 PTS', name: 'SPILLOVER / QUEUE HACK_ROOT', desc: '-1 RAM cost for the 4th hack in queue (Blackwall Gateway) & +50% chance for Quickhacks in Overclock to spread.' }
  ],
  cool: [
    { tier: 'LV 4 // NOVICE', pts: '3/5 PTS', name: 'FELINE FOOTWORK / KILLER INSTINCT', desc: '+15% Movement speed & +15% Mitigation Chance while crouched; +25% damage with silenced weapons outside combat.' },
    { tier: 'LV 9 // ADEPT', pts: '5/5 PTS', name: 'FOCUS / SCORPION STING', desc: 'No Stamina cost while aiming Pistols/Snipers; Critical Hits with Thrown Weapons apply Poison and Blind.' },
    { tier: 'LV 15 // EXPERT', pts: '7/7 PTS', name: 'DEADEYE / JUGGLER', desc: '+20% Headshot & Weakspot damage and zero bullet spread; killing an enemy with a Thrown Knife Headshot/Crit instantly resets all Knife cooldowns.' },
    { tier: 'LV 20 // MASTER', pts: '3/3 PTS', name: 'NERVES OF TUNGSTEN-STEEL / STYLE OVER SUBSTANCE', desc: 'Guaranteed Critical Hits on Headshots/Weakspots during Deadeye; Guaranteed Crits with Thrown Weapons while crouch-sprinting or dodging.' }
  ]
};

const RELIC_PERKS = [
  { id: 'vuln', name: 'VULNERABILITY ANALYTICS', cost: '3 PTS', desc: 'During combat, highlights Weakspots on enemy armor. Hitting Weakspots grants +100% Crit Chance, +25% Armor Penetration, and triggers an explosive EMP blast when destroyed.' },
  { id: 'jailbreak', name: 'JAILBREAK // DATA TUNNELING', cost: '3 PTS', desc: 'Unlocks Control Quickhack slot on Monowire. Hitting an enemy infected with a Monowire hack spreads that hack to all nearby targets for 0 RAM.' },
  { id: 'camo', name: 'EMERGENCY CLOAKING', cost: '3 PTS', desc: 'Activating Optical Camo during combat automatically causes enemies to lose track of you, letting you drop out of combat or channel Blackwall Gateway safely.' },
  { id: 'sensory', name: 'SENSORY PROTOCOL', cost: '3 PTS', desc: 'When detected while crouched, time slows down for 3.5s, allowing you to dash to cover or upload a lethal queue before alerting the squad.' }
];

const SLOT_SUGGESTIONS = [
  'Weapon (Iconic)',
  'Operating System',
  'Frontal Cortex',
  'Circulatory System',
  'Integumentary System',
  'Nervous System',
  'Skeleton',
  'Arms Cyberware',
  'Legs Cyberware',
  'Face / Optics'
];

// --- DB-driven sections (cyberpunk_2077_build_db_v2.json) ---
const SKILL_TRACKS = buildDb.skillTracks ?? [];
const CHROME = buildDb.chromeCapacity ?? null;
const CHROME_ITEMS = CHROME?.items ?? [];
const DEFAULT_SKILLS = { headhunter: 1, netrunner: 1, shinobi: 1, solo: 1, engineer: 1 };

// Pre-equip chrome whose gearMatch appears in the preset's gear list
const defaultChromeFor = (preset) =>
  CHROME_ITEMS
    .filter(c => c.gearMatch && preset?.gear?.some(g => g.name.includes(c.gearMatch)))
    .map(c => c.id);

const EMPTY_BUILD_FORM = {
  id: null,
  name: '',
  archetype: '',
  difficulty: '',
  summary: '',
  stats: {
    body: 15,
    reflexes: 15,
    tech: 20,
    intelligence: 15,
    cool: 16,
    relic: 9
  },
  synergy: {
    opening: '',
    loop: '',
    failsafe: ''
  },
  gear: [
    { name: '', slot: 'Operating System', district: '', location: '' }
  ]
};

export default function App() {
  // Load base presets + custom user presets from localStorage
  const [presets, setPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('nc_os_custom_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(buildDb.presets.map(p => p.id));
        const uniqueCustom = parsed.filter(p => !existingIds.has(p.id));
        return [...buildDb.presets, ...uniqueCustom];
      }
    } catch (e) {
      console.error('Failed to read localStorage presets:', e);
    }
    return buildDb.presets;
  });

  const [activePresetId, setActivePresetId] = useState(buildDb.presets[0].id);
  const [activeTab, setActiveTab] = useState('attributes');
  const [searchQuery, setSearchQuery] = useState('');
  const [charLevel, setCharLevel] = useState(60);
  const [lootedGear, setLootedGear] = useState({});
  const [unlockedRelics, setUnlockedRelics] = useState({ vuln: true, jailbreak: true, camo: true });
  const [statusBanner, setStatusBanner] = useState('');

  // Custom Build Architect Modal / Drawer State
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderForm, setBuilderForm] = useState(EMPTY_BUILD_FORM);

  const fileInputRef = useRef(null);

  const activePreset = presets.find(p => p.id === activePresetId) || presets[0];

  const [attributes, setAttributes] = useState({
    body: 20, reflexes: 15, tech: 20, intelligence: 20, cool: 6
  });
  const [relicPoints, setRelicPoints] = useState(9);

  // Skill tracks + chrome loadout state (skillTracks / chromeCapacity sections of the DB)
  const [skills, setSkills] = useState({ ...DEFAULT_SKILLS, ...(buildDb.presets[0].skills || {}) });
  const [equippedChrome, setEquippedChrome] = useState(() => defaultChromeFor(buildDb.presets[0]));
  const [shardBonus, setShardBonus] = useState(Math.min(42, CHROME?.shardBonusMax ?? 0));

  // Sync preset stats when changing active preset
  useEffect(() => {
    if (activePreset) {
      setAttributes({
        body: activePreset.stats.body,
        reflexes: activePreset.stats.reflexes,
        tech: activePreset.stats.tech,
        intelligence: activePreset.stats.intelligence,
        cool: activePreset.stats.cool,
      });
      setRelicPoints(activePreset.stats.relic ?? 9);
      setSkills({ ...DEFAULT_SKILLS, ...(activePreset.skills || {}) });
      setEquippedChrome(defaultChromeFor(activePreset));
    }
  }, [activePresetId, presets]);

  const showToast = (msg) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(''), 4000);
  };

  // Persist custom builds helper
  const savePresetsToStorage = (updatedList) => {
    const baseIds = new Set(buildDb.presets.map(b => b.id));
    const customOnly = updatedList.filter(p => !baseIds.has(p.id));
    localStorage.setItem('nc_os_custom_presets', JSON.stringify(customOnly));
  };

  // Filter presets via search bar
  const filteredPresets = presets.filter(preset => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const inName = preset.name.toLowerCase().includes(q);
    const inArch = preset.archetype.toLowerCase().includes(q);
    const inDiff = (preset.difficulty || '').toLowerCase().includes(q);
    const inSum = preset.summary.toLowerCase().includes(q);
    const inGear = preset.gear?.some(
      g => g.name.toLowerCase().includes(q) || g.slot.toLowerCase().includes(q) || (g.district || '').toLowerCase().includes(q)
    );
    return inName || inArch || inDiff || inSum || inGear;
  });

  const maxTotalPoints = 15 + (charLevel - 1) + 7; // 81 at Lv 60
  const spentPoints = Object.values(attributes).reduce((sum, v) => sum + v, 0);

  const adjustStat = (stat, delta) => {
    const cur = attributes[stat];
    const next = cur + delta;
    if (next >= 3 && next <= 20) {
      if (delta > 0 && spentPoints >= maxTotalPoints) return;
      setAttributes(prev => ({ ...prev, [stat]: next }));
    }
  };

  const handleReset = () => {
    if (activePreset) {
      setAttributes({
        body: activePreset.stats.body,
        reflexes: activePreset.stats.reflexes,
        tech: activePreset.stats.tech,
        intelligence: activePreset.stats.intelligence,
        cool: activePreset.stats.cool,
      });
      setSkills({ ...DEFAULT_SKILLS, ...(activePreset.skills || {}) });
      setEquippedChrome(defaultChromeFor(activePreset));
      setCharLevel(60);
      showToast('BUILD ATTRIBUTES RESET TO PRESET DEFAULTS');
    }
  };

  const toggleChrome = (id) => {
    setEquippedChrome(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Cyberware capacity / armor / Edgerunner math, driven entirely by DB.chromeCapacity
  const cw = useMemo(() => {
    if (!CHROME) return null;
    const rp = CHROME.renaissancePunk;
    const ed = CHROME.edgerunner;
    const am = CHROME.armorMultiplier;

    const ren = attributes.tech >= rp.requiresTech
      ? Object.values(attributes).filter(v => v >= rp.attributeThreshold).length * rp.perAttribute
      : 0;
    const eng = (skills.engineer || 1) >= CHROME.engineerBonus.skillLevel ? CHROME.engineerBonus.capacity : 0;
    const normal = CHROME.baseCapacity + charLevel * CHROME.perLevel + ren + eng + shardBonus;
    const edge = attributes.tech >= ed.requiresTech ? ed.maxOverCap : 0;

    const items = CHROME_ITEMS.filter(c => equippedChrome.includes(c.id));
    const usedCap = items.reduce((s, i) => s + i.cost, 0);
    const rawArmor = items.reduce((s, i) => s + i.armor, 0);
    const armor = Math.round(rawArmor * (equippedChrome.includes(am.itemId) ? am.multiplier : 1));
    const over = Math.max(0, Math.min(ed.maxOverCap, usedCap - normal));

    return {
      ren, eng, normal, edge,
      max: normal + edge,
      usedCap, armor, over,
      hpPenalty: (over * ed.hpPenaltyPctPerPoint).toFixed(1),
      fury: (over * ed.furyChancePctPerPoint).toFixed(1)
    };
  }, [attributes, skills, charLevel, shardBonus, equippedChrome]);

  // =========================================================
  // CUSTOM BUILD ARCHITECT HANDLERS
  // =========================================================
  const openBlankBuilder = () => {
    setBuilderForm({
      ...EMPTY_BUILD_FORM,
      id: null,
      stats: { ...attributes, relic: relicPoints },
      gear: [{ name: '', slot: 'Operating System', district: '', location: '' }]
    });
    setShowBuilder(true);
  };

  const openBuilderFromActive = (asEdit = false) => {
    if (!activePreset) return;
    const isBasePreset = buildDb.presets.some(b => b.id === activePreset.id);

    setBuilderForm({
      id: asEdit && !isBasePreset ? activePreset.id : null,
      name: asEdit && !isBasePreset ? activePreset.name : `${activePreset.name} (Custom)`,
      archetype: activePreset.archetype || '',
      difficulty: activePreset.difficulty || '',
      summary: activePreset.summary || '',
      stats: {
        body: attributes.body,
        reflexes: attributes.reflexes,
        tech: attributes.tech,
        intelligence: attributes.intelligence,
        cool: attributes.cool,
        relic: relicPoints
      },
      synergy: {
        opening: activePreset.synergy?.opening || 'Activate your Operating System immediately upon spotting elite targets. Use Air Dash + Double Jump to establish sightlines.',
        loop: activePreset.synergy?.loop || 'Chain Weakspot hits with your primary Iconic weapons. Each elimination triggers Axolotl & Glutton for War cooldown reductions.',
        failsafe: activePreset.synergy?.failsafe || 'Biomonitor + Blood Pump automatically restores health at 50% HP, while Second Heart or Emergency Cloaking provides a full combat reset.'
      },
      gear: activePreset.gear?.length
        ? activePreset.gear.map(g => ({ ...g }))
        : [{ name: '', slot: 'Operating System', district: '', location: '' }]
    });
    setShowBuilder(true);
  };

  const handleBuilderStatChange = (stat, delta) => {
    const cur = builderForm.stats[stat];
    const next = cur + delta;
    if (stat === 'relic') {
      if (next >= 0 && next <= 9) {
        setBuilderForm(prev => ({ ...prev, stats: { ...prev.stats, relic: next } }));
      }
      return;
    }
    const currentTotal =
      builderForm.stats.body +
      builderForm.stats.reflexes +
      builderForm.stats.tech +
      builderForm.stats.intelligence +
      builderForm.stats.cool;

    if (next >= 3 && next <= 20) {
      if (delta > 0 && currentTotal >= 81) return;
      setBuilderForm(prev => ({
        ...prev,
        stats: { ...prev.stats, [stat]: next }
      }));
    }
  };

  const handleBuilderGearChange = (index, field, value) => {
    setBuilderForm(prev => {
      const updatedGear = [...prev.gear];
      updatedGear[index] = { ...updatedGear[index], [field]: value };
      return { ...prev, gear: updatedGear };
    });
  };

  const addBuilderGearRow = () => {
    setBuilderForm(prev => ({
      ...prev,
      gear: [...prev.gear, { name: '', slot: 'Weapon (Iconic)', district: '', location: '' }]
    }));
  };

  const removeBuilderGearRow = (index) => {
    setBuilderForm(prev => ({
      ...prev,
      gear: prev.gear.filter((_, i) => i !== index)
    }));
  };

  const handleSaveCustomBuild = (e) => {
    e.preventDefault();
    if (!builderForm.name.trim()) {
      showToast('ERROR // PLEASE ENTER A BUILD NAME');
      return;
    }

    const cleanedGear = builderForm.gear
      .filter(g => g.name.trim() !== '')
      .map(g => ({
        name: g.name.trim(),
        slot: g.slot.trim() || 'Cyberware / Hardware',
        district: g.district.trim() || 'Night City / Dogtown',
        location: g.location.trim() || 'Acquired via vendor, gig, or crafting spec.'
      }));

    const buildId = builderForm.id || `custom-${Date.now()}`;
    const finalBuild = {
      id: buildId,
      name: builderForm.name.trim(),
      archetype: builderForm.archetype.trim() || 'CUSTOM NEURAL ARCHETYPE',
      difficulty: builderForm.difficulty.trim() || 'Custom Spec',
      summary: builderForm.summary.trim() || 'Custom user-engineered Cyberpunk 2077 combat profile.',
      isCustom: true,
      stats: { ...builderForm.stats },
      skills: { ...skills },
      synergy: {
        opening: builderForm.synergy.opening.trim() || 'Engage primary Operating System and establish positioning.',
        loop: builderForm.synergy.loop.trim() || 'Chain primary weapon and cyberware cooldown resets on elimination.',
        failsafe: builderForm.synergy.failsafe.trim() || 'Biomonitor + Blood Pump or Second Heart emergency recovery.'
      },
      gear: cleanedGear
    };

    setPresets(prev => {
      const exists = prev.some(p => p.id === buildId);
      const updated = exists
        ? prev.map(p => (p.id === buildId ? finalBuild : p))
        : [finalBuild, ...prev];
      savePresetsToStorage(updated);
      return updated;
    });

    setActivePresetId(buildId);
    setShowBuilder(false);
    showToast(`SAVED "${finalBuild.name.toUpperCase()}" TO BUILD ARCHIVE`);
  };

  const handleDeleteCustom = (e, idToDelete) => {
    e.stopPropagation();
    setPresets(prev => {
      const updated = prev.filter(p => p.id !== idToDelete);
      savePresetsToStorage(updated);
      if (activePresetId === idToDelete && updated.length > 0) {
        setActivePresetId(updated[0].id);
      }
      return updated;
    });
    showToast('REMOVED CUSTOM BUILD FROM ARCHIVE');
  };

  // --- EXPORT CURRENT BUILD TO JSON ---
  const handleExportBuild = () => {
    if (!activePreset) return;
    const exportPayload = {
      ...activePreset,
      stats: {
        ...attributes,
        relic: relicPoints
      },
      skills: { ...skills },
      customMeta: {
        exportedAt: new Date().toISOString(),
        charLevel,
        lootedGear,
        unlockedRelics,
        equippedChrome,
        shardBonus
      }
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePreset.id || 'cyberpunk-build'}-lv${charLevel}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`EXPORTED "${activePreset.name.toUpperCase()}" TO JSON`);
  };

  // --- IMPORT BUILD FROM JSON FILE ---
  const handleImportBuild = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const incomingList = Array.isArray(data.presets) ? data.presets : [data];

        const validated = incomingList
          .filter(item => item && item.name && item.stats && typeof item.stats.body === 'number')
          .map(item => ({
            ...item,
            id: item.id || `imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            archetype: item.archetype || 'CUSTOM IMPORTED ARCHETYPE',
            difficulty: item.difficulty || 'Custom Spec',
            summary: item.summary || 'User-imported Cyberpunk 2077 build configuration.',
            gear: Array.isArray(item.gear) ? item.gear : []
          }));

        if (validated.length === 0) {
          showToast('ERROR // INVALID BUILD JSON STRUCTURE');
          return;
        }

        setPresets(prev => {
          const map = new Map(prev.map(p => [p.id, p]));
          validated.forEach(v => map.set(v.id, v));
          const updated = Array.from(map.values());
          savePresetsToStorage(updated);
          return updated;
        });

        const first = validated[0];
        setActivePresetId(first.id);
        if (first.customMeta?.lootedGear) setLootedGear(prev => ({ ...prev, ...first.customMeta.lootedGear }));
        if (first.customMeta?.unlockedRelics) setUnlockedRelics(first.customMeta.unlockedRelics);
        if (first.customMeta?.charLevel) setCharLevel(first.customMeta.charLevel);
        if (first.customMeta?.equippedChrome) setEquippedChrome(first.customMeta.equippedChrome);
        if (typeof first.customMeta?.shardBonus === 'number') setShardBonus(first.customMeta.shardBonus);

        showToast(`IMPORTED ${validated.length} BUILD(S) // LOADED "${first.name.toUpperCase()}"`);
      } catch (err) {
        console.error(err);
        showToast('ERROR // FAILED TO PARSE JSON FILE');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleLooted = (itemName) => {
    setLootedGear(prev => ({ ...prev, [itemName]: !prev[itemName] }));
  };

  const toggleRelic = (id) => {
    setUnlockedRelics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const lootedCount = activePreset
    ? activePreset.gear.filter(g => lootedGear[g.name]).length
    : 0;

  const isBlackwall = activePreset?.id === 'blackwall-assassin';
  const isActiveCustom = activePreset && !buildDb.presets.some(b => b.id === activePreset.id);

  const builderSpentPoints =
    builderForm.stats.body +
    builderForm.stats.reflexes +
    builderForm.stats.tech +
    builderForm.stats.intelligence +
    builderForm.stats.cool;

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-200 p-4 md:p-6 select-none">
      {/* Main Container Box */}
      <div className={`max-w-7xl mx-auto border p-5 transition-colors duration-300 ${
        isBlackwall
          ? 'border-[#ff2a6d]/80 bg-[#0b0a10] shadow-[0_0_40px_rgba(255,42,109,0.12)]'
          : 'border-[#fcee0a]/60 bg-[#0b0d13] shadow-[0_0_30px_rgba(252,238,10,0.06)]'
      }`}>

        {/* --- STATUS NOTIFICATION BANNER --- */}
        {statusBanner && (
          <div className="mb-4 bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff] px-4 py-2 text-xs font-bold uppercase tracking-widest flex justify-between items-center">
            <span>&gt; SYSTEM_MSG // {statusBanner}</span>
            <button onClick={() => setStatusBanner('')} className="text-white hover:text-[#fcee0a] cursor-pointer">[X]</button>
          </div>
        )}

        {/* --- TOP HEADER & DATA ACTIONS --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-800 pb-4 mb-5 gap-4">
          <div>
            <div className="text-[11px] tracking-widest text-[#00f0ff] uppercase mb-1 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${isBlackwall ? 'bg-[#ff2a6d]' : 'bg-[#00f0ff]'}`}></span>
              <span>
                {isBlackwall
                  ? '// WARNING: BLACKWALL BREACH DETECTED // ROGUE AI PROTOCOL ACTIVE //'
                  : '// NETWATCH ARCHIVE // PATCH 2.12 + PHANTOM LIBERTY //'}
              </span>
            </div>
            <h1 className={`text-3xl md:text-4xl font-black tracking-wider uppercase ${
              isBlackwall
                ? 'text-[#ff2a6d] drop-shadow-[0_0_10px_rgba(255,42,109,0.45)]'
                : 'text-[#fcee0a] drop-shadow-[0_0_8px_rgba(252,238,10,0.3)]'
            }`}>
              2077 STAT &amp; GEAR PLANNER
            </h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-0.5">
              MAX LEVEL 60 // 81 ATTRIBUTE POINTS // 80 PERK POINTS // 9 RELIC POINTS
            </p>
          </div>

          {/* Action Toolbar: Search, Architect, Edit/Clone, Import, Export, Reset */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH BUILDS OR GEAR..."
                className="w-full sm:w-52 bg-[#090b10] border border-slate-700 focus:border-[#fcee0a] outline-none text-xs text-white px-3 py-1.5 uppercase tracking-wider placeholder:text-slate-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={openBlankBuilder}
              className="border border-[#fcee0a] bg-[#fcee0a] text-black hover:bg-[#fcee0a]/90 text-xs font-black px-3 py-1.5 uppercase tracking-wider transition cursor-pointer shadow-[0_0_10px_rgba(252,238,10,0.25)]"
            >
              [+ NEW CUSTOM BUILD]
            </button>

            <button
              onClick={() => openBuilderFromActive(isActiveCustom)}
              className="border border-[#fcee0a]/60 bg-[#fcee0a]/10 hover:bg-[#fcee0a]/20 text-[#fcee0a] text-xs font-bold px-3 py-1.5 uppercase tracking-wider transition cursor-pointer"
            >
              {isActiveCustom ? '[✎ EDIT BUILD]' : '[⎘ CLONE & EDIT]'}
            </button>

            <button
              onClick={handleExportBuild}
              className="border border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 uppercase tracking-wider transition cursor-pointer"
            >
              [↓] EXPORT JSON
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="border border-[#a855f7]/60 bg-[#a855f7]/10 hover:bg-[#a855f7]/20 text-[#c084fc] text-xs font-bold px-3 py-1.5 uppercase tracking-wider transition cursor-pointer"
            >
              [↑] IMPORT JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportBuild}
              className="hidden"
            />

            <button
              onClick={handleReset}
              className="border border-[#00f0ff]/60 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] text-xs font-bold px-3 py-1.5 uppercase tracking-wider transition cursor-pointer"
            >
              [↺] RESET
            </button>
          </div>
        </div>

        {/* =========================================================
            CUSTOM BUILD ARCHITECT STUDIO (MODAL / DRAWER)
        ========================================================= */}
        {showBuilder && (
          <form
            onSubmit={handleSaveCustomBuild}
            className="mb-6 border-2 border-[#fcee0a] bg-[#0d1018] p-5 shadow-[0_0_35px_rgba(252,238,10,0.15)] space-y-5"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-2">
              <div>
                <div className="text-[10px] text-[#00f0ff] uppercase tracking-widest font-bold">
                  // NC-OS NEURAL ARCHITECT STUDIO //
                </div>
                <h2 className="text-lg font-black text-[#fcee0a] uppercase tracking-wider">
                  {builderForm.id ? `EDITING BUILD: ${builderForm.name}` : 'CREATE NEW CUSTOM BUILD PROFILE'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openBuilderFromActive(false)}
                  className="border border-[#00f0ff]/60 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] text-[11px] font-bold px-2.5 py-1 uppercase tracking-wider cursor-pointer"
                >
                  LOAD ACTIVE PRESET AS TEMPLATE
                </button>
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="border border-slate-700 text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 uppercase cursor-pointer"
                >
                  [X] CLOSE
                </button>
              </div>
            </div>

            {/* SECTION 1: CORE IDENTITY & SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[10px] text-[#fcee0a] font-bold uppercase tracking-wider mb-1">
                  BUILD NAME *
                </label>
                <input
                  type="text"
                  required
                  value={builderForm.name}
                  onChange={(e) => setBuilderForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="E.G., NIGHT CITY PHANTOM"
                  className="w-full bg-[#07080c] border border-slate-700 focus:border-[#fcee0a] outline-none text-xs text-white px-3 py-2 uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#00f0ff] font-bold uppercase tracking-wider mb-1">
                  ARCHETYPE TAGS (SEPARATE WITH //)
                </label>
                <input
                  type="text"
                  value={builderForm.archetype}
                  onChange={(e) => setBuilderForm(prev => ({ ...prev, archetype: e.target.value }))}
                  placeholder="E.G., MONOWIRE // STEALTH HACKER // CAMO"
                  className="w-full bg-[#07080c] border border-slate-700 focus:border-[#00f0ff] outline-none text-xs text-white px-3 py-2 uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#ff2a6d] font-bold uppercase tracking-wider mb-1">
                  DIFFICULTY / CLASS CLASSIFICATION
                </label>
                <input
                  type="text"
                  value={builderForm.difficulty}
                  onChange={(e) => setBuilderForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  placeholder="E.G., HIGH-SPEED GLASS CANNON"
                  className="w-full bg-[#07080c] border border-slate-700 focus:border-[#ff2a6d] outline-none text-xs text-white px-3 py-2 uppercase tracking-wider"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-1">
                TACTICAL BUILD SUMMARY
              </label>
              <textarea
                rows={2}
                value={builderForm.summary}
                onChange={(e) => setBuilderForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Describe how this build plays, its main weapons/OS, and what makes it lethal..."
                className="w-full bg-[#07080c] border border-slate-700 focus:border-[#fcee0a] outline-none text-xs text-slate-200 p-2.5 leading-relaxed"
              />
            </div>

            {/* SECTION 2: ATTRIBUTE & RELIC ALLOCATION */}
            <div className="border border-slate-800 bg-[#090b10] p-3.5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-[#00f0ff] uppercase tracking-wider">
                  &gt; TARGET ATTRIBUTE &amp; RELIC ALLOCATION
                </span>
                <span className={`text-xs font-black uppercase ${
                  builderSpentPoints > 81 ? 'text-[#ff2a6d]' : 'text-[#fcee0a]'
                }`}>
                  SPENT: {builderSpentPoints} / 81 PTS ({81 - builderSpentPoints} REMAINING)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {[
                  { key: 'body', label: 'BODY', color: 'text-[#ff2a6d]' },
                  { key: 'reflexes', label: 'REFLEXES', color: 'text-[#00f0ff]' },
                  { key: 'tech', label: 'TECH ABILITY', color: 'text-[#fcee0a]' },
                  { key: 'intelligence', label: 'INTELLIGENCE', color: 'text-[#a855f7]' },
                  { key: 'cool', label: 'COOL', color: 'text-[#38bdf8]' },
                  { key: 'relic', label: 'RELIC (MAX 9)', color: 'text-[#fcee0a]' }
                ].map(stat => (
                  <div key={stat.key} className="border border-slate-800 bg-[#0d1017] p-2.5 text-center">
                    <div className={`text-[10px] font-black uppercase mb-1 ${stat.color}`}>
                      {stat.label}
                    </div>
                    <div className="flex items-center justify-between my-1">
                      <button
                        type="button"
                        onClick={() => handleBuilderStatChange(stat.key, -1)}
                        className="w-6 h-6 bg-slate-900 border border-slate-700 hover:border-[#fcee0a] text-white font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xl font-black text-white">
                        {builderForm.stats[stat.key]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleBuilderStatChange(stat.key, 1)}
                        className="w-6 h-6 bg-slate-900 border border-slate-700 hover:border-[#fcee0a] text-white font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: SYNERGY & COMBAT LOOP BREAKDOWNS */}
            <div>
              <div className="text-xs font-black text-[#00f0ff] uppercase tracking-wider mb-2">
                &gt; SYNERGY &amp; COMBAT LOOP BREAKDOWNS (TAB 04)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-[#fcee0a] font-bold uppercase mb-1">
                    01 // OPENING ENGAGEMENT
                  </label>
                  <textarea
                    rows={3}
                    value={builderForm.synergy.opening}
                    onChange={(e) =>
                      setBuilderForm(prev => ({
                        ...prev,
                        synergy: { ...prev.synergy, opening: e.target.value }
                      }))
                    }
                    placeholder="How you initiate combat (OS activation, stealth setup, movement)..."
                    className="w-full bg-[#07080c] border border-slate-700 focus:border-[#fcee0a] outline-none text-xs text-slate-200 p-2"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#00f0ff] font-bold uppercase mb-1">
                    02 // CORE DAMAGE LOOP
                  </label>
                  <textarea
                    rows={3}
                    value={builderForm.synergy.loop}
                    onChange={(e) =>
                      setBuilderForm(prev => ({
                        ...prev,
                        synergy: { ...prev.synergy, loop: e.target.value }
                      }))
                    }
                    placeholder="How your weapons, perks, and cyberware feed into each other..."
                    className="w-full bg-[#07080c] border border-slate-700 focus:border-[#00f0ff] outline-none text-xs text-slate-200 p-2"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#ff2a6d] font-bold uppercase mb-1">
                    03 // SURVIVABILITY FAILSAFE
                  </label>
                  <textarea
                    rows={3}
                    value={builderForm.synergy.failsafe}
                    onChange={(e) =>
                      setBuilderForm(prev => ({
                        ...prev,
                        synergy: { ...prev.synergy, failsafe: e.target.value }
                      }))
                    }
                    placeholder="How the build stays alive under heavy fire (Mitigation, Biomonitor, Camo)..."
                    className="w-full bg-[#07080c] border border-slate-700 focus:border-[#ff2a6d] outline-none text-xs text-slate-200 p-2"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: DYNAMIC ICONIC GEAR & CYBERWARE LIST */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-[#fcee0a] uppercase tracking-wider">
                  &gt; REQUIRED HARDWARE, WEAPONS &amp; CYBERWARE ({builderForm.gear.length} ITEMS)
                </span>
                <button
                  type="button"
                  onClick={addBuilderGearRow}
                  className="border border-[#00f0ff] bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] text-xs font-bold px-3 py-1 uppercase tracking-wider cursor-pointer"
                >
                  [+ ADD GEAR / IMPLANT]
                </button>
              </div>

              <datalist id="cyberware-slots">
                {SLOT_SUGGESTIONS.map((s, idx) => (
                  <option key={idx} value={s} />
                ))}
              </datalist>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {builderForm.gear.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 border border-slate-800 bg-[#090b10] p-2.5 items-start"
                  >
                    <div className="md:col-span-3">
                      <label className="block text-[9px] text-slate-400 uppercase mb-0.5">
                        ITEM / WEAPON NAME
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleBuilderGearChange(idx, 'name', e.target.value)}
                        placeholder="E.G., BYAKKO / APOGEE"
                        className="w-full bg-[#07080c] border border-slate-700 focus:border-[#fcee0a] outline-none text-xs text-white px-2.5 py-1.5"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[9px] text-slate-400 uppercase mb-0.5">
                        EQUIPMENT SLOT
                      </label>
                      <input
                        type="text"
                        list="cyberware-slots"
                        value={item.slot}
                        onChange={(e) => handleBuilderGearChange(idx, 'slot', e.target.value)}
                        placeholder="E.G., Operating System"
                        className="w-full bg-[#07080c] border border-slate-700 focus:border-[#00f0ff] outline-none text-xs text-white px-2.5 py-1.5"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[9px] text-slate-400 uppercase mb-0.5">
                        DISTRICT / VENDOR
                      </label>
                      <input
                        type="text"
                        value={item.district}
                        onChange={(e) => handleBuilderGearChange(idx, 'district', e.target.value)}
                        placeholder="E.G., Dogtown Stadium"
                        className="w-full bg-[#07080c] border border-slate-700 focus:border-[#ff2a6d] outline-none text-xs text-white px-2.5 py-1.5"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-[9px] text-slate-400 uppercase mb-0.5">
                        HOW TO ACQUIRE &amp; ICONIC EFFECT
                      </label>
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => handleBuilderGearChange(idx, 'location', e.target.value)}
                        placeholder="Drop location, quest requirement, and key stat modifiers..."
                        className="w-full bg-[#07080c] border border-slate-700 focus:border-[#fcee0a] outline-none text-xs text-white px-2.5 py-1.5"
                      />
                    </div>

                    <div className="md:col-span-1 flex md:justify-end items-end h-full pt-3 md:pt-0">
                      <button
                        type="button"
                        onClick={() => removeBuilderGearRow(idx)}
                        className="w-full md:w-auto border border-[#ff2a6d]/60 bg-[#ff2a6d]/10 hover:bg-[#ff2a6d]/25 text-[#ff2a6d] text-xs font-bold px-2.5 py-1.5 uppercase cursor-pointer"
                        title="Remove Item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUBMIT & CANCEL BAR */}
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                className="border border-slate-700 text-slate-400 hover:text-white text-xs font-bold px-4 py-2 uppercase tracking-wider cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="bg-[#fcee0a] hover:bg-[#fcee0a]/90 text-black font-black text-xs px-6 py-2 uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(252,238,10,0.3)]"
              >
                [✓] SAVE BUILD TO ARCHIVE
              </button>
            </div>
          </form>
        )}

        {/* --- PRESET ARCHETYPE CARDS --- */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[11px] text-[#00f0ff] uppercase tracking-widest font-bold">
              &gt; SELECT COMBAT ARCHETYPE PRESET ({filteredPresets.length} AVAILABLE):
            </div>
            {searchQuery && (
              <span className="text-[10px] text-[#fcee0a] uppercase">
                FILTERING BY: "{searchQuery}"
              </span>
            )}
          </div>

          {filteredPresets.length === 0 ? (
            <div className="border border-slate-800 bg-[#0f121a] p-4 text-center text-xs text-slate-400 uppercase tracking-widest">
              NO ARCHETYPES MATCHING "{searchQuery}".{' '}
              <button onClick={() => setSearchQuery('')} className="text-[#00f0ff] underline ml-2 cursor-pointer">
                CLEAR FILTER
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {filteredPresets.map(preset => {
                const active = preset.id === activePresetId;
                const isBwCard = preset.id === 'blackwall-assassin';
                const isCustom = !buildDb.presets.some(b => b.id === preset.id);
                return (
                  <button
                    key={preset.id}
                    onClick={() => setActivePresetId(preset.id)}
                    className={`text-left p-3 border transition cursor-pointer relative ${
                      active
                        ? isBwCard
                          ? 'border-[#ff2a6d] bg-[#ff2a6d]/15 shadow-[inset_0_0_15px_rgba(255,42,109,0.25)]'
                          : 'border-[#fcee0a] bg-[#fcee0a]/10 shadow-[inset_0_0_12px_rgba(252,238,10,0.15)]'
                        : 'border-slate-800 bg-[#0f121a] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className={`text-xs font-black uppercase tracking-wider leading-tight ${
                        active
                          ? isBwCard ? 'text-[#ff2a6d]' : 'text-[#fcee0a]'
                          : isBwCard ? 'text-[#ff2a6d]/90' : 'text-white'
                      }`}>
                        {preset.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isCustom && (
                          <span className="text-[9px] bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 px-1 uppercase">
                            USR
                          </span>
                        )}
                        {isCustom && (
                          <span
                            onClick={(e) => handleDeleteCustom(e, preset.id)}
                            title="Delete Custom Preset"
                            className="text-[10px] text-slate-500 hover:text-[#ff2a6d] px-1"
                          >
                            ✕
                          </span>
                        )}
                        {active && (
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isBwCard ? 'bg-[#ff2a6d]' : 'bg-[#fcee0a]'}`}></span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#00f0ff] uppercase tracking-wider truncate">
                      {preset.archetype}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* --- SUMMARY & METRICS BAR --- */}
        {activePreset && (
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3 mb-5 border p-3.5 items-center ${
            isBlackwall ? 'border-[#ff2a6d]/40 bg-[#120d16]' : 'border-slate-800 bg-[#0e1017]'
          }`}>
            <div className={`lg:col-span-7 border-l-2 pl-3 ${isBlackwall ? 'border-[#ff2a6d]' : 'border-[#fcee0a]'}`}>
              <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isBlackwall ? 'text-[#ff2a6d]' : 'text-[#fcee0a]'}`}>
                {activePreset.name} // <span className="text-[#00f0ff]">{activePreset.difficulty}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activePreset.summary}
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#090b10] border border-slate-800 p-2">
                <div className="text-[10px] text-slate-400 uppercase">ATTR POOL</div>
                <div className="text-lg font-black text-[#fcee0a]">
                  {spentPoints} <span className="text-xs text-slate-500">/ {maxTotalPoints}</span>
                </div>
              </div>
              <div className="bg-[#090b10] border border-slate-800 p-2">
                <div className="text-[10px] text-slate-400 uppercase">PERK PTS</div>
                <div className="text-lg font-black text-[#00f0ff]">
                  80 <span className="text-xs text-slate-500">/ 80</span>
                </div>
              </div>
              <div className="bg-[#090b10] border border-slate-800 p-2">
                <div className="text-[10px] text-slate-400 uppercase">CYBERWARE CAP</div>
                {cw ? (
                  <div className={`text-lg font-black ${cw.usedCap > cw.max ? 'text-[#ff2a6d]' : 'text-emerald-400'}`}>
                    {cw.usedCap} <span className="text-xs text-slate-500">/ {cw.max}</span>
                  </div>
                ) : (
                  <div className="text-lg font-black text-slate-600">N/A</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- 7 NAVIGATION TABS --- */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-5">
          {[
            { id: 'attributes', label: `01 // ATTRIBUTES & PERKS` },
            { id: 'gear', label: `02 // ICONIC GEAR (${lootedCount}/${activePreset?.gear.length || 0})` },
            { id: 'relic', label: `03 // RELIC TREE (${relicPoints}/9)` },
            { id: 'synergy', label: `04 // SYNERGY & BREAKDOWNS` },
            { id: 'roadmap', label: `05 // LV. 60 LEVELING ROADMAP` },
            { id: 'skills', label: `06 // SKILL TRACKS (1-60)` },
            { id: 'cyberware', label: `07 // CYBERWARE & EDGERUNNER` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider border transition cursor-pointer ${
                activeTab === tab.id
                  ? isBlackwall
                    ? 'bg-[#ff2a6d] text-white border-[#ff2a6d] shadow-[0_0_12px_rgba(255,42,109,0.4)]'
                    : 'bg-[#fcee0a] text-black border-[#fcee0a] shadow-[0_0_10px_rgba(252,238,10,0.3)]'
                  : 'bg-[#0f121a] text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* =========================================================
            TAB 1: ATTRIBUTES & PERKS
        ========================================================= */}
        {activeTab === 'attributes' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { key: 'body', label: 'BODY', color: 'text-[#ff2a6d]', sub: '+2 HP per pt // Blood Daemon' },
                { key: 'reflexes', label: 'REFLEXES', color: 'text-[#00f0ff]', sub: '+0.5% Crit // Air Dash' },
                { key: 'tech', label: 'TECHNICAL ABILITY', color: 'text-[#fcee0a]', sub: '+2 Armor // Edgerunner' },
                { key: 'intelligence', label: 'INTELLIGENCE', color: 'text-[#a855f7]', sub: '+1 RAM per 4 pts // Overclock' },
                { key: 'cool', label: 'COOL', color: 'text-[#38bdf8]', sub: '+1.25% Crit Dmg // Stealth' }
              ].map(col => {
                const val = attributes[col.key];
                return (
                  <div key={col.key} className="border border-slate-800 bg-[#0d1017] flex flex-col">
                    <div className="p-3 border-b border-slate-800 bg-[#090b10]">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-black uppercase tracking-wider ${col.color}`}>
                          {col.label}
                        </span>
                        <span className="text-[10px] text-slate-500">MAX 20</span>
                      </div>
                      <div className="flex items-center justify-between my-2">
                        <button
                          onClick={() => adjustStat(col.key, -1)}
                          className="w-7 h-7 bg-slate-900 border border-slate-700 hover:border-[#fcee0a] text-white font-bold text-sm cursor-pointer"
                        >
                          -
                        </button>
                        <span className={`text-3xl font-black ${col.color}`}>
                          {val}
                        </span>
                        <button
                          onClick={() => adjustStat(col.key, 1)}
                          className="w-7 h-7 bg-slate-900 border border-slate-700 hover:border-[#fcee0a] text-white font-bold text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {col.sub}
                      </div>
                    </div>

                    <div className="p-2.5 space-y-2.5 flex-1">
                      {PERK_TREES[col.key].map((perk, i) => {
                        const reqLv = i === 0 ? 4 : i === 1 ? 9 : i === 2 ? 15 : 20;
                        const unlocked = val >= reqLv;
                        return (
                          <div
                            key={i}
                            className={`p-2.5 border text-left transition ${
                              unlocked
                                ? 'border-[#00f0ff]/40 bg-[#00f0ff]/5'
                                : 'border-slate-800/80 bg-[#090b10]/60 opacity-45'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className={unlocked ? 'text-[#fcee0a] font-bold' : 'text-slate-500'}>
                                {perk.tier}
                              </span>
                              <span className="text-[#00f0ff] font-bold">{perk.pts}</span>
                            </div>
                            <div className="text-xs font-bold text-white uppercase mb-1">
                              {perk.name}
                            </div>
                            <div className="text-[11px] text-slate-400 leading-snug">
                              {perk.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: ICONIC GEAR & CYBERWARE CHECKLIST
        ========================================================= */}
        {activeTab === 'gear' && activePreset && (
          <div>
            <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
              <span className="text-xs text-[#00f0ff] uppercase tracking-wider font-bold">
                &gt; REQUIRED HARDWARE &amp; ICONIC LOOT LOCATIONS (CLICK TO MARK ACQUIRED)
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openBuilderFromActive(isActiveCustom)}
                  className="text-xs text-[#fcee0a] hover:underline uppercase font-bold cursor-pointer"
                >
                  [+ ADD / EDIT BUILD GEAR]
                </button>
                <span className="text-xs text-[#fcee0a] font-bold">
                  ACQUIRED: {lootedCount} / {activePreset.gear.length}
                </span>
              </div>
            </div>

            {activePreset.gear.length === 0 ? (
              <div className="border border-slate-800 bg-[#0e1118] p-6 text-center text-xs text-slate-400 uppercase">
                NO GEAR ASSIGNED TO THIS BUILD YET.{' '}
                <button
                  onClick={() => openBuilderFromActive(true)}
                  className="text-[#fcee0a] underline ml-2 cursor-pointer"
                >
                  OPEN BUILD ARCHITECT TO ADD HARDWARE
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {activePreset.gear.map((item, idx) => {
                  const isChecked = !!lootedGear[item.name];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleLooted(item.name)}
                      className={`p-4 border transition cursor-pointer ${
                        isChecked
                          ? 'border-emerald-500/60 bg-emerald-950/15'
                          : 'border-slate-800 bg-[#0e1118] hover:border-[#fcee0a]/60'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 border flex items-center justify-center text-xs font-bold ${
                            isChecked ? 'border-emerald-400 bg-emerald-500 text-black' : 'border-slate-600'
                          }`}>
                            {isChecked ? '✓' : ''}
                          </div>
                          <h4 className={`font-black text-sm uppercase tracking-wider ${
                            isChecked ? 'line-through text-emerald-400' : 'text-[#fcee0a]'
                          }`}>
                            {item.name}
                          </h4>
                        </div>
                        <span className="text-[10px] bg-black border border-slate-700 px-2 py-0.5 text-[#00f0ff] uppercase tracking-wider">
                          {item.slot}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#ff2a6d] font-bold uppercase tracking-wider mb-1.5">
                        DISTRICT // {item.district}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.location}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 3: PHANTOM LIBERTY RELIC TREE
        ========================================================= */}
        {activeTab === 'relic' && (
          <div>
            <div className="mb-3 text-xs text-[#00f0ff] uppercase tracking-wider font-bold">
              &gt; SONGBIRD MILITECH RELIC TERMINAL // DOGTOWN MILITECH DATA TERMINALS (9 PTS MAX)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RELIC_PERKS.map(relic => {
                const active = !!unlockedRelics[relic.id];
                return (
                  <div
                    key={relic.id}
                    onClick={() => toggleRelic(relic.id)}
                    className={`p-4 border transition cursor-pointer ${
                      active
                        ? 'border-[#fcee0a] bg-[#fcee0a]/10'
                        : 'border-slate-800 bg-[#0e1118] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-black text-[#fcee0a] uppercase tracking-wider">
                        {relic.name}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-black border border-[#fcee0a]/50 text-[#00f0ff]">
                        {relic.cost}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {relic.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: SYNERGY & COMBAT LOOP BREAKDOWNS
        ========================================================= */}
        {activeTab === 'synergy' && activePreset && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-800 bg-[#0e1118] p-4">
              <div className="text-xs font-black text-[#fcee0a] uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
                01 // OPENING ENGAGEMENT
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activePreset.synergy?.opening ||
                  'Activate your Operating System (Apogee Sandevistan, Militech Canto Overclock, or Biodyne Berserk) immediately upon spotting elite targets. Use Air Dash + Double Jump (Reinforced Tendons) to establish sightlines.'}
              </p>
            </div>
            <div className="border border-slate-800 bg-[#0e1118] p-4">
              <div className="text-xs font-black text-[#00f0ff] uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
                02 // CORE DAMAGE LOOP
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activePreset.synergy?.loop ||
                  'Chain Weakspot hits (Relic Vulnerability Analytics) with your primary Iconic weapons. Each elimination triggers Axolotl & Glutton for War cooldown reductions, keeping your OS and Mitigation Chance active indefinitely.'}
              </p>
            </div>
            <div className="border border-slate-800 bg-[#0e1118] p-4">
              <div className="text-xs font-black text-[#ff2a6d] uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
                03 // SURVIVABILITY FAILSAFE
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activePreset.synergy?.failsafe ||
                  'Biomonitor + Blood Pump automatically restores health at 50% HP, while Second Heart or Emergency Cloaking provides a full combat reset if surrounded by MaxTac or Dogtown Barghest heavy units.'}
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: LV. 60 LEVELING ROADMAP & SLIDER
        ========================================================= */}
        {activeTab === 'roadmap' && (
          <div className="space-y-5">
            <div className="border border-slate-800 bg-[#0e1118] p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-[#00f0ff] uppercase tracking-wider">
                  &gt; SIMULATE CHARACTER LEVEL PROGRESSION: LEVEL {charLevel}
                </span>
                <span className="text-xs font-bold text-[#fcee0a]">
                  AVAILABLE ATTR PTS: {maxTotalPoints}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={charLevel}
                onChange={(e) => setCharLevel(Number(e.target.value))}
                className="w-full cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>LV. 1 (START)</span>
                <span>LV. 15 (OVERCLOCK / AIR DASH)</span>
                <span>LV. 30 (CYNOSURE / DOGTOWN)</span>
                <span>LV. 40 (TIER 5 ICONICS)</span>
                <span>LV. 60 (MAX CALAMITY)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                { lv: 'LV. 1 - 15 // ACT 1 & OVERCLOCK INITIALIZATION', desc: 'Rush Intelligence or Primary Stat to 15 immediately to unlock Queue Mastery and Overclock. Grab Biomonitor and Blood Pump early so your health pool directly fuels your RAM bandwidth.' },
                { lv: 'LV. 15 - 30 // TECHNICAL ABILITY TO 20 (EDGERUNNER)', desc: 'Max Technical Ability to 20 to unlock Edgerunner (+50 Cyberware Capacity & Fury procs) and License to Chrome. Slot Ex-Disk and RAM Upgrade into your Frontal Cortex.' },
                { lv: 'LV. 30 - 45 // PHANTOM LIBERTY & CYNOSURE BUNKER', desc: 'Infiltrate the Cynosure facility during "Somewhat Damaged" to loot both the Militech Canto Mk.6 Behavioral Component and the Erebus SMG crafting spec.' },
                { lv: 'LV. 45 - 60 // WALKING CALAMITY CAPSTONE', desc: 'Max Body to 20 for Adrenaline Rush + Pain to Gain so every Blackwall Gateway kill refills your Blood Pump charges, letting you maintain Overclock indefinitely against MaxTac.' }
              ].map((step, i) => (
                <div key={i} className="border border-slate-800 bg-[#0e1118] p-4">
                  <div className="text-xs font-black text-[#fcee0a] uppercase mb-1.5">
                    {step.lv}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 6: SKILL TRACKS (DB.skillTracks)
        ========================================================= */}
        {activeTab === 'skills' && (
          <div className="space-y-3">
            {SKILL_TRACKS.length === 0 ? (
              <div className="border border-[#ff2a6d]/60 bg-[#ff2a6d]/10 p-4 text-xs text-[#ff2a6d] uppercase tracking-wider">
                DB ERROR // cyberpunk_2077_build_db_v2.json has no "skillTracks" section. Update the database file.
              </div>
            ) : (
              <>
                <div className="text-xs text-[#00f0ff] uppercase tracking-wider font-bold mb-1">
                  &gt; ACTION-BASED SKILL TRACKS (1-60) // PRESET LEVELS LOADED FROM BUILD DB
                </div>
                {SKILL_TRACKS.map(track => {
                  const lvl = skills[track.id] || 1;
                  const attrName = buildDb.attributes?.[track.attribute]?.name ?? track.attribute;
                  return (
                    <div key={track.id} className="border border-slate-800 bg-[#0e1118] p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-black text-[#fcee0a] uppercase tracking-wider">
                            {track.name}
                          </span>
                          <span className="text-xs text-[#00f0ff] ml-2 uppercase">
                            // LINKED: {attrName}
                          </span>
                          <p className="text-xs text-slate-400 mt-0.5">{track.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={lvl}
                            onChange={(e) => setSkills(prev => ({ ...prev, [track.id]: Number(e.target.value) }))}
                            className="w-36 cursor-pointer"
                          />
                          <span className="text-lg font-black text-white w-16 text-right">
                            LVL {lvl}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                        {track.milestones.map(m => {
                          const on = lvl >= m.level;
                          return (
                            <div
                              key={m.level}
                              className={`p-2 border text-xs ${
                                on
                                  ? 'border-[#00f0ff]/50 bg-[#00f0ff]/10 text-white'
                                  : 'border-slate-800 bg-black/30 text-slate-500'
                              }`}
                            >
                              <span className="font-bold text-[#fcee0a] mr-1.5">[LVL {m.level}]</span>
                              {m.bonus}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 7: CYBERWARE CAPACITY & EDGERUNNER (DB.chromeCapacity)
        ========================================================= */}
        {activeTab === 'cyberware' && (
          <div className="space-y-5">
            {!CHROME || !cw ? (
              <div className="border border-[#ff2a6d]/60 bg-[#ff2a6d]/10 p-4 text-xs text-[#ff2a6d] uppercase tracking-wider">
                DB ERROR // cyberpunk_2077_build_db_v2.json has no "chromeCapacity" section. Update the database file.
              </div>
            ) : (
              <>
                {CHROME.confidence === 'estimate' && (
                  <div className="text-[11px] text-[#fcee0a]/80 uppercase tracking-wider">
                    NOTE: the build database marks these capacity costs, armor values and Edgerunner penalties as estimates (not confirmed in-game).
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="border border-slate-800 bg-[#0e1118] p-3.5">
                    <div className="text-[10px] text-slate-400 uppercase">USED / MAX CAPACITY</div>
                    <div className={`text-2xl font-black mt-1 ${
                      cw.usedCap > cw.max ? 'text-[#ff2a6d]' : cw.usedCap > cw.normal ? 'text-[#fcee0a]' : 'text-[#00f0ff]'
                    }`}>
                      {cw.usedCap} / {cw.max}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Normal Cap: {cw.normal} (+{cw.edge} Edgerunner)
                    </div>
                  </div>

                  <div className="border border-slate-800 bg-[#0e1118] p-3.5">
                    <div className="text-[10px] text-slate-400 uppercase">CHROME ARMOR</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{cw.armor} ARMOR</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Equipped chrome only (x{CHROME.armorMultiplier.multiplier} with {CHROME_ITEMS.find(i => i.id === CHROME.armorMultiplier.itemId)?.name ?? CHROME.armorMultiplier.itemId})
                    </div>
                  </div>

                  <div className="border border-slate-800 bg-[#0e1118] p-3.5">
                    <div className="text-[10px] text-slate-400 uppercase">EDGERUNNER FURY PROC</div>
                    <div className="text-2xl font-black text-[#ff2a6d] mt-1">{cw.fury}% / KILL</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      HP Penalty: -{cw.hpPenalty}% Max HP ({cw.over}/{CHROME.edgerunner.maxOverCap} pts)
                    </div>
                  </div>

                  <div className="border border-slate-800 bg-[#0e1118] p-3.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                      <span>CAPACITY SHARDS LOOTED</span>
                      <span className="text-[#fcee0a] font-bold">+{shardBonus}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={CHROME.shardBonusMax}
                      value={shardBonus}
                      onChange={(e) => setShardBonus(Number(e.target.value))}
                      className="w-full cursor-pointer mt-2"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      Renaissance Punk: +{cw.ren} | Engineer {CHROME.engineerBonus.skillLevel}: +{cw.eng}
                    </div>
                  </div>
                </div>

                {cw.usedCap > cw.max && (
                  <div className="p-3 border border-[#ff2a6d] bg-[#ff2a6d]/15 text-xs text-white">
                    OVERLOAD WARNING: Equipped Cyberware exceeds Max Capacity ({cw.max}) by {cw.usedCap - cw.max} points. Reach Technical Ability {CHROME.edgerunner.requiresTech} (Edgerunner) or loot more Capacity Shards.
                  </div>
                )}

                <div>
                  <div className="text-xs text-[#00f0ff] uppercase tracking-wider font-bold mb-3">
                    &gt; CLICK TO EQUIP / UNEQUIP CYBERWARE (DEFAULTS MATCH THE ACTIVE PRESET&apos;S GEAR)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CHROME_ITEMS.map(item => {
                      const on = equippedChrome.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleChrome(item.id)}
                          className={`p-3.5 border cursor-pointer transition ${
                            on
                              ? 'border-[#fcee0a] bg-[#fcee0a]/10 shadow-[inset_0_0_10px_rgba(252,238,10,0.15)]'
                              : 'border-slate-800 bg-[#0e1118] hover:border-[#00f0ff]/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-4 h-4 border flex items-center justify-center text-xs font-bold ${
                                on ? 'border-[#fcee0a] bg-[#fcee0a] text-black' : 'border-slate-600'
                              }`}>
                                {on ? '✓' : ''}
                              </div>
                              <div>
                                <span className="text-xs font-black text-white uppercase">{item.name}</span>
                                {item.iconic && (
                                  <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-[#fcee0a] text-black uppercase">
                                    ICONIC
                                  </span>
                                )}
                                <div className="text-[10px] text-[#00f0ff] uppercase font-semibold">{item.slot}</div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-black text-[#ff2a6d]">{item.cost} CAP</div>
                              {item.armor > 0 && (
                                <div className="text-[10px] text-emerald-400 font-bold">+{item.armor} ARMOR</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
