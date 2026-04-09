import type { StatusLevel, Insight, Recommendation } from '../../types';

export interface WifiZone {
  id: string;
  room: string;
  rssi: number | '';
  band: '2.4GHz' | '5GHz' | '6GHz' | 'unknown';
  speedMbps: number | '';
  roamingIssue: boolean;
  streamingIssue: boolean;
  voiceIssue: boolean;
}

export interface NetworkAuditInputs {
  projectName: string;
  location: string;
  techName: string;
  // WAN
  ispName: string;
  planDown: number | '';
  planUp: number | '';
  actualDown: number | '';
  actualUp: number | '';
  pingMs: number | '';
  jitterMs: number | '';
  packetLossPct: number | '';
  // Infrastructure
  routerBrand: string;
  switchBrand: string;
  managedSwitch: boolean;
  apCount: number | '';
  apBrand: string;
  controllerWifi: boolean;
  meshWifi: boolean;
  vlansImplemented: boolean;
  upsForNetwork: boolean;
  // WiFi zones (dynamic)
  zones: WifiZone[];
  // Wired checks
  wired: {
    apsWired: boolean;
    wirelessUplinks: boolean;
    cctvWired: boolean;
    avWired: boolean;
    rackLabelled: boolean;
    poeBudgetVerified: boolean;
    loopObserved: boolean;
    randomDrops: boolean;
  };
  // Smart home profile
  profile: {
    automation: boolean;
    avStreaming: boolean;
    cctv: boolean;
    vdp: boolean;
    voiceAssistants: boolean;
    wfh: boolean;
    gaming: boolean;
    multiRoomAudio: boolean;
    remoteAccess: boolean;
  };
  // Observations
  obs: {
    deadZones: boolean;
    slowApp: boolean;
    cameraBuffering: boolean;
    intercomDelay: boolean;
    wifiDropsRoaming: boolean;
    slowStreaming: boolean;
    voiceInconsistent: boolean;
    networkRestartsNeeded: boolean;
    overallStable: boolean;
  };
  notes: string;
}

export interface ZoneResult {
  id: string;
  room: string;
  rssi: number | '';
  band: string;
  signalStatus: StatusLevel;
  signalLabel: string;
  speedMbps: number | '';
  flags: string[];
}

export interface NetworkAuditResult {
  hasData: boolean;
  // Internet
  internetStatus: StatusLevel;
  internetLabel: string;
  pingStatus: StatusLevel;
  pingLabel: string;
  packetLossStatus: StatusLevel;
  packetLossLabel: string;
  speedStatus: StatusLevel;
  speedLabel: string;
  // WiFi
  coverageStatus: StatusLevel;
  coverageLabel: string;
  avgRssi: number | null;
  worstZone: string;
  worstRssi: number | null;
  zoneResults: ZoneResult[];
  // Infrastructure
  infraStatus: StatusLevel;
  infraLabel: string;
  // Smart home readiness
  readinessStatus: StatusLevel;
  readinessLabel: string;
  // Overall
  overallStatus: StatusLevel;
  overallLabel: string;
  insights: Insight[];
  recommendations: Recommendation[];
  summary: string;
}

// RSSI thresholds
function classifyRSSI(rssi: number): { status: StatusLevel; label: string } {
  if (rssi >= -55) return { status: 'good', label: 'Excellent' };
  if (rssi >= -67) return { status: 'good', label: 'Good' };
  if (rssi >= -72) return { status: 'warning', label: 'Fair' };
  return { status: 'critical', label: 'Weak' };
}

function classifyPing(ping: number): { status: StatusLevel; label: string } {
  if (ping < 20) return { status: 'good', label: 'Excellent (<20ms)' };
  if (ping < 40) return { status: 'good', label: 'Good (20–40ms)' };
  if (ping < 70) return { status: 'warning', label: 'Acceptable (40–70ms)' };
  return { status: 'critical', label: `Poor (${ping}ms)` };
}

