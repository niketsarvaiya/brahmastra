import type { StatusLevel, Insight, Recommendation } from '../../types';

export type ChannelId =
  | 'FL' | 'C' | 'FR'
  | 'SL' | 'SR'
  | 'RL' | 'RR'
  | 'AFL' | 'AFR' | 'ARL' | 'ARR'
  | 'Sub1' | 'Sub2';

export const CHANNEL_LABELS: Record<ChannelId, string> = {
  FL: 'Front Left', C: 'Center', FR: 'Front Right',
  SL: 'Surround Left', SR: 'Surround Right',
  RL: 'Rear Left', RR: 'Rear Right',
  AFL: 'Atmos Front Left', AFR: 'Atmos Front Right',
  ARL: 'Atmos Rear Left', ARR: 'Atmos Rear Right',
  Sub1: 'Subwoofer 1', Sub2: 'Subwoofer 2',
};

export const CHANNEL_SHORT: Record<ChannelId, string> = {
  FL: 'FL', C: 'C', FR: 'FR',
  SL: 'SL', SR: 'SR',
  RL: 'RL', RR: 'RR',
  AFL: 'AFL', AFR: 'AFR',
  ARL: 'ARL', ARR: 'ARR',
  Sub1: 'SW1', Sub2: 'SW2',
};

export const SYSTEM_CHANNELS: Record<string, ChannelId[]> = {
  'stereo':  ['FL', 'FR'],
  '3.1':     ['FL', 'C', 'FR', 'Sub1'],
  '5.1':     ['FL', 'C', 'FR', 'SL', 'SR', 'Sub1'],
  '5.1.2':   ['FL', 'C', 'FR', 'SL', 'SR', 'AFL', 'AFR', 'Sub1'],
  '7.1':     ['FL', 'C', 'FR', 'SL', 'SR', 'RL', 'RR', 'Sub1'],
  '7.1.2':   ['FL', 'C', 'FR', 'SL', 'SR', 'RL', 'RR', 'AFL', 'AFR', 'Sub1'],
  '7.2.4':   ['FL', 'C', 'FR', 'SL', 'SR', 'RL', 'RR', 'AFL', 'AFR', 'ARL', 'ARR', 'Sub1', 'Sub2'],
  'custom':  ['FL', 'C', 'FR', 'SL', 'SR', 'RL', 'RR', 'AFL', 'AFR', 'ARL', 'ARR', 'Sub1', 'Sub2'],
};

export function isSub(ch: ChannelId) { return ch === 'Sub1' || ch === 'Sub2'; }
export function isAtmos(ch: ChannelId) { return ch.startsWith('A'); }
export function isSurround(ch: ChannelId) { return ch === 'SL' || ch === 'SR' || ch === 'RL' || ch === 'RR'; }

export interface ChannelData {
  spl: number | '';          // measured SPL in dB
  distance: number | '';     // distance from LP in selected unit
  crossover: number | '';    // crossover freq Hz (0 = not set)
  speakerSize: 'small' | 'large';
}

export interface SpeakerCalibrationInputs {
  projectName: string;
  location: string;
  techName: string;
  systemType: string;
  avrBrand: string;
  avrModel: string;
  distanceUnit: 'ft' | 'm';
  targetSPL: number;
  channels: Partial<Record<ChannelId, ChannelData>>;
  subCount: number;
  subPhase: '0' | '180' | 'unknown';
  subTrimDb: number | '';
  subNotes: string;
  // crossover overrides (global)
  frontCrossover: number | '';
  centerCrossover: number | '';
  surroundCrossover: number | '';
  rearCrossover: number | '';
  atmosCrossover: number | '';
  subLPF: number | '';
  // observations
  obs: {
    dialogueWeak: boolean;
    bassBoomy: boolean;
    bassWeak: boolean;
    surroundsLoud: boolean;
    surroundsSoft: boolean;
    atmosNotNoticeable: boolean;
    frontHarsh: boolean;
    overallBalanced: boolean;
  };
  notes: string;
}

export interface ChannelResult {
  id: ChannelId;
  label: string;
  measured: number | '';
  target: number;
  deviation: number | null;
  status: StatusLevel;
  statusLabel: string;
}

