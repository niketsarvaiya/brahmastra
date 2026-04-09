import type { StatusLevel, Insight, Recommendation } from '../../types';

export interface VisualCalibrationInputs {
  screenSize: number;       // inches diagonal
  screenGain: number;       // default 0.8
  screenType: string;       // 'fixed-frame' | 'ambient-light-rejection' | 'grey' | 'perforated' | 'roller-blind'
  projectorLumens: number;  // ANSI lumens
  projectorModel: string;
  throwDistance: number;    // meters
  luxReadings: [number, number, number, number, number]; // 5 point readings: center, TL, TR, BL, BR
}

export interface VisualCalibrationResult {
  averageLux: number;
  footLamberts: number;
  uniformityPercent: number;
  brightnessClassification: StatusLevel;
  brightnessLabel: string;
  uniformityClassification: StatusLevel;
  uniformityLabel: string;
  overallStatus: StatusLevel;
  overallLabel: string;
  insights: Insight[];
  recommendations: Recommendation[];
  summary: string;
}

// SMPTE standard: 16 fL for typical cinema, 14–22 fL acceptable
const FL_THRESHOLDS = {
  critical_low: 8,
  warning_low: 12,
  good_low: 14,
  good_high: 22,
  warning_high: 28,
  critical_high: 35,
};

const UNIFORMITY_THRESHOLDS = {
  good: 75,
  warning: 60,
  critical: 0,
};

function classifyBrightness(fL: number): { level: StatusLevel; label: string } {
  if (fL < FL_THRESHOLDS.critical_low) return { level: 'critical', label: 'Critically Dim' };
  if (fL < FL_THRESHOLDS.warning_low) return { level: 'warning', label: 'Below Target' };
  if (fL <= FL_THRESHOLDS.good_high) return { level: 'good', label: 'Within Spec' };
  if (fL <= FL_THRESHOLDS.warning_high) return { level: 'warning', label: 'Above Target' };
  return { level: 'critical', label: 'Critically Bright' };
}

function classifyUniformity(pct: number): { level: StatusLevel; label: string } {
  if (pct >= UNIFORMITY_THRESHOLDS.good) return { level: 'good', label: 'Excellent' };
  if (pct >= UNIFORMITY_THRESHOLDS.warning) return { level: 'warning', label: 'Marginal' };
  return { level: 'critical', label: 'Poor' };
}

function getOverallStatus(brightness: StatusLevel, uniformity: StatusLevel): StatusLevel {
  const rank: Record<StatusLevel, number> = { critical: 3, warning: 2, good: 1, info: 0, neutral: 0 };
  const worst = Math.max(rank[brightness], rank[uniformity]);
  if (worst >= 3) return 'critical';
  if (worst >= 2) return 'warning';
  return 'good';
}

export function calculateVisualCalibration(inputs: VisualCalibrationInputs): VisualCalibrationResult {
  const validReadings = inputs.luxReadings.filter((r) => r > 0);
  if (!validReadings.length) {
    return emptyResult();
  }

  const averageLux = validReadings.reduce((a, b) => a + b, 0) / validReadings.length;

  // fL = (lux × gain) / π
  const footLamberts = (averageLux * inputs.screenGain) / Math.PI;

  // Uniformity % = (min / max) × 100
  const minLux = Math.min(...validReadings);
  const maxLux = Math.max(...validReadings);
  const uniformityPercent = maxLux > 0 ? (minLux / maxLux) * 100 : 0;

  const brightnessClass = classifyBrightness(footLamberts);
  const uniformityClass = classifyUniformity(uniformityPercent);
  const overallStatus = getOverallStatus(brightnessClass.level, uniformityClass.level);

  const insights: Insight[] = buildInsights(
    footLamberts,
    uniformityPercent,
    brightnessClass,
    uniformityClass,
    inputs
  );

  const recommendations: Recommendation[] = buildRecommendations(
    footLamberts,
    uniformityPercent,
    brightnessClass.level,
    uniformityClass.level,
    inputs
  );

  const summary = buildSummary(
    footLamberts,
    uniformityPercent,
    brightnessClass,
    uniformityClass,
    overallStatus,
    inputs
  );

  return {
    averageLux: Math.round(averageLux * 10) / 10,
    footLamberts: Math.round(footLamberts * 10) / 10,
    uniformityPercent: Math.round(uniformityPercent * 10) / 10,
    brightnessClassification: brightnessClass.level,
    brightnessLabel: brightnessClass.label,
    uniformityClassification: uniformityClass.level,
    uniformityLabel: uniformityClass.label,
    overallStatus,
    overallLabel: overallStatus === 'good' ? 'System Validated' : overallStatus === 'warning' ? 'Attention Required' : 'Immediate Action Required',
    insights,
    recommendations,
    summary,
  };
}

