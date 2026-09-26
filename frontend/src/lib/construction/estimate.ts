import {
  BASE_COST_PER_SQM,
  BUILD_PHASES,
  FINISH_LEVELS,
  MATERIAL_RATIOS,
  REGIONS,
  STOREYS,
  UNIT_PRICES_TZS,
  type FinishId,
  type RegionId,
} from "./data";

export type Brief = {
  region: RegionId;
  bedrooms: number;
  bathrooms: number;
  storeys: 1 | 2 | 3;
  areaSqm: number;
  finish: FinishId;
  livingRooms?: number;
  hasDining?: boolean;
  hasStore?: boolean;
  hasVeranda?: boolean;
};

export type MaterialLine = {
  key: string;
  name: string;
  qty: number;
  unit: string;
  low: number;
  high: number;
  unitPrice: number;
};

export type Estimate = {
  brief: Brief;
  costLow: number;
  costHigh: number;
  costMid: number;
  monthsLow: number;
  monthsHigh: number;
  materials: MaterialLine[];
  phases: { id: string; title: string; cost: number; weeks: number; tasks: string[] }[];
};

export function defaultArea(bedrooms: number, storeys: number): number {
  const base = 42 + bedrooms * 26 + (storeys > 1 ? 18 : 0);
  return Math.round(base / 5) * 5;
}

export function computeEstimate(brief: Brief): Estimate {
  const region = REGIONS.find((r) => r.id === brief.region) ?? REGIONS[0];
  const finish = FINISH_LEVELS.find((f) => f.id === brief.finish) ?? FINISH_LEVELS[1];
  const storey = STOREYS.find((s) => s.id === brief.storeys) ?? STOREYS[0];
  const area = Math.max(40, brief.areaSqm);

  const mid =
    area * BASE_COST_PER_SQM * finish.multiplier * storey.multiplier * region.multiplier;
  const costLow = Math.round(mid * 0.86);
  const costHigh = Math.round(mid * 1.25);
  const costMid = Math.round(mid);

  const monthsBase = 3.2 + area / 55 + (brief.storeys - 1) * 1.4;
  const monthsLow = Math.max(3, Math.round(monthsBase * 0.85));
  const monthsHigh = Math.max(monthsLow + 1, Math.round(monthsBase * 1.25));

  const r = MATERIAL_RATIOS;
  const cement = area * r.cementBagsPerSqm * (0.92 + brief.storeys * 0.08);
  const rebarT = (area * r.rebarKgPerSqm * (0.9 + brief.storeys * 0.1)) / 1000;
  const sand = area * r.sandLorriesPerSqm;
  const agg = area * r.aggregateLorriesPerSqm;
  const sheets = area * r.ironSheetsPerSqm * (brief.storeys === 1 ? 1 : 0.55);
  const blocks = area * r.blocksPerSqm * (0.85 + brief.storeys * 0.15);
  const paint = area * r.paintLitresPerSqm * 2.2;

  const line = (
    key: string,
    name: string,
    qty: number,
    unit: string,
    unitPrice: number,
  ): MaterialLine => ({
    key,
    name,
    qty,
    unit,
    unitPrice,
    low: Math.round(qty * 0.92),
    high: Math.round(qty * 1.1),
  });

  const materials: MaterialLine[] = [
    line("cement", "Saruji (mfuko 50kg)", cement, "mfuko", UNIT_PRICES_TZS.cementBag),
    line("rebar", "Nondo za msingi & beam", rebarT, "tani", UNIT_PRICES_TZS.rebarKg * 1000),
    line("sand", "Mchanga", sand, "lori", UNIT_PRICES_TZS.sandLorry),
    line("agg", "Kokoto", agg, "lori", UNIT_PRICES_TZS.aggregateLorry),
    line("sheets", "Bati (Gauge 28)", sheets, "vipande", UNIT_PRICES_TZS.ironSheet),
    line("blocks", "Matofali 6 inch", blocks, "vipande", UNIT_PRICES_TZS.block),
    line("paint", "Rangi ya kuta", paint, "lita", UNIT_PRICES_TZS.paintLitre),
  ];

  const phases = BUILD_PHASES.map((p) => ({
    id: p.id,
    title: p.title,
    cost: Math.round(costMid * p.share),
    weeks: Math.max(2, Math.round(p.weeks * (area / 120) * (0.85 + brief.storeys * 0.15))),
    tasks: p.tasks,
  }));

  return {
    brief,
    costLow,
    costHigh,
    costMid,
    monthsLow,
    monthsHigh,
    materials,
    phases,
  };
}