export interface SpeakerCalibrationResult {
  hasData: boolean;
  activeChannels: ChannelId[];
  channelResults: ChannelResult[];
  avgDeviation: number | null;
  worstDeviation: number | null;
  worstChannel: string;
  outOfToleranceCount: number;
  balanceStatus: StatusLevel;
  balanceLabel: string;
  crossoverStatus: StatusLevel;
  crossoverLabel: string;
  subStatus: StatusLevel;
  subLabel: string;
  overallStatus: StatusLevel;
  overallLabel: string;
  insights: Insight[];
  recommendations: Recommendation[];
  summary: string;
  delayFlags: string[];
  crossoverFlags: string[];
}

export function calculateSpeakerCalibration(inputs: SpeakerCalibrationInputs): SpeakerCalibrationResult {
  const activeChannels = SYSTEM_CHANNELS[inputs.systemType] ?? [];

  // Filter to channels with SPL measurements
  const measured = activeChannels.filter(ch => {
    const d = inputs.channels[ch];
    return d && d.spl !== '' && typeof d.spl === 'number';
  });

  if (!measured.length) return emptyResult(activeChannels);

  const target = inputs.targetSPL;

  const channelResults: ChannelResult[] = activeChannels.map(ch => {
    const d = inputs.channels[ch];
    const spl = d?.spl;
    if (spl === '' || spl === undefined || typeof spl !== 'number') {
      return { id: ch, label: CHANNEL_LABELS[ch], measured: '', target, deviation: null, status: 'neutral' as StatusLevel, statusLabel: 'No data' };
    }
    const deviation = spl - target;
    const absDeviation = Math.abs(deviation);
    const status: StatusLevel = absDeviation <= 1 ? 'good' : absDeviation <= 2 ? 'warning' : 'critical';
    const statusLabel = absDeviation <= 1 ? `±${absDeviation.toFixed(1)} dB — Excellent` : absDeviation <= 2 ? `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)} dB — Acceptable` : `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)} dB — Needs Correction`;
    return { id: ch, label: CHANNEL_LABELS[ch], measured: spl, target, deviation, status, statusLabel };
  });

  const withData = channelResults.filter(r => r.deviation !== null);
  const deviations = withData.map(r => Math.abs(r.deviation!));
  const avgDeviation = deviations.length ? deviations.reduce((a, b) => a + b, 0) / deviations.length : null;
  const worstDeviation = deviations.length ? Math.max(...deviations) : null;
  const worstIdx = worstDeviation !== null ? deviations.indexOf(worstDeviation) : -1;
  const worstChannel = worstIdx >= 0 ? withData[worstIdx].label : '—';
  const outOfToleranceCount = withData.filter(r => r.status === 'critical').length;
  const warningCount = withData.filter(r => r.status === 'warning').length;

  const balanceStatus: StatusLevel = outOfToleranceCount === 0 && warningCount <= 1 ? 'good'
    : outOfToleranceCount <= 2 || warningCount <= 3 ? 'warning' : 'critical';
  const balanceLabel = balanceStatus === 'good' ? 'Well Balanced' : balanceStatus === 'warning' ? 'Minor Imbalance' : 'Significant Imbalance';

  const { crossoverStatus, crossoverLabel, crossoverFlags } = evaluateCrossovers(inputs, activeChannels);
  const { subStatus, subLabel } = evaluateSub(inputs);
  const delayFlags = evaluateDelays(inputs, activeChannels);

  const overallStatus = worstOf(worstOf(balanceStatus, crossoverStatus), subStatus);
  const overallLabel = overallStatus === 'good' ? 'System Validated' : overallStatus === 'warning' ? 'Attention Required' : 'Correction Required';

  const insights = buildInsights(balanceStatus, crossoverStatus, subStatus, withData, outOfToleranceCount, delayFlags, crossoverFlags, inputs);
  const recommendations = buildRecommendations(channelResults, balanceStatus, crossoverStatus, subStatus, inputs, outOfToleranceCount, delayFlags);
  const summary = buildSummary(inputs, balanceStatus, crossoverStatus, subStatus, overallStatus, withData.length, outOfToleranceCount, avgDeviation);

  return {
    hasData: true,
    activeChannels,
    channelResults,
    avgDeviation,
    worstDeviation,
    worstChannel,
    outOfToleranceCount,
    balanceStatus,
    balanceLabel,
    crossoverStatus,
    crossoverLabel,
    subStatus,
    subLabel,
    overallStatus,
    overallLabel,
    insights,
    recommendations,
    summary,
    delayFlags,
    crossoverFlags,
  };
}