function buildInsights(
  fL: number,
  uniformity: number,
  brightnessClass: { level: StatusLevel; label: string },
  uniformityClass: { level: StatusLevel; label: string },
  inputs: VisualCalibrationInputs
): Insight[] {
  const insights: Insight[] = [];

  // Brightness insight
  if (brightnessClass.level === 'good') {
    insights.push({
      title: 'Brightness Within SMPTE Specification',
      body: `Screen luminance of ${(Math.round(fL * 10) / 10)} fL falls within the SMPTE 196M target range of 14–22 fL. This delivers accurate color reproduction and comfortable viewing conditions.`,
      level: 'good',
    });
  } else if (brightnessClass.level === 'warning' && fL < FL_THRESHOLDS.warning_low) {
    insights.push({
      title: 'Screen Luminance Below Target',
      body: `At ${(Math.round(fL * 10) / 10)} fL, the image is noticeably dim. Common causes include projector lamp degradation, incorrect iris settings, or excessive ambient light. Verify lamp hours and iris configuration.`,
      level: 'warning',
    });
  } else if (brightnessClass.level === 'warning' && fL > FL_THRESHOLDS.good_high) {
    insights.push({
      title: 'Screen Luminance Above Target',
      body: `${(Math.round(fL * 10) / 10)} fL exceeds the recommended ceiling. Elevated brightness causes viewer discomfort, accelerated eye fatigue, and may indicate incorrect iris or zoom settings.`,
      level: 'warning',
    });
  } else if (brightnessClass.level === 'critical' && fL < FL_THRESHOLDS.critical_low) {
    insights.push({
      title: 'Critical: Screen is Too Dim for Presentation',
      body: `${(Math.round(fL * 10) / 10)} fL is critically below spec. Content will appear washed out in any ambient light. Immediate diagnostic required — lamp may require replacement.`,
      level: 'critical',
    });
  } else if (brightnessClass.level === 'critical' && fL > FL_THRESHOLDS.warning_high) {
    insights.push({
      title: 'Critical: Excessive Screen Brightness',
      body: `${(Math.round(fL * 10) / 10)} fL far exceeds recommended limits. This level of brightness can cause physical discomfort and indicates a misconfiguration. Review projector output and screen gain settings.`,
      level: 'critical',
    });
  }

  // Uniformity insight
  if (uniformityClass.level === 'good') {
    insights.push({
      title: 'Excellent Screen Uniformity',
      body: `${(Math.round(uniformity * 10) / 10)}% uniformity confirms consistent light distribution across the screen surface. Edge-to-edge image quality is well within professional tolerance.`,
      level: 'good',
    });
  } else if (uniformityClass.level === 'warning') {
    insights.push({
      title: 'Screen Uniformity is Marginal',
      body: `${(Math.round(uniformity * 10) / 10)}% uniformity falls short of the 75% target. Visible brightness falloff may be apparent in low-APL scenes. Verify projector alignment, lens shift, and physical screen tension.`,
      level: 'warning',
    });
  } else {
    insights.push({
      title: 'Poor Uniformity — Installation Review Required',
      body: `${(Math.round(uniformity * 10) / 10)}% uniformity indicates severe hot-spotting or lens vignetting. This is likely visible to unaided observation. The projector lens, screen mounting, or throw distance may need adjustment.`,
      level: 'critical',
    });
  }

  // Gain context
  if (inputs.screenGain < 0.8) {
    insights.push({
      title: 'Low Screen Gain May Limit Brightness',
      body: `Screen gain of ${inputs.screenGain} is lower than typical. This increases contrast and viewing angle uniformity but reduces peak brightness. Ensure the projector output is sufficient to compensate.`,
      level: 'info',
    });
  } else if (inputs.screenGain > 1.5) {
    insights.push({
      title: 'High Screen Gain Narrows Viewing Cone',
      body: `A gain of ${inputs.screenGain} concentrates reflected light forward, boosting on-axis brightness but reducing luminance for viewers at wider angles. Verify seating layout against the screen's half-gain angle.`,
      level: 'warning',
    });
  }

  return insights;
}