function classifyPacketLoss(pct: number): { status: StatusLevel; label: string } {
  if (pct === 0) return { status: 'good', label: '0% — Excellent' };
  if (pct < 1) return { status: 'good', label: `${pct}% — Acceptable` };
  if (pct < 3) return { status: 'warning', label: `${pct}% — Concern` };
  return { status: 'critical', label: `${pct}% — Serious Issue` };
}

function classifySpeedVariance(actual: number, plan: number): { status: StatusLevel; label: string } {
  const pct = (actual / plan) * 100;
  if (pct >= 80) return { status: 'good', label: `${Math.round(pct)}% of plan speed` };
  if (pct >= 60) return { status: 'warning', label: `${Math.round(pct)}% of plan — underperforming` };
  return { status: 'critical', label: `${Math.round(pct)}% of plan — significant loss` };
}

function worstOf(a: StatusLevel, b: StatusLevel): StatusLevel {
  const rank: Record<StatusLevel, number> = { critical: 3, warning: 2, good: 1, info: 0, neutral: 0 };
  const w = Math.max(rank[a], rank[b]);
  return w >= 3 ? 'critical' : w >= 2 ? 'warning' : 'good';
}

export function calculateNetworkAudit(inputs: NetworkAuditInputs): NetworkAuditResult {
  const { planDown, actualDown, pingMs, packetLossPct, zones, wired, profile, obs } = inputs;

  const hasAnyData = (actualDown !== '' && actualDown > 0) || zones.some(z => z.rssi !== '');

  if (!hasAnyData) return emptyResult();

  // ── Internet ──────────────────────────────────────────────────────────────
  let pingStatus: StatusLevel = 'neutral';
  let pingLabel = '—';
  if (pingMs !== '' && typeof pingMs === 'number') {
    const p = classifyPing(pingMs);
    pingStatus = p.status; pingLabel = p.label;
  }

  let packetLossStatus: StatusLevel = 'neutral';
  let packetLossLabel = '—';
  if (packetLossPct !== '' && typeof packetLossPct === 'number') {
    const p = classifyPacketLoss(packetLossPct);
    packetLossStatus = p.status; packetLossLabel = p.label;
  }

  let speedStatus: StatusLevel = 'neutral';
  let speedLabel = '—';
  if (actualDown !== '' && planDown !== '' && typeof actualDown === 'number' && typeof planDown === 'number' && planDown > 0) {
    const s = classifySpeedVariance(actualDown, planDown);
    speedStatus = s.status; speedLabel = s.label;
  }

  const internetStatus = [pingStatus, packetLossStatus, speedStatus].reduce(
    (acc, s) => s === 'neutral' ? acc : worstOf(acc, s), 'good' as StatusLevel
  );
  const internetLabel = internetStatus === 'good' ? 'Healthy' : internetStatus === 'warning' ? 'Moderate Issues' : 'Needs Attention';

  // ── WiFi Coverage ─────────────────────────────────────────────────────────
  const zoneResults: ZoneResult[] = zones.map(z => {
    const flags: string[] = [];
    let signalStatus: StatusLevel = 'neutral';
    let signalLabel = 'No data';

    if (z.rssi !== '' && typeof z.rssi === 'number') {
      const cls = classifyRSSI(z.rssi);
      signalStatus = cls.status; signalLabel = cls.label;
    }
    if (z.roamingIssue) flags.push('Roaming issue observed');
    if (z.streamingIssue) flags.push('Streaming issue');
    if (z.voiceIssue) flags.push('Voice assistant issue');

    return { id: z.id, room: z.room || 'Unnamed area', rssi: z.rssi, band: z.band, signalStatus, signalLabel, speedMbps: z.speedMbps, flags };
  });

  const zonesWithRSSI = zoneResults.filter(z => z.rssi !== '' && typeof z.rssi === 'number');
  const rssiValues = zonesWithRSSI.map(z => z.rssi as number);
  const avgRssi = rssiValues.length ? Math.round(rssiValues.reduce((a, b) => a + b, 0) / rssiValues.length) : null;
  const worstRssi = rssiValues.length ? Math.min(...rssiValues) : null;
  const worstZoneEntry = zonesWithRSSI.find(z => (z.rssi as number) === worstRssi);
  const worstZone = worstZoneEntry?.room ?? '—';

  const weakZones = zoneResults.filter(z => z.signalStatus === 'critical').length;
  const fairZones = zoneResults.filter(z => z.signalStatus === 'warning').length;
  const coverageStatus: StatusLevel = weakZones === 0 && fairZones === 0 ? 'good' : weakZones === 0 ? 'warning' : 'critical';
  const coverageLabel = coverageStatus === 'good' ? 'Good Coverage' : coverageStatus === 'warning' ? 'Some Weak Areas' : 'Dead Zones Present';

  // ── Infrastructure ────────────────────────────────────────────────────────
  let infraScore = 0;
  if (!wired.apsWired) infraScore += 2;
  if (wired.wirelessUplinks) infraScore += 2;
  if (!wired.cctvWired && profile.cctv) infraScore += 1;
  if (!wired.avWired && profile.avStreaming) infraScore += 1;
  if (!wired.rackLabelled) infraScore += 1;
  if (!wired.poeBudgetVerified) infraScore += 1;
  if (wired.loopObserved) infraScore += 3;
  if (wired.randomDrops) infraScore += 2;
  if (!wired.apsWired && inputs.meshWifi && !inputs.controllerWifi) infraScore += 1;

  const infraStatus: StatusLevel = infraScore === 0 ? 'good' : infraScore <= 3 ? 'warning' : 'critical';
  const infraLabel = infraStatus === 'good' ? 'Solid Backbone' : infraStatus === 'warning' ? 'Minor Gaps' : 'Needs Attention';

  // ── Smart Home Readiness ──────────────────────────────────────────────────
  const demandingProfile = [profile.automation, profile.cctv, profile.vdp, profile.avStreaming, profile.voiceAssistants, profile.remoteAccess].filter(Boolean).length;
  const observedIssues = [obs.deadZones, obs.slowApp, obs.cameraBuffering, obs.intercomDelay, obs.wifiDropsRoaming, obs.slowStreaming, obs.voiceInconsistent, obs.networkRestartsNeeded].filter(Boolean).length;

  let readinessScore = 0;
  if (coverageStatus === 'critical') readinessScore += 3 * (demandingProfile > 3 ? 2 : 1);
  if (coverageStatus === 'warning') readinessScore += 1;
  if (internetStatus === 'critical') readinessScore += 2;
  if (internetStatus === 'warning') readinessScore += 1;
  if (infraStatus === 'critical') readinessScore += 2;
  readinessScore += observedIssues;

  const readinessStatus: StatusLevel = readinessScore <= 1 ? 'good' : readinessScore <= 4 ? 'warning' : 'critical';
  const readinessLabel = readinessStatus === 'good' ? 'Ready for Smart Home Use' : readinessStatus === 'warning' ? 'Functional with Caveats' : 'Not Ready — Issues Present';

  const overallStatus = [internetStatus, coverageStatus, infraStatus, readinessStatus].reduce(worstOf, 'good' as StatusLevel);
  const overallLabel = overallStatus === 'good' ? 'Network Audit Passed' : overallStatus === 'warning' ? 'Improvements Recommended' : 'Critical Issues Found';

  const insights = buildInsights(internetStatus, coverageStatus, infraStatus, readinessStatus, inputs, zoneResults, weakZones, fairZones, avgRssi, demandingProfile, observedIssues);
  const recommendations = buildRecommendations(internetStatus, coverageStatus, infraStatus, zoneResults, inputs, observedIssues, demandingProfile);
  const summary = buildSummary(internetStatus, coverageStatus, infraStatus, readinessStatus, overallStatus, inputs, zonesWithRSSI.length, weakZones, avgRssi);

  return {
    hasData: true,
    internetStatus, internetLabel, pingStatus, pingLabel, packetLossStatus, packetLossLabel, speedStatus, speedLabel,
    coverageStatus, coverageLabel, avgRssi, worstZone, worstRssi,
    zoneResults, infraStatus, infraLabel,
    readinessStatus, readinessLabel,
    overallStatus, overallLabel,
    insights, recommendations, summary,
  };
}