function evaluateCrossovers(inputs: SpeakerCalibrationInputs, channels: ChannelId[]): { crossoverStatus: StatusLevel; crossoverLabel: string; crossoverFlags: string[] } {
  const flags: string[] = [];

  const hasFronts = channels.some(c => c === 'FL' || c === 'FR');
  const hasCenter = channels.includes('C');
  const hasSurrounds = channels.some(c => isSurround(c));
  const hasAtmos = channels.some(c => isAtmos(c) && !isSub(c));

  // Check front crossover
  if (hasFronts && inputs.frontCrossover !== '') {
    const xo = Number(inputs.frontCrossover);
    const chData = inputs.channels['FL'] || inputs.channels['FR'];
    const size = chData?.speakerSize ?? 'small';
    if (size === 'small' && xo < 60) flags.push(`Front crossover at ${xo} Hz may be too low for small speakers — consider 80 Hz minimum.`);
    if (size === 'small' && xo > 150) flags.push(`Front crossover at ${xo} Hz is unusually high — may cause a localisable subwoofer effect.`);
    if (size === 'large' && xo > 0 && xo < 40) flags.push(`Front speakers set to Large but crossover is ${xo} Hz — verify bass management intent.`);
  }
  if (hasCenter && inputs.centerCrossover !== '') {
    const xo = Number(inputs.centerCrossover);
    if (xo < 60) flags.push(`Center crossover at ${xo} Hz is below recommended minimum for most center speakers.`);
    if (xo > 150) flags.push(`Center crossover at ${xo} Hz is high — dialogue presence may be affected.`);
  }
  if (hasSurrounds && inputs.surroundCrossover !== '') {
    const xo = Number(inputs.surroundCrossover);
    if (xo < 80) flags.push(`Surround crossover at ${xo} Hz is below 80 Hz — typical surround drivers may strain below this point.`);
  }
  if (hasAtmos && inputs.atmosCrossover !== '') {
    const xo = Number(inputs.atmosCrossover);
    if (xo < 80) flags.push(`Atmos crossover at ${xo} Hz is low for ceiling/height channels — most Atmos modules are optimised above 80 Hz.`);
    if (xo > 150) flags.push(`Atmos crossover at ${xo} Hz is high — this may make height effects sound unnatural.`);
  }
  if (inputs.subLPF !== '') {
    const lpf = Number(inputs.subLPF);
    const highestXO = Math.max(
      ...([inputs.frontCrossover, inputs.centerCrossover, inputs.surroundCrossover].filter(v => v !== '') as number[])
    );
    if (lpf > 0 && highestXO > 0 && lpf < highestXO) {
      flags.push(`Sub LPF (${lpf} Hz) is below the highest satellite crossover (${highestXO} Hz) — this creates a frequency gap.`);
    }
    if (lpf > 120) flags.push(`Sub LPF at ${lpf} Hz may cause localisation of low frequencies — consider ≤120 Hz.`);
  }

  const crossoverStatus: StatusLevel = flags.length === 0 ? 'good' : flags.length <= 2 ? 'warning' : 'critical';
  const crossoverLabel = crossoverStatus === 'good' ? 'Settings Look Reasonable' : crossoverStatus === 'warning' ? 'Review Recommended' : 'Issues Detected';
  return { crossoverStatus, crossoverLabel, crossoverFlags: flags };
}

function evaluateSub(inputs: SpeakerCalibrationInputs): { subStatus: StatusLevel; subLabel: string } {
  const { obs, subTrimDb, subPhase } = inputs;
  let severity = 0;

  if (obs.bassBoomy) severity += 2;
  if (obs.bassWeak) severity += 2;
  if (subPhase === 'unknown') severity += 1;
  if (subTrimDb !== '' && Math.abs(Number(subTrimDb)) > 8) severity += 1;
  if (obs.bassBoomy && obs.bassWeak) severity += 1; // contradictory = real problem

  const subStatus: StatusLevel = severity === 0 ? 'good' : severity <= 2 ? 'warning' : 'critical';
  const subLabel = subStatus === 'good' ? 'Integration Looks Good' : subStatus === 'warning' ? 'Minor Concern' : 'Review Required';
  return { subStatus, subLabel };
}