function buildRecommendations(
  fL: number,
  uniformity: number,
  brightnessStatus: StatusLevel,
  uniformityStatus: StatusLevel,
  inputs: VisualCalibrationInputs
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (brightnessStatus === 'critical' && fL < FL_THRESHOLDS.critical_low) {
    recs.push({
      priority: 'high',
      action: 'Inspect projector lamp hours and replace if near end-of-life',
      rationale: `Screen luminance of ${Math.round(fL * 10) / 10} fL is critically low. Lamp degradation is the most likely cause.`,
    });
    recs.push({
      priority: 'high',
      action: 'Check projector iris and ND filter settings',
      rationale: 'An accidentally engaged ND filter or closed iris will severely reduce output.',
    });
  }

  if (brightnessStatus === 'warning' && fL < FL_THRESHOLDS.warning_low) {
    recs.push({
      priority: 'medium',
      action: 'Verify projector output mode is set to full brightness',
      rationale: 'Many projectors ship in Eco mode. Confirm output settings match commissioning spec.',
    });
  }

  if (brightnessStatus === 'critical' && fL > FL_THRESHOLDS.warning_high) {
    recs.push({
      priority: 'high',
      action: 'Reduce projector iris setting or engage ND filter',
      rationale: `${Math.round(fL * 10) / 10} fL causes viewer discomfort. Reduce output to fall within 14–22 fL range.`,
    });
  }

  if (uniformityStatus === 'critical') {
    recs.push({
      priority: 'high',
      action: 'Re-align projector and recalibrate lens shift / zoom',
      rationale: `${Math.round(uniformity * 10) / 10}% uniformity indicates significant light falloff. Realignment is required before handover.`,
    });
  }

  if (uniformityStatus === 'warning') {
    recs.push({
      priority: 'medium',
      action: 'Apply digital keystone correction sparingly and verify physical screen tension',
      rationale: 'Marginal uniformity can often be improved through physical alignment rather than digital correction, which can degrade sharpness.',
    });
  }

  if (inputs.screenGain > 1.5) {
    recs.push({
      priority: 'medium',
      action: `Validate seating layout against screen half-gain angle spec (gain: ${inputs.screenGain})`,
      rationale: 'High-gain screens lose significant brightness beyond ±30°. Ensure no critical seating positions fall outside the gain cone.',
    });
  }

  if (!recs.length) {
    recs.push({
      priority: 'low',
      action: 'Schedule next lux calibration check at 6-month interval or 2,000 lamp hours',
      rationale: 'System is currently within specification. Routine recalibration prevents gradual performance drift.',
    });
  }

  return recs;
}

function buildSummary(
  fL: number,
  uniformity: number,
  brightnessClass: { level: StatusLevel; label: string },
  uniformityClass: { level: StatusLevel; label: string },
  overall: StatusLevel,
  inputs: VisualCalibrationInputs
): string {
  const status = overall === 'good' ? 'validated and within specification' : overall === 'warning' ? 'flagged with calibration concerns' : 'in a critical state requiring immediate attention';
  const screenInfo = inputs.projectorModel ? `${inputs.projectorModel} projector` : 'the installed projector';

  return `Visual calibration of the ${inputs.screenSize}" ${inputs.screenType.replace(/-/g, ' ')} screen using ${screenInfo} has been ${status}. Measured screen luminance is ${Math.round(fL * 10) / 10} fL (${brightnessClass.label}) against the SMPTE target of 14–22 fL, and screen uniformity is ${Math.round(uniformity * 10) / 10}% (${uniformityClass.label}). ${overall === 'good' ? 'No corrective action is required at this time.' : 'Corrective action is required prior to client handover.'}`;
}

function emptyResult(): VisualCalibrationResult {
  return {
    averageLux: 0,
    footLamberts: 0,
    uniformityPercent: 0,
    brightnessClassification: 'neutral',
    brightnessLabel: '—',
    uniformityClassification: 'neutral',
    uniformityLabel: '—',
    overallStatus: 'neutral',
    overallLabel: 'Awaiting Input',
    insights: [],
    recommendations: [],
    summary: 'Enter your measurement data above to generate a calibration report.',
  };
}