function buildInsights(
  internetStatus: StatusLevel, coverageStatus: StatusLevel, _infraStatus: StatusLevel, readinessStatus: StatusLevel,
  inputs: NetworkAuditInputs, zoneResults: ZoneResult[], weakZones: number, fairZones: number,
  avgRssi: number | null, demandingProfile: number, _observedIssues: number
): Insight[] {
  const insights: Insight[] = [];

  // Internet
  if (internetStatus === 'good') {
    insights.push({ title: 'Internet Connection Quality is Healthy', body: `Measured latency, packet loss, and speed are all within acceptable thresholds for a smart home environment. VoIP, video streaming, and remote access should perform reliably.`, level: 'good' });
  } else if (inputs.pingMs !== '' && Number(inputs.pingMs) > 70) {
    insights.push({ title: 'High Latency Detected', body: `Ping of ${inputs.pingMs}ms is above the recommended 70ms threshold. This will noticeably affect video calls, gaming, VDP responsiveness, and cloud-dependent automation triggers. Investigate ISP routing or modem quality.`, level: 'critical' });
  } else if (inputs.packetLossPct !== '' && Number(inputs.packetLossPct) > 1) {
    insights.push({ title: 'Packet Loss Detected', body: `${inputs.packetLossPct}% packet loss can cause intermittent issues with streaming, voice assistants, and real-time automation. Anything above 1% warrants ISP investigation.`, level: inputs.packetLossPct > 3 ? 'critical' : 'warning' });
  }

  // Coverage
  if (coverageStatus === 'good') {
    insights.push({ title: 'WiFi Coverage is Good Across Measured Areas', body: `All measured zones show acceptable RSSI${avgRssi ? ` (average: ${avgRssi} dBm)` : ''}. Roaming and connection stability should be reliable across the property.`, level: 'good' });
  } else if (weakZones > 0) {
    const weakNames = zoneResults.filter(z => z.signalStatus === 'critical').map(z => z.room).join(', ');
    insights.push({ title: `${weakZones} Weak Zone${weakZones > 1 ? 's' : ''} Detected`, body: `${weakNames} show${weakZones === 1 ? 's' : ''} RSSI below -72 dBm — the risk threshold. Devices in these areas are likely to experience dropped connections, slow throughput, and roaming failures.`, level: 'critical' });
  } else if (fairZones > 0) {
    insights.push({ title: 'Some Zones Have Marginal Signal', body: `${fairZones} area${fairZones > 1 ? 's' : ''} show signal in the -68 to -72 dBm range. This is functional for basic browsing but may not be reliable enough for demanding smart home use (camera streaming, voice control, multi-room audio).`, level: 'warning' });
  }

  // Roaming
  if (inputs.obs.wifiDropsRoaming || zoneResults.some(z => z.flags.includes('Roaming issue observed'))) {
    const roamingType = inputs.meshWifi && !inputs.controllerWifi ? 'Mesh WiFi without a dedicated controller' : inputs.meshWifi ? 'Mesh system' : 'Multi-AP setup';
    insights.push({ title: 'Roaming Issues Observed', body: `${roamingType} — roaming transitions between access points may be causing connectivity drops. Verify roaming thresholds (typically -70 dBm trigger), ensure BSS Transition and 802.11r/k/v are enabled where supported.`, level: 'warning' });
  }

  // Infrastructure
  if (!inputs.wired.apsWired) {
    insights.push({ title: 'Access Points Not Fully Wired', body: 'Wireless AP uplinks create a performance bottleneck — backhaul traffic competes with client traffic on the same radio. For a smart home installation, all APs should be wired via ethernet for maximum throughput and reliability.', level: 'warning' });
  }
  if (inputs.wired.loopObserved) {
    insights.push({ title: 'Network Loop / Instability Observed', body: 'A loop in an unmanaged switching environment can cause broadcast storms that saturate the entire network. This is a critical issue requiring immediate investigation before handover.', level: 'critical' });
  }
  if (inputs.wired.randomDrops) {
    insights.push({ title: 'Random Device Drop-offs Reported', body: 'Intermittent device drops may be caused by DHCP exhaustion, PoE budget exceeded, spanning tree flapping, or faulty cabling. Diagnose with switch logs before completing the installation.', level: 'warning' });
  }

  // Demanding profile context
  if (demandingProfile >= 5 && readinessStatus !== 'good') {
    insights.push({ title: 'High-Demand Smart Home Profile — Stricter Standards Apply', body: `This project includes ${demandingProfile} network-dependent systems. At this density, marginal signal, shared bandwidth, and roaming inconsistency will produce noticeable user experience issues. The network must be reliable, not just functional.`, level: 'warning' });
  }

  return insights;
}