function evaluateDelays(inputs: SpeakerCalibrationInputs, channels: ChannelId[]): string[] {
  const flags: string[] = [];
  const distances: Partial<Record<ChannelId, number>> = {};

  for (const ch of channels) {
    const d = inputs.channels[ch];
    if (d && d.distance !== '' && typeof d.distance === 'number') {
      distances[ch] = d.distance;
    }
  }

  if (Object.keys(distances).length < 2) return flags;

  const flDist = distances['FL'];
  const frDist = distances['FR'];
  const cDist = distances['C'];
  const slDist = distances['SL'];
  const srDist = distances['SR'];

  // FL/FR should be roughly equal
  if (flDist !== undefined && frDist !== undefined && Math.abs(flDist - frDist) > 0.5) {
    flags.push(`Front Left (${flDist}${inputs.distanceUnit}) and Front Right (${frDist}${inputs.distanceUnit}) distances differ by more than 0.5${inputs.distanceUnit} — verify asymmetric placement is intentional.`);
  }

  // Center should generally be similar to FL/FR
  if (cDist !== undefined && flDist !== undefined && Math.abs(cDist - flDist) > 1.5) {
    flags.push(`Center distance (${cDist}${inputs.distanceUnit}) differs significantly from Front Left (${flDist}${inputs.distanceUnit}) — confirm AVR delay compensation is set correctly.`);
  }

  // Surrounds typically farther than fronts
  if (slDist !== undefined && flDist !== undefined && slDist < flDist) {
    flags.push(`Surround Left (${slDist}${inputs.distanceUnit}) is closer than Front Left (${flDist}${inputs.distanceUnit}) — unusual for most room layouts. Verify measurement.`);
  }
  if (srDist !== undefined && frDist !== undefined && srDist < frDist) {
    flags.push(`Surround Right (${srDist}${inputs.distanceUnit}) is closer than Front Right (${frDist}${inputs.distanceUnit}) — verify measurement.`);
  }

  // Check for extremely short distances (likely measurement errors)
  for (const [ch, dist] of Object.entries(distances)) {
    if (dist < 0.5 && inputs.distanceUnit === 'm') {
      flags.push(`${CHANNEL_LABELS[ch as ChannelId]} distance of ${dist}m seems unusually short — verify measurement.`);
    }
    if (dist < 1.5 && inputs.distanceUnit === 'ft') {
      flags.push(`${CHANNEL_LABELS[ch as ChannelId]} distance of ${dist}ft seems unusually short — verify measurement.`);
    }
  }

  return flags;
}

