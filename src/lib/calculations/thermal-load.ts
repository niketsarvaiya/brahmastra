import type { StatusLevel, Insight, Recommendation } from '../../types';

export interface Equipment {
  id: string;
  name: string;
  wattage: number;
  quantity: number;
  category: string;
}

export interface ThermalLoadInputs {
  equipment: Equipment[];
  rackType: string;
  roomVolume: number;      // m³
  hasAirConditioning: boolean;
  acBtuCapacity: number;   // BTU/hr of existing AC
}

export interface ThermalLoadResult {
  totalWatts: number;
  totalBtuHr: number;
  heatDensityWPerU: number;
  classification: StatusLevel;
  classificationLabel: string;
  acAdequacy: StatusLevel;
  acAdequacyLabel: string;
  overallStatus: StatusLevel;
  overallLabel: string;
  insights: Insight[];
  recommendations: Recommendation[];
  summary: string;
  equipmentBreakdown: { name: string; watts: number; btu: number; pct: number }[];
}

// Industry thresholds for rack heat load
const HEAT_THRESHOLDS = {
  good: 3000,      // < 3kW — manageable with passive/light cooling
  warning: 6000,   // 3–6kW — active cooling required
  critical: 10000, // > 6kW — high-density cooling required
};

export function calculateThermalLoad(inputs: ThermalLoadInputs): ThermalLoadResult {
  const { equipment, hasAirConditioning, acBtuCapacity } = inputs;

  if (!equipment.length) return emptyResult();

  const totalWatts = equipment.reduce((sum, e) => sum + e.wattage * e.quantity, 0);
  const totalBtuHr = totalWatts * 3.412;

  // Approximate rack U usage
  const totalUnits = equipment.reduce((sum, e) => sum + e.quantity, 0);
  const heatDensityWPerU = totalUnits > 0 ? totalWatts / totalUnits : 0;

  const classification = classifyHeat(totalWatts);
  const acAdequacy = evaluateACAdequacy(totalBtuHr, hasAirConditioning, acBtuCapacity);

  const overallStatus = worstOf(classification.level, acAdequacy.level);

  const breakdown = equipment
    .filter((e) => e.wattage > 0)
    .map((e) => ({
      name: e.name,
      watts: e.wattage * e.quantity,
      btu: e.wattage * e.quantity * 3.412,
      pct: totalWatts > 0 ? (e.wattage * e.quantity / totalWatts) * 100 : 0,
    }))
    .sort((a, b) => b.watts - a.watts);

  return {
    totalWatts: Math.round(totalWatts),
    totalBtuHr: Math.round(totalBtuHr),
    heatDensityWPerU: Math.round(heatDensityWPerU * 10) / 10,
    classification: classification.level,
    classificationLabel: classification.label,
    acAdequacy: acAdequacy.level,
    acAdequacyLabel: acAdequacy.label,
    overallStatus,
    overallLabel: overallStatus === 'good' ? 'Thermal Load Acceptable' : overallStatus === 'warning' ? 'Cooling Review Required' : 'Critical — Risk of Overheating',
    insights: buildInsights(totalWatts, totalBtuHr, classification, acAdequacy, inputs),
    recommendations: buildRecommendations(totalWatts, totalBtuHr, classification.level, acAdequacy.level, inputs),
    summary: buildSummary(totalWatts, totalBtuHr, classification, acAdequacy, inputs),
    equipmentBreakdown: breakdown,
  };
}

function classifyHeat(watts: number): { level: StatusLevel; label: string } {
  if (watts < HEAT_THRESHOLDS.good) return { level: 'good', label: 'Low Load' };
  if (watts < HEAT_THRESHOLDS.warning) return { level: 'warning', label: 'Moderate Load' };
  if (watts < HEAT_THRESHOLDS.critical) return { level: 'warning', label: 'High Load' };
  return { level: 'critical', label: 'Critical Load' };
}

function evaluateACAdequacy(
  btuRequired: number,
  hasAC: boolean,
  acCapacity: number
): { level: StatusLevel; label: string } {
  if (!hasAC) {
    if (btuRequired < 1000) return { level: 'good', label: 'Passive OK' };
    if (btuRequired < 3000) return { level: 'warning', label: 'AC Recommended' };
    return { level: 'critical', label: 'AC Required — None Present' };
  }
  const ratio = acCapacity / btuRequired;
  if (ratio >= 1.3) return { level: 'good', label: 'Adequate Capacity' };
  if (ratio >= 1.0) return { level: 'warning', label: 'Marginal — No Headroom' };
  return { level: 'critical', label: 'Undersized — Overheating Risk' };
}

function worstOf(a: StatusLevel, b: StatusLevel): StatusLevel {
  const rank: Record<StatusLevel, number> = { critical: 3, warning: 2, good: 1, info: 0, neutral: 0 };
  const worst = Math.max(rank[a], rank[b]);
  if (worst >= 3) return 'critical';
  if (worst >= 2) return 'warning';
  return 'good';
}