const REGION_ALIASES: Record<string, RegionId> = {
  dodoma: "dodoma",
  dar: "dar",
  "dar es salaam": "dar",
  DSM: "dar",
  arusha: "arusha",
  mwanza: "mwanza",
  mbeya: "mbeya",
  morogoro: "morogoro",
  tanga: "tanga",
  mtwara: "mtwara",
  zanzibar: "zanzibar",
  ungaja: "zanzibar",
  kilimanjaro: "kilimanjaro",
  moshi: "kilimanjaro",
  iringa: "iringa",
  tabora: "tabora",
};

export function parseBrief(text: string): Partial<Brief> {
  const t = text.toLowerCase();
  const out: Partial<Brief> = {};

  for (const [alias, id] of Object.entries(REGION_ALIASES)) {
    if (t.includes(alias.toLowerCase())) {
      out.region = id;
      break;
    }
  }

  const bed =
    t.match(/vyumba\s*(vitatu|vinne|viwili|tano|sita|\d+)/i) ||
    t.match(/(\d+)\s*(?:bed|bedroom|vyumba)/i) ||
    t.match(/chumba\s*kimoja/i);
  if (bed) {
    const word: Record<string, number> = {
      kimoja: 1,
      viwili: 2,
      vitatu: 3,
      vinne: 4,
      tano: 5,
      sita: 6,
    };
    const raw = bed[1]?.toLowerCase() ?? "3";
    out.bedrooms = word[raw] ?? (parseInt(raw, 10) || 3);
  }

  const bath = t.match(/(\d+)\s*(?:bafu|bathroom)/i);
  if (bath) out.bathrooms = parseInt(bath[1], 10);

  if (/ghorofa\s*(mbili|2)/i.test(t) || /storey\s*2|two[- ]storey/i.test(t)) out.storeys = 2;
  else if (/ghorofa\s*(tatu|3)/i.test(t)) out.storeys = 3;
  else if (/ghorofa\s*moja|single[- ]storey|bungalow/i.test(t)) out.storeys = 1;

  const sqm = t.match(/(\d+)\s*(?:m2|m²|sqm|mita\s*za\s*mraba|sq\.?\s*m)/i);
  if (sqm) out.areaSqm = parseInt(sqm[1], 10);

  if (/maridadi|luxury|premium|imported/i.test(t)) out.finish = "maridadi";
  else if (/msingi|basic|cheap|nafua/i.test(t)) out.finish = "msingi";
  else if (/wastani|standard/i.test(t)) out.finish = "wastani";

  return out;
}

export function briefFromText(text: string, fallback?: Partial<Brief>): Brief {
  const parsed = parseBrief(text);
  const bedrooms = parsed.bedrooms ?? fallback?.bedrooms ?? 3;
  const storeys = parsed.storeys ?? fallback?.storeys ?? 1;
  return {
    region: parsed.region ?? fallback?.region ?? "dodoma",
    bedrooms,
    bathrooms: parsed.bathrooms ?? fallback?.bathrooms ?? Math.max(1, Math.ceil(bedrooms / 2)),
    storeys,
    areaSqm: parsed.areaSqm ?? fallback?.areaSqm ?? defaultArea(bedrooms, storeys),
    finish: parsed.finish ?? fallback?.finish ?? "wastani",
    livingRooms: fallback?.livingRooms ?? 1,
    hasDining: fallback?.hasDining ?? true,
    hasStore: fallback?.hasStore ?? true,
    hasVeranda: fallback?.hasVeranda ?? true,
  };
}

export function describeBrief(b: Brief): string {
  const region = REGIONS.find((r) => r.id === b.region)?.name ?? b.region;
  const finish = FINISH_LEVELS.find((f) => f.id === b.finish)?.name ?? b.finish;
  return `Nyumba ya vyumba ${b.bedrooms}, bafu ${b.bathrooms}, ${b.storeys === 1 ? "ghorofa moja" : `ghorofa ${b.storeys}`}, ~${b.areaSqm} m², ${finish}, ${region}`;
}