function buildInsights(
  balanceStatus: StatusLevel,
  crossoverStatus: StatusLevel,
  subStatus: StatusLevel,
  withData: ChannelResult[],
  outOfToleranceCount: number,
  delayFlags: string[],
  crossoverFlags: string[],
  inputs: SpeakerCalibrationInputs
): Insight[] {
  const insights: Insight[] = [];

  // Balance insight
  if (balanceStatus === 'good') {
    insights.push({
      title: 'Channel Balance is Well-Aligned',
      body: `All measured channels are within ±1–2 dB of the ${inputs.targetSPL} dB target. This level of balance is considered acceptable for home theatre calibration. The front soundstage should be coherent and well-centred.`,
      level: 'good',
    });
  } else if (balanceStatus === 'warning') {
    const offChannels = withData.filter(r => r.status !== 'good').map(r => r.label).join(', ');
    insights.push({
      title: 'Minor Channel Imbalance Detected',
      body: `${outOfToleranceCount > 0 ? outOfToleranceCount : 'Some'} channel(s) deviate beyond ±2 dB from target: ${offChannels}. Small imbalances in dialogue, imaging, and surround envelopment may be noticeable. Trim adjustments in the AVR/processor are recommended.`,
      level: 'warning',
    });
  } else {
    insights.push({
      title: 'Significant Channel Imbalance — Calibration Required',
      body: `${outOfToleranceCount} channels exceed the ±2 dB tolerance. This level of imbalance will be clearly audible — the soundstage will appear skewed, and surround envelopment may feel inconsistent. This must be corrected before handover.`,
      level: 'critical',
    });
  }

  // Observations-based insights
  if (inputs.obs.dialogueWeak) {
    insights.push({
      title: 'Weak Dialogue Reported',
      body: `User or technician has flagged weak dialogue. This typically indicates center channel level is low, center crossover is set too high, or the center speaker is undersized for the room. Check center trim and verify center speaker placement relative to the screen.`,
      level: 'warning',
    });
  }

  if (inputs.obs.surroundsLoud || inputs.obs.surroundsSoft) {
    insights.push({
      title: `Surround Level Imbalance Reported`,
      body: `Surrounds are perceived as ${inputs.obs.surroundsLoud ? 'too loud' : 'too soft'}. This may be a trim issue in the AVR or a reflection of room acoustics. Verify surround SPL measurements and apply trim correction as needed.`,
      level: 'warning',
    });
  }

  if (inputs.obs.atmosNotNoticeable) {
    insights.push({
      title: 'Atmos Height Effect Not Noticeable',
      body: `Height channels are not providing the expected overhead or immersive effect. Check Atmos speaker placement (ensure they are aimed at ceiling reflection points or positioned overhead), verify Atmos is enabled in content and AVR, and confirm speaker distances are correct.`,
      level: 'warning',
    });
  }

  // Crossover insight
  if (crossoverStatus !== 'good' && crossoverFlags.length) {
    insights.push({
      title: `Crossover Settings Need Review (${crossoverFlags.length} concern${crossoverFlags.length !== 1 ? 's' : ''})`,
      body: crossoverFlags[0],
      level: crossoverStatus,
    });
  }

  // Sub insight
  if (subStatus === 'critical') {
    insights.push({
      title: 'Subwoofer Integration Requires Attention',
      body: `Observed symptoms (${[inputs.obs.bassBoomy && 'bass bloom', inputs.obs.bassWeak && 'weak bass'].filter(Boolean).join(', ')}) combined with${inputs.subPhase === 'unknown' ? ' unknown phase setting and' : ''} current trim indicate sub integration may need physical or DSP adjustments before handover.`,
      level: 'critical',
    });
  }

  if (delayFlags.length) {
    insights.push({
      title: 'Distance/Delay Anomalies Detected',
      body: delayFlags[0],
      level: 'warning',
    });
  }

  return insights;
}

function buildRecommendations(
  channelResults: ChannelResult[],
  _balanceStatus: StatusLevel,
  _crossoverStatus: StatusLevel,
  _subStatus: StatusLevel,
  inputs: SpeakerCalibrationInputs,
  _outOfToleranceCount: number,
  delayFlags: string[]
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Per-channel trim recommendations
  const critical = channelResults.filter(r => r.status === 'critical' && r.deviation !== null);
  for (const ch of critical.slice(0, 3)) {
    const adj = -(ch.deviation!);
    recs.push({
      priority: 'high',
      action: `Adjust ${ch.label} trim by ${adj > 0 ? '+' : ''}${adj.toFixed(1)} dB in AVR`,
      rationale: `Measured ${ch.measured} dB against ${ch.target} dB target — ${Math.abs(ch.deviation!).toFixed(1)} dB out of tolerance.`,
    });
  }

  const warnings = channelResults.filter(r => r.status === 'warning' && r.deviation !== null);
  for (const ch of warnings.slice(0, 2)) {
    const adj = -(ch.deviation!);
    recs.push({
      priority: 'medium',
      action: `Fine-tune ${ch.label} trim by ${adj > 0 ? '+' : ''}${adj.toFixed(1)} dB`,
      rationale: `Currently ${Math.abs(ch.deviation!).toFixed(1)} dB off target — acceptable but worth correcting for best performance.`,
    });
  }

  // Dialogue
  if (inputs.obs.dialogueWeak) {
    recs.push({ priority: 'high', action: 'Increase Center channel level and verify center speaker positioning', rationale: 'Weak dialogue typically indicates center trim is low or speaker is not optimally placed relative to screen/listening position.' });
  }

  // Sub
  if (inputs.obs.bassBoomy) {
    recs.push({ priority: 'medium', action: 'Review subwoofer placement and try adjusting sub phase / crossover', rationale: 'Bass bloom is commonly caused by room modes, incorrect sub placement, or sub phase cancellation with main speakers.' });
  }
  if (inputs.obs.bassWeak) {
    recs.push({ priority: 'medium', action: 'Check subwoofer polarity, increase sub trim, and verify crossover continuity', rationale: 'Weak bass can result from phase cancellation, low gain, or a gap between satellite rolloff and sub LPF.' });
  }
  if (inputs.subPhase === 'unknown') {
    recs.push({ priority: 'medium', action: 'Determine and confirm subwoofer phase setting', rationale: 'Unknown phase can result in partial cancellation with main speakers near the crossover frequency.' });
  }

  // Atmos
  if (inputs.obs.atmosNotNoticeable) {
    recs.push({ priority: 'medium', action: 'Verify Atmos speaker placement and AVR height channel configuration', rationale: 'For overhead immersion, ceiling or up-firing Atmos modules must be correctly positioned and the AVR must be set to the correct speaker layout.' });
  }

  // Delay
  if (delayFlags.length) {
    recs.push({ priority: 'medium', action: 'Re-measure and re-enter speaker distances, then verify AVR delay compensation', rationale: delayFlags[0] });
  }

  if (!recs.length) {
    recs.push({ priority: 'low', action: 'Document calibration baseline and schedule re-check after 30-day room settling', rationale: 'System is currently well-calibrated. Rooms can shift acoustically after furniture and furnishings settle.' });
  }

  return recs;
}