function buildInsights(
  watts: number,
  btu: number,
  classification: { level: StatusLevel; label: string },
  acAdequacy: { level: StatusLevel; label: string },
  inputs: ThermalLoadInputs
): Insight[] {
  const insights: Insight[] = [];

  if (classification.level === 'good') {
    insights.push({
      title: 'Rack Heat Load is Within Safe Range',
      body: `Total load of ${Math.round(watts)}W (${Math.round(btu).toLocaleString()} BTU/hr) is well within the threshold for standard rack cooling. Passive ventilation combined with modest airflow should maintain safe operating temperatures.`,
      level: 'good',
    });
  } else if (classification.level === 'warning') {
    insights.push({
      title: 'Moderate to High Heat Load Detected',
      body: `${Math.round(watts)}W total load requires active cooling management. Without proper airflow, rack temperatures may climb above 40°C — the point where equipment begins to throttle or fail prematurely.`,
      level: 'warning',
    });
  } else {
    insights.push({
      title: 'Critical Heat Load — Cooling Infrastructure Required',
      body: `${Math.round(watts)}W is a high-density scenario. Standard room air conditioning alone is unlikely to be sufficient. Dedicated in-row cooling, cold-aisle containment, or a purpose-built AV rack room may be required.`,
      level: 'critical',
    });
  }

  if (inputs.hasAirConditioning) {
    const margin = inputs.acBtuCapacity - btu;
    if (acAdequacy.level === 'good') {
      insights.push({
        title: 'Air Conditioning Capacity is Sufficient',
        body: `AC system provides ${Math.round(inputs.acBtuCapacity).toLocaleString()} BTU/hr against a required ${Math.round(btu).toLocaleString()} BTU/hr — ${Math.round(margin).toLocaleString()} BTU/hr headroom available (${Math.round((margin / btu) * 100)}%). Suitable for normal ambient loading.`,
        level: 'good',
      });
    } else if (acAdequacy.level === 'warning') {
      insights.push({
        title: 'AC Capacity is Marginal',
        body: `The installed AC system (${Math.round(inputs.acBtuCapacity).toLocaleString()} BTU/hr) only barely covers the ${Math.round(btu).toLocaleString()} BTU/hr demand. Any additional load, elevated ambient, or AC failure will cause thermal runaway. A 30% safety margin is standard practice.`,
        level: 'warning',
      });
    } else {
      insights.push({
        title: 'AC System is Undersized — Overheating Risk',
        body: `Installed AC provides only ${Math.round(inputs.acBtuCapacity).toLocaleString()} BTU/hr, significantly below the ${Math.round(btu).toLocaleString()} BTU/hr required. Under full load, the space will not maintain safe thermal conditions.`,
        level: 'critical',
      });
    }
  } else {
    if (btu > 3000) {
      insights.push({
        title: 'No Air Conditioning Detected for Significant Heat Load',
        body: `${Math.round(btu).toLocaleString()} BTU/hr of heat in an uncontrolled environment will cause rapid temperature rise. Electronics reliability degrades significantly above 40°C junction temperature.`,
        level: 'critical',
      });
    }
  }

  return insights;
}

function buildRecommendations(
  watts: number,
  btu: number,
  heatLevel: StatusLevel,
  acLevel: StatusLevel,
  _inputs: ThermalLoadInputs
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (heatLevel === 'critical') {
    recs.push({
      priority: 'high',
      action: 'Design dedicated cooling solution — in-row cooling or precision AC',
      rationale: `${Math.round(watts)}W exceeds what standard room cooling can reliably handle. Consult mechanical engineering before finalising rack layout.`,
    });
  }

  if (acLevel === 'critical') {
    recs.push({
      priority: 'high',
      action: 'Upgrade air conditioning capacity to minimum 1.3× rack heat load',
      rationale: `Required: ${Math.round(btu * 1.3).toLocaleString()} BTU/hr. Current installed capacity is insufficient and poses an overheating risk at full load.`,
    });
  }

  if (acLevel === 'warning') {
    recs.push({
      priority: 'medium',
      action: 'Add supplemental cooling or upgrade to higher-capacity AC unit',
      rationale: 'Current capacity has no safety headroom. A 30% thermal margin is standard for equipment reliability and longevity.',
    });
  }

  if (heatLevel !== 'good') {
    recs.push({
      priority: 'medium',
      action: 'Implement structured cable management to maximise airflow through rack',
      rationale: 'Bundled cables block airflow pathways and can increase effective rack temperatures by 5–10°C.',
    });
    recs.push({
      priority: 'medium',
      action: 'Install blanking panels for all unused rack Us',
      rationale: 'Blanking panels prevent hot air recirculation, a common cause of thermal issues in partially populated racks.',
    });
  }

  if (!recs.length) {
    recs.push({
      priority: 'low',
      action: 'Log thermal baseline readings at commissioning for future comparison',
      rationale: 'Establishing a baseline now makes it easier to detect cooling degradation over time.',
    });
  }

  return recs;
}

function buildSummary(
  watts: number,
  btu: number,
  classification: { level: StatusLevel; label: string },
  acAdequacy: { level: StatusLevel; label: string },
  inputs: ThermalLoadInputs
): string {
  const acStatus = inputs.hasAirConditioning
    ? `The installed AC system (${Math.round(inputs.acBtuCapacity).toLocaleString()} BTU/hr capacity) is ${acAdequacy.label.toLowerCase()}.`
    : 'No air conditioning has been specified for this space.';

  return `The ${inputs.rackType.replace(/-/g, ' ')} rack installation has a total calculated heat load of ${Math.round(watts).toLocaleString()}W (${Math.round(btu).toLocaleString()} BTU/hr), classified as ${classification.label.toLowerCase()}. ${acStatus} ${classification.level === 'good' && acAdequacy.level === 'good' ? 'No corrective action is required at this time.' : 'Thermal management improvements are recommended before system handover.'}`;
}

function emptyResult(): ThermalLoadResult {
  return {
    totalWatts: 0,
    totalBtuHr: 0,
    heatDensityWPerU: 0,
    classification: 'neutral',
    classificationLabel: '—',
    acAdequacy: 'neutral',
    acAdequacyLabel: '—',
    overallStatus: 'neutral',
    overallLabel: 'Awaiting Input',
    insights: [],
    recommendations: [],
    summary: 'Add equipment to your rack below to generate a thermal load report.',
    equipmentBreakdown: [],
  };
}
