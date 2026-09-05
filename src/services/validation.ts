import type { IndexPoint } from '@/types/airfare.ts';
import { getIndexSeries } from '@/services/dataStore.ts';

export interface BasePeriodCheckResult {
  passed: boolean;
  actualBaseValue: number;
  expectedBaseValue: number;
  baseDate: string;
  label: string;
}

export interface PeriodJumpCheckResult {
  passed: boolean;
  maxJumpPct: number;
  thresholdPct: number;
  maxJumpDate: string;
  prevValue: number;
  currValue: number;
  minPeriodChangePct: number;
  maxPeriodChangePct: number;
  label: string;
}

export interface DateContinuityCheckResult {
  passed: boolean;
  totalPeriodsPresent: number;
  expectedPeriods: number;
  startDate: string;
  endDate: string;
  gaps: Array<{ fromDate: string; toDate: string; missingDays: number }>;
  label: string;
}

export interface MethodologyValidationReport {
  baseCheck: BasePeriodCheckResult;
  jumpCheck: PeriodJumpCheckResult;
  continuityCheck: DateContinuityCheckResult;
  allPassed: boolean;
  cumulativeChangePct: number;
  periodRangeLabel: string;
}

let cachedValidationReport: MethodologyValidationReport | null = null;

/**
 * 1. Base Period Check: Verify base period index = exactly 100.00
 */
export function validateBasePeriod(series: IndexPoint[]): BasePeriodCheckResult {
  if (series.length === 0) {
    return {
      passed: false,
      actualBaseValue: 0,
      expectedBaseValue: 100.0,
      baseDate: '',
      label: 'FAIL: Series is empty',
    };
  }

  const basePoint = series[0];
  const passed = Math.abs(basePoint.indexValue - 100.0) < 0.0001;

  return {
    passed,
    actualBaseValue: basePoint.indexValue,
    expectedBaseValue: 100.0,
    baseDate: basePoint.date,
    label: passed
      ? `base=${basePoint.indexValue.toFixed(2)} (PASS)`
      : `base=${basePoint.indexValue.toFixed(2)} (FAIL, expected 100.00)`,
  };
}

/**
 * 2. Sanity Threshold Check: No period-over-period index change exceeds threshold (25%)
 */
export function validatePeriodJumps(
  series: IndexPoint[],
  thresholdPct = 25
): PeriodJumpCheckResult {
  let maxJumpPct = 0;
  let maxJumpDate = '';
  let prevValAtMax = 0;
  let currValAtMax = 0;
  let minPeriodChangePct = 0;
  let maxPeriodChangePct = 0;

  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].indexValue;
    const curr = series[i].indexValue;
    const signedChangePct = ((curr - prev) / prev) * 100;
    const absChangePct = Math.abs(signedChangePct);

    if (i === 1) {
      minPeriodChangePct = signedChangePct;
      maxPeriodChangePct = signedChangePct;
    } else {
      if (signedChangePct < minPeriodChangePct) minPeriodChangePct = signedChangePct;
      if (signedChangePct > maxPeriodChangePct) maxPeriodChangePct = signedChangePct;
    }

    if (absChangePct > maxJumpPct) {
      maxJumpPct = absChangePct;
      maxJumpDate = series[i].date;
      prevValAtMax = prev;
      currValAtMax = curr;
    }
  }

  const passed = maxJumpPct <= thresholdPct;

  return {
    passed,
    maxJumpPct: Math.round(maxJumpPct * 100) / 100,
    thresholdPct,
    maxJumpDate,
    prevValue: prevValAtMax,
    currValue: currValAtMax,
    minPeriodChangePct: Math.round(minPeriodChangePct * 100) / 100,
    maxPeriodChangePct: Math.round(maxPeriodChangePct * 100) / 100,
    label: passed
      ? `max period jump=${maxJumpPct.toFixed(2)}% (PASS, threshold ${thresholdPct}%)`
      : `max period jump=${maxJumpPct.toFixed(2)}% (REQUIRES REVIEW, exceeded ${thresholdPct}%)`,
  };
}

/**
 * 3. Date Continuity Check: Verify index series has no gaps (30 consecutive periods)
 */
export function validateDateContinuity(series: IndexPoint[]): DateContinuityCheckResult {
  const totalPeriodsPresent = series.length;
  const expectedPeriods = 30;
  const gaps: Array<{ fromDate: string; toDate: string; missingDays: number }> = [];

  for (let i = 1; i < series.length; i++) {
    const prevTime = Date.parse(`${series[i - 1].date}T00:00:00Z`);
    const currTime = Date.parse(`${series[i].date}T00:00:00Z`);
    const diffDays = Math.round((currTime - prevTime) / 86400000);

    if (diffDays !== 1) {
      gaps.push({
        fromDate: series[i - 1].date,
        toDate: series[i].date,
        missingDays: diffDays - 1,
      });
    }
  }

  const passed = gaps.length === 0 && totalPeriodsPresent === expectedPeriods;

  return {
    passed,
    totalPeriodsPresent,
    expectedPeriods,
    startDate: series.length > 0 ? series[0].date : '',
    endDate: series.length > 0 ? series[series.length - 1].date : '',
    gaps,
    label: passed
      ? `${totalPeriodsPresent}/${expectedPeriods} periods present (PASS)`
      : `${totalPeriodsPresent}/${expectedPeriods} periods (FAIL: ${gaps.length} gaps detected)`,
  };
}

/**
 * Runs all three internal consistency checks on the canonical index series.
 * Results are logged to console once per session and cached.
 */
export function runMethodologyValidation(
  inputSeries?: IndexPoint[]
): MethodologyValidationReport {
  if (cachedValidationReport && !inputSeries) {
    return cachedValidationReport;
  }

  const series = inputSeries ?? getIndexSeries();
  const baseCheck = validateBasePeriod(series);
  const jumpCheck = validatePeriodJumps(series, 25);
  const continuityCheck = validateDateContinuity(series);

  const allPassed = baseCheck.passed && jumpCheck.passed && continuityCheck.passed;
  const latestValue = series.length > 0 ? series[series.length - 1].indexValue : 100;
  const cumulativeChangePct = Math.round(((latestValue - 100) / 100) * 10000) / 100;

  const minSign = jumpCheck.minPeriodChangePct >= 0 ? '+' : '';
  const maxSign = jumpCheck.maxPeriodChangePct >= 0 ? '+' : '';
  const periodRangeLabel = `${minSign}${jumpCheck.minPeriodChangePct.toFixed(2)}% to ${maxSign}${jumpCheck.maxPeriodChangePct.toFixed(2)}%`;

  // Required console logging format:
  // "[AeroStat] Validation: base=100.00 (PASS), max period jump=X.XX% (PASS, threshold 25%), 30/30 periods present (PASS)"
  console.log(
    `[AeroStat] Validation: ${baseCheck.label}, ${jumpCheck.label}, ${continuityCheck.label}`
  );

  const report: MethodologyValidationReport = {
    baseCheck,
    jumpCheck,
    continuityCheck,
    allPassed,
    cumulativeChangePct,
    periodRangeLabel,
  };

  if (!inputSeries) {
    cachedValidationReport = report;
  }

  return report;
}
