import type { StatusLevel, Insight, Recommendation } from '../../types';

export interface AirflowInputs {
  btuHr: number;
  fanCount: number;
  cfmPerFan: number;
  airflowDirection: 'front-to-back' | 'bottom-to-top' | 'side-to-side' | 'unmanaged';
  rackType: string;
  hasVentilation: boolean;
  ambientTempC: number;
}

export interface AirflowResult {
  requiredCFM: number;
  availableCFM: number;
  cfmSurplus: number;
  cfmRatio: number;
  adequacyStatus: StatusLevel;
  adequacyLabel: string;
  directionStatus: StatusLevel;
  directionLabel: string;
  overallStatus: StatusLevel;
  overallLabel: string;
  estimatedTempRiseC: number;
  insights: Insight[];
  recommendations: Recommendation[];
  summary: string;
}

// Required CFM = BTU/hr ÷ (1.08 × ΔT)
// ΔT target = 18°F (10°C) as industry standard for AV racks
const DELTA_T_F = 18;

export function calculateAirflow(inputs: AirflowInputs): AirflowResult {
  const { btuHr, fanCount, cfmPerFan, airflowDirection } = inputs;

  if (!btuHr && !fanCount) return emptyResult();

  const requiredCFM = btuHr / (1.08 * DELTA_T_F);
  const availableCFM = fanCount * cfmPerFan;

  const cfmSurplus = availableCFM - requiredCFM;
  const cfmRatio = requiredCFM > 0 ? availableCFM / requiredCFM : availableCFM > 0 ? 99 : 0;

  // Estimated actual temp rise in °C
  const estimatedTempRiseC =
    availableCFM > 0 ? (btuHr / (availableCFM * 1.08)) / 1.8 : 0;

  const adequacyStatus = classifyAdequacy(cfmRatio, availableCFM);
  const directionStatus = classifyDirection(airflowDirection);
  const overallStatus = worstOf(adequacyStatus.level, directionStatus.level);

  return {
    requiredCFM: Math.round(requiredCFM * 10) / 10,
    availableCFM: Math.round(availableCFM * 10) / 10,
    cfmSurplus: Math.round(cfmSurplus * 10) / 10,
    cfmRatio: Math.round(cfmRatio * 100) / 100,
    adequacyStatus: adequacyStatus.level,
    adequacyLabel: adequacyStatus.label,
    directionStatus: directionStatus.level,
    directionLabel: directionStatus.label,
    overallStatus,
    overallLabel: overallStatus === 'good' ? 'Airflow Adequate' : overallStatus === 'warning' ? 'Airflow Marginal' : 'Inadequate Cooling',
    estimatedTempRiseC: Math.round(estimatedTempRiseC * 10) / 10,
    insights: buildInsights(cfmRatio, requiredCFM, availableCFM, estimatedTempRiseC, adequacyStatus, directionStatus, inputs),
    recommendations: buildRecommendations(cfmRatio, requiredCFM, availableCFM, adequacyStatus.level, directionStatus.level, inputs),
    summary: buildSummary(requiredCFM, availableCFM, cfmRatio, overallStatus, adequacyStatus, directionStatus, inputs),
  };
}

function classifyAdequacy(ratio: number, cfm: number): { level: StatusLevel; label: string } {
  if (cfm === 0) return { level: 'critical', label: 'No Active Airflow' };
  if (ratio >= 1.3) return { level: 'good', label: 'Adequate with Headroom' };
  if (ratio >= 1.0) return { level: 'warning', label: 'Meets Minimum — No Margin' };
  if (ratio >= 0.7) return { level: 'warning', label: 'Below Requirement' };
  return { level: 'critical', label: 'Severely Inadequate' };
}