function buildSummary(
  inputs: SpeakerCalibrationInputs,
  balanceStatus: StatusLevel,
  crossoverStatus: StatusLevel,
  subStatus: StatusLevel,
  overallStatus: StatusLevel,
  measuredCount: number,
  outOfToleranceCount: number,
  avgDeviation: number | null
): string {
  const system = inputs.systemType.toUpperCase();
  const avr = [inputs.avrBrand, inputs.avrModel].filter(Boolean).join(' ') || 'the installed processor';
  const balanceWord = balanceStatus === 'good' ? 'well-balanced' : balanceStatus === 'warning' ? 'showing minor imbalance' : 'requiring calibration correction';
  const overall = overallStatus === 'good' ? 'System is ready for handover.' : 'Corrective action is recommended before client handover.';

  return `${system} system calibration review using ${avr} across ${measuredCount} measured channels. Channel balance is ${balanceWord}${outOfToleranceCount > 0 ? ` with ${outOfToleranceCount} channel(s) exceeding ±2 dB` : ''}${avgDeviation !== null ? ` (average deviation: ${avgDeviation.toFixed(1)} dB)` : ''}. Crossover settings are ${crossoverStatus === 'good' ? 'broadly appropriate' : 'flagged for review'}. Subwoofer integration appears ${subStatus === 'good' ? 'satisfactory' : 'in need of attention'}. ${overall}`;
}

function worstOf(a: StatusLevel, b: StatusLevel): StatusLevel {
  const rank: Record<StatusLevel, number> = { critical: 3, warning: 2, good: 1, info: 0, neutral: 0 };
  return Math.max(rank[a], rank[b]) >= 3 ? 'critical' : Math.max(rank[a], rank[b]) >= 2 ? 'warning' : 'good';
}

function emptyResult(activeChannels: ChannelId[]): SpeakerCalibrationResult {
  return {
    hasData: false, activeChannels,
    channelResults: activeChannels.map(id => ({ id, label: CHANNEL_LABELS[id], measured: '', target: 75, deviation: null, status: 'neutral', statusLabel: 'No data' })),
    avgDeviation: null, worstDeviation: null, worstChannel: '—', outOfToleranceCount: 0,
    balanceStatus: 'neutral', balanceLabel: '—',
    crossoverStatus: 'neutral', crossoverLabel: '—',
    subStatus: 'neutral', subLabel: '—',
    overallStatus: 'neutral', overallLabel: 'Awaiting Input',
    insights: [], recommendations: [],
    summary: 'Enter SPL measurements for each active channel to generate a calibration report.',
    delayFlags: [], crossoverFlags: [],
  };
}