function buildRecommendations(
  _internetStatus: StatusLevel, _coverageStatus: StatusLevel, _infraStatus: StatusLevel,
  zoneResults: ZoneResult[], inputs: NetworkAuditInputs, _observedIssues: number, demandingProfile: number
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (inputs.wired.loopObserved) {
    recs.push({ priority: 'high', action: 'Immediately investigate and resolve detected network loop', rationale: 'A switching loop can cause a broadcast storm that brings down the entire network.' });
  }
  if (inputs.wired.randomDrops) {
    recs.push({ priority: 'high', action: 'Investigate intermittent device drops — check PoE budget, DHCP pool, and switch logs', rationale: 'Drop-offs need to be traced to root cause before sign-off — they will generate service calls post-handover.' });
  }
  if (Number(inputs.packetLossPct) > 1) {
    recs.push({ priority: 'high', action: 'Escalate packet loss issue to ISP and test from modem WAN port', rationale: `${inputs.packetLossPct}% packet loss is affecting service reliability and should be resolved before handover.` });
  }
  if (Number(inputs.pingMs) > 70) {
    recs.push({ priority: 'medium', action: 'Investigate high latency — test from modem directly and compare to ISP SLA', rationale: `${inputs.pingMs}ms ping affects real-time systems including VDP, cloud automation, and video calls.` });
  }

  const weakZones = zoneResults.filter(z => z.signalStatus === 'critical');
  for (const zone of weakZones.slice(0, 3)) {
    recs.push({ priority: 'high', action: `Add or reposition AP to improve coverage in ${zone.room}`, rationale: `RSSI of ${zone.rssi} dBm is below the -72 dBm risk threshold. Smart home devices in this zone will be unreliable.` });
  }

  if (!inputs.wired.apsWired) {
    recs.push({ priority: 'high', action: 'Run ethernet to all access points — eliminate wireless uplinks', rationale: 'Wired backhaul is essential for consistent performance in a multi-AP smart home installation.' });
  }
  if (!inputs.wired.poeBudgetVerified) {
    recs.push({ priority: 'medium', action: 'Calculate and verify PoE switch budget against connected AP/camera/VDP load', rationale: 'Exceeding PoE budget causes random device power cycling which looks like intermittent network issues.' });
  }
  if (!inputs.wired.rackLabelled) {
    recs.push({ priority: 'low', action: 'Label all rack ports, patch panel, and cable runs', rationale: 'Unlabelled infrastructure significantly increases time-to-resolution for any future fault.' });
  }
  if (inputs.obs.wifiDropsRoaming || zoneResults.some(z => z.flags.includes('Roaming issue observed'))) {
    recs.push({ priority: 'medium', action: 'Configure roaming thresholds and enable 802.11r fast transition on all APs', rationale: 'Seamless roaming is critical for mobile devices used with voice assistants, automation apps, and streaming.' });
  }
  if (!inputs.vlansImplemented && demandingProfile >= 4) {
    recs.push({ priority: 'medium', action: 'Implement VLANs to separate IoT, CCTV, and client traffic', rationale: 'Network segmentation improves security and prevents IoT devices from affecting critical AV/automation performance.' });
  }
  if (!inputs.upsForNetwork) {
    recs.push({ priority: 'medium', action: 'Install UPS for network rack to maintain connectivity during brief power events', rationale: 'Automation systems should maintain network connectivity during power fluctuations to prevent spurious triggers.' });
  }

  if (!recs.length) {
    recs.push({ priority: 'low', action: 'Document network baseline (speeds, RSSI, latency) for future reference', rationale: 'Network health should be re-tested at 6-month intervals to identify any degradation.' });
  }

  return recs;
}