function classifyDirection(direction: string): { level: StatusLevel; label: string } {
  switch (direction) {
    case 'front-to-back': return { level: 'good', label: 'Optimal (Front → Back)' };
    case 'bottom-to-top': return { level: 'good', label: 'Good (Bottom → Top)' };
    case 'side-to-side': return { level: 'warning', label: 'Suboptimal (Side → Side)' };
    case 'unmanaged': return { level: 'critical', label: 'Unmanaged — Recirculation Risk' };
    default: return { level: 'neutral', label: '—' };
  }
}

function worstOf(a: StatusLevel, b: StatusLevel): StatusLevel {
  const rank: Record<StatusLevel, number> = { critical: 3, warning: 2, good: 1, info: 0, neutral: 0 };
  const worst = Math.max(rank[a], rank[b]);
  if (worst >= 3) return 'critical';
  if (worst >= 2) return 'warning';
  return 'good';
}

function buildInsights(
  ratio: number,
  required: number,
  available: number,
  tempRise: number,
  adequacy: { level: StatusLevel; label: string },
  direction: { level: StatusLevel; label: string },
  inputs: AirflowInputs
): Insight[] {
  const insights: Insight[] = [];

  if (adequacy.level === 'good') {
    insights.push({
      title: 'Airflow Volume is Sufficient',
      body: `Available airflow of ${Math.round(available)} CFM exceeds the ${Math.round(required)} CFM requirement by ${Math.round(ratio * 100 - 100)}%. The system has thermal headroom to handle transient load spikes without risk.`,
      level: 'good',
    });
  } else if (adequacy.level === 'warning' && ratio >= 1.0) {
    insights.push({
      title: 'Airflow Meets Minimum — Zero Safety Margin',
      body: `Available CFM exactly matches the calculated requirement. Any increase in load, ambient temperature, or fan degradation will push the system into thermal deficit. A 30% margin is the industry standard minimum.`,
      level: 'warning',
    });
  } else if (adequacy.level === 'warning') {
    insights.push({
      title: 'Airflow Below Calculated Requirement',
      body: `${Math.round(available)} CFM available against ${Math.round(required)} CFM required — a shortfall of ${Math.round(required - available)} CFM. Equipment will likely run hotter than rated operating temperature, reducing MTBF.`,
      level: 'warning',
    });
  } else if (inputs.fanCount === 0) {
    insights.push({
      title: 'No Active Fans Specified',
      body: `With ${inputs.btuHr.toLocaleString()} BTU/hr of heat load and no active cooling, the rack relies entirely on passive convection. This is only acceptable for very low-load, open-frame installations below ~500W.`,
      level: 'critical',
    });
  } else {
    insights.push({
      title: 'Critical Airflow Deficit',
      body: `Airflow is ${Math.round((1 - ratio) * 100)}% below requirement. At ${inputs.ambientTempC}°C ambient, equipment temperatures will substantially exceed rated maximums, leading to thermal throttling or permanent damage.`,
      level: 'critical',
    });
  }

  // Temp rise insight
  if (tempRise > 0) {
    const tempLevel: StatusLevel = tempRise <= 10 ? 'good' : tempRise <= 18 ? 'warning' : 'critical';
    insights.push({
      title: `Estimated Internal Temperature Rise: ${tempRise}°C`,
      body: `At current airflow rates, air temperature will rise approximately ${tempRise}°C from inlet to outlet. ${tempRise <= 10 ? 'This is within the recommended ≤10°C ΔT target.' : `The target is ≤10°C — a rise of ${tempRise}°C indicates insufficient airflow or flow bypass.`}`,
      level: tempLevel,
    });
  }

  // Direction insight
  if (direction.level !== 'good') {
    insights.push({
      title: `Airflow Direction: ${direction.label}`,
      body: direction.level === 'critical'
        ? 'Unmanaged airflow leads to hot-air recirculation — hot exhaust is re-ingested as cool intake air, drastically reducing cooling effectiveness. This is one of the most common causes of premature equipment failure.'
        : 'Side-to-side airflow is suboptimal for most rack equipment, which is designed for front-to-back cooling. Verify equipment orientation and consider blanking panels to direct airflow correctly.',
      level: direction.level,
    });
  }

  return insights;
}

function buildRecommendations(
  ratio: number,
  required: number,
  available: number,
  adequacyLevel: StatusLevel,
  directionLevel: StatusLevel,
  inputs: AirflowInputs
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (inputs.fanCount === 0 && inputs.btuHr > 1500) {
    recs.push({
      priority: 'high',
      action: `Install rack fans with minimum ${Math.ceil(required * 1.3)} CFM total capacity`,
      rationale: `${inputs.btuHr.toLocaleString()} BTU/hr requires active cooling. Passive convection is inadequate for this load.`,
    });
  }

  if (adequacyLevel === 'critical' && inputs.fanCount > 0) {
    recs.push({
      priority: 'high',
      action: `Increase fan count or upgrade to higher-CFM units — target ${Math.ceil(required * 1.3)} CFM`,
      rationale: `Current ${Math.round(available)} CFM covers only ${Math.round(ratio * 100)}% of the ${Math.round(required)} CFM requirement.`,
    });
  }

  if (adequacyLevel === 'warning') {
    recs.push({
      priority: 'medium',
      action: 'Add one additional fan to achieve 30% airflow headroom',
      rationale: `Current margin is insufficient. Target: ${Math.ceil(required * 1.3)} CFM total. Adding ${inputs.cfmPerFan} CFM would bring total to ${Math.round(available + inputs.cfmPerFan)} CFM.`,
    });
  }

  if (directionLevel === 'critical') {
    recs.push({
      priority: 'high',
      action: 'Implement hot-aisle/cold-aisle separation or structured airflow management',
      rationale: 'Hot air recirculation can negate the entire benefit of installed fans and is a primary cause of thermal failures.',
    });
  }

  if (directionLevel === 'warning') {
    recs.push({
      priority: 'medium',
      action: 'Reorient equipment or fans to achieve front-to-back airflow alignment',
      rationale: 'Most AV equipment is designed for front-to-back cooling. Misaligned airflow reduces effective cooling even when CFM is sufficient.',
    });
  }

  recs.push({
    priority: 'low',
    action: 'Install blanking panels for all unused rack Us',
    rationale: 'Blanking panels prevent bypass airflow and recirculation, improving thermal efficiency at no cost.',
  });

  return recs;
}

function buildSummary(
  required: number,
  available: number,
  ratio: number,
  overall: StatusLevel,
  _adequacy: { level: StatusLevel; label: string },
  direction: { level: StatusLevel; label: string },
  inputs: AirflowInputs
): string {
  const status = overall === 'good' ? 'adequate' : overall === 'warning' ? 'marginal' : 'inadequate';
  return `Airflow analysis for the ${inputs.rackType.replace(/-/g, ' ')} rack shows ${status} cooling performance. Based on ${inputs.btuHr.toLocaleString()} BTU/hr of heat load, a minimum of ${Math.round(required)} CFM is required. Current airflow provision (${inputs.fanCount} fan${inputs.fanCount !== 1 ? 's' : ''} × ${inputs.cfmPerFan} CFM) delivers ${Math.round(available)} CFM — ${Math.round(ratio * 100)}% of requirement. Airflow direction is ${direction.label.toLowerCase()}. ${overall === 'good' ? 'The system is ready for commissioning.' : 'Corrective action is recommended before equipment is powered under full load.'}`;
}

function emptyResult(): AirflowResult {
  return {
    requiredCFM: 0,
    availableCFM: 0,
    cfmSurplus: 0,
    cfmRatio: 0,
    adequacyStatus: 'neutral',
    adequacyLabel: '—',
    directionStatus: 'neutral',
    directionLabel: '—',
    overallStatus: 'neutral',
    overallLabel: 'Awaiting Input',
    estimatedTempRiseC: 0,
    insights: [],
    recommendations: [],
    summary: 'Enter your BTU/hr load and fan configuration to generate an airflow analysis.',
  };
}