function buildSummary(
  internetStatus: StatusLevel, coverageStatus: StatusLevel, infraStatus: StatusLevel,
  readinessStatus: StatusLevel, overallStatus: StatusLevel,
  inputs: NetworkAuditInputs, zoneCount: number, weakZones: number, avgRssi: number | null
): string {
  const infra = inputs.apCount ? `${inputs.apCount} AP${Number(inputs.apCount) !== 1 ? 's' : ''}` : 'installed APs';
  const mesh = inputs.meshWifi ? ' (mesh)' : '';
  const managed = inputs.managedSwitch ? 'managed' : 'unmanaged';
  const coverageWord = coverageStatus === 'good' ? 'good' : coverageStatus === 'warning' ? 'adequate with some marginal zones' : 'insufficient with dead/weak zones';

  return `Network audit for ${inputs.projectName || 'this project'} using ${infra}${mesh} and a ${managed} switching infrastructure. Internet quality is ${internetStatus === 'good' ? 'healthy' : internetStatus === 'warning' ? 'showing moderate concerns' : 'flagged with critical issues'}. WiFi coverage across ${zoneCount} measured zone${zoneCount !== 1 ? 's' : ''} is ${coverageWord}${avgRssi ? ` (avg RSSI: ${avgRssi} dBm)` : ''}${weakZones > 0 ? `, with ${weakZones} weak zone${weakZones > 1 ? 's' : ''} requiring AP addition or repositioning` : ''}. Wired backbone is ${infraStatus === 'good' ? 'well-structured' : 'in need of improvement'}. Smart home readiness is ${readinessStatus === 'good' ? 'confirmed' : readinessStatus === 'warning' ? 'conditional' : 'not yet achieved'}. ${overallStatus === 'good' ? 'The network is ready for handover.' : 'Remediation is recommended before client sign-off.'}`;
}

function emptyResult(): NetworkAuditResult {
  return {
    hasData: false,
    internetStatus: 'neutral', internetLabel: '—', pingStatus: 'neutral', pingLabel: '—',
    packetLossStatus: 'neutral', packetLossLabel: '—', speedStatus: 'neutral', speedLabel: '—',
    coverageStatus: 'neutral', coverageLabel: '—', avgRssi: null, worstZone: '—', worstRssi: null,
    zoneResults: [], infraStatus: 'neutral', infraLabel: '—',
    readinessStatus: 'neutral', readinessLabel: '—',
    overallStatus: 'neutral', overallLabel: 'Awaiting Input',
    insights: [], recommendations: [],
    summary: 'Enter internet speed data and WiFi zone measurements to generate a network audit report.',
  };
}
