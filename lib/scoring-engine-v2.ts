import {
    ApplicationV2,
    DetailedFinancials,
    DetailedScoringResult,
    DerivedMetrics,
    CharacterFlags,
    ScoringConfig,
    ComponentResult,
    SubScoreResult,
    RatioSet
} from "@/types";

// --- Score Calculation Logic ---

export function calculateDerivedMetrics(financials: DetailedFinancials): DerivedMetrics {
    const { yearX, yearY } = financials;

    const calculateRatioSet = (valX: number, valY: number): RatioSet => {
        return {
            x: valX,
            y: valY,
            avg: (valX + valY) / 2
        };
    };

    const safeDiv = (num: number, den: number): number => den === 0 ? 0 : num / den;

    const netWCX = yearX.currentAssets - yearX.currentLiabilities;
    const netWCY = yearY.currentAssets - yearY.currentLiabilities;

    const liquidity = {
        currentRatio: calculateRatioSet(
            safeDiv(yearX.currentAssets, yearX.currentLiabilities),
            safeDiv(yearY.currentAssets, yearY.currentLiabilities)
        ),
        quickRatio: calculateRatioSet(
            safeDiv(yearX.cashBankReceivablesSecurities, yearX.currentLiabilities),
            safeDiv(yearY.cashBankReceivablesSecurities, yearY.currentLiabilities)
        ),
        netWCToSales: calculateRatioSet(
            safeDiv(netWCX, yearX.turnover),
            safeDiv(netWCY, yearY.turnover)
        )
    };

    const profitability = {
        grossMargin: calculateRatioSet(
            safeDiv(yearX.grossProfit, yearX.turnover),
            safeDiv(yearY.grossProfit, yearY.turnover)
        ),
        profitMargin: calculateRatioSet(
            safeDiv(yearX.profitBeforeTax, yearX.turnover) * 100,
            safeDiv(yearY.profitBeforeTax, yearY.turnover) * 100
        ),
        roe: calculateRatioSet(
            safeDiv(yearX.profitBeforeTax, yearX.ownFundsEquity) * 100,
            safeDiv(yearY.profitBeforeTax, yearY.ownFundsEquity) * 100
        ),
        roi: calculateRatioSet(
            safeDiv(yearX.profitBeforeTax, yearX.totalAssets) * 100,
            safeDiv(yearY.profitBeforeTax, yearY.totalAssets) * 100
        )
    };

    return { liquidity, profitability };
}

// --- Component Scoring ---

const evaluateThreshold = (value: number, thresholds: ScoringConfig['liquidity']['components']['currentRatio']['thresholds']) => {
    if (!thresholds) return 0;
    for (const t of thresholds) {
        if (t.operator === '>' && value > t.value) return t.points;
        if (t.operator === '>=' && value >= t.value) return t.points;
        if (t.operator === '<' && value < t.value) return t.points;
        if (t.operator === '<=' && value <= t.value) return t.points;
        if (t.operator === '=' && Math.abs(value - t.value) < 0.001) return t.points;
    }
    return 6;
};

export const DEFAULT_CONFIG: ScoringConfig = {
    character: {
        portion: 0.20,
        components: {
            auditedReport: { weight: 0.30, overallPortion: 0.20, boolPoints: { true: 10, false: 6 } },
            durationOperation: { weight: 0.25, overallPortion: 0.20, thresholds: [{ operator: '>', value: 3, points: 10 }, { operator: '<=', value: 3, points: 6 }] },
            tdpIdentity: { weight: 0.20, overallPortion: 0.20, boolPoints: { true: 10, false: 6 } },
            similarProjects: { weight: 0.25, overallPortion: 0.20, boolPoints: { true: 10, false: 6 } }
        }
    },
    liquidity: {
        portion: 0.32,
        components: {
            currentRatio: { weight: 0.40, overallPortion: 0.32, thresholds: [{ operator: '>', value: 1, points: 10 }, { operator: '=', value: 1, points: 8 }, { operator: '<', value: 1, points: 6 }] },
            quickRatio: { weight: 0.30, overallPortion: 0.32, thresholds: [{ operator: '>', value: 0.5, points: 10 }, { operator: '=', value: 0.5, points: 8 }, { operator: '<', value: 0.5, points: 6 }] },
            netWCToSales: { weight: 0.30, overallPortion: 0.32, thresholds: [{ operator: '>', value: 0.25, points: 10 }, { operator: '=', value: 0.25, points: 8 }, { operator: '<', value: 0.25, points: 6 }] }
        }
    },
    profitability: {
        portion: 0.48,
        components: {
            grossMargin: { weight: 0.30, overallPortion: 0.48, thresholds: [{ operator: '>', value: 10, points: 10 }, { operator: '=', value: 8, points: 8 }, { operator: '<', value: 6, points: 6 }] },
            profitMargin: { weight: 0.25, overallPortion: 0.48, thresholds: [{ operator: '>', value: 7.5, points: 10 }, { operator: '=', value: 7.5, points: 8 }, { operator: '<', value: 7.5, points: 6 }] },
            roe: { weight: 0.25, overallPortion: 0.48, thresholds: [{ operator: '>', value: 7.5, points: 10 }, { operator: '=', value: 7.5, points: 8 }, { operator: '<', value: 7.5, points: 6 }] },
            roi: { weight: 0.20, overallPortion: 0.48, thresholds: [{ operator: '>', value: 7.5, points: 10 }, { operator: '=', value: 7.5, points: 8 }, { operator: '<', value: 7.5, points: 6 }] }
        }
    },
    decision: {
        hardRejectScore: 2,
        bands: [
            { min: 0, max: 7.49, decision: "Reject", loading: null },
            { min: 7.5, max: 7.59, decision: "Acceptance", loading: 50 },
            { min: 7.6, max: 8.0, decision: "Acceptance", loading: 25 }, // Corrected based on standard banding interpretation
            { min: 8.01, max: 100, decision: "Acceptance", loading: 0 }
        ]
    }
};

export function calculateCharacterScore(flags: CharacterFlags, config: ScoringConfig['character']): SubScoreResult {
    const components: ComponentResult[] = [];

    components.push({
        name: "Audited Report",
        value: flags.auditedReportAvailable,
        points: flags.auditedReportAvailable ? 10 : 6,
        weightedScore: config.portion * config.components.auditedReport.weight * (flags.auditedReportAvailable ? 10 : 6),
        maxPoints: 10
    });

    components.push({
        name: "Duration of Operation",
        value: flags.yearsOfExperience,
        points: flags.yearsOfExperience > 3 ? 10 : 6,
        weightedScore: config.portion * config.components.durationOperation.weight * (flags.yearsOfExperience > 3 ? 10 : 6),
        maxPoints: 10
    });

    components.push({
        name: "TDP Company Identity",
        value: flags.tdpCompanyIdentityAvailable,
        points: flags.tdpCompanyIdentityAvailable ? 10 : 6,
        weightedScore: config.portion * config.components.tdpIdentity.weight * (flags.tdpCompanyIdentityAvailable ? 10 : 6),
        maxPoints: 10
    });

    components.push({
        name: "Experience Similar Projects",
        value: flags.experienceSimilarProjectsAvailable,
        points: flags.experienceSimilarProjectsAvailable ? 10 : 6,
        weightedScore: config.portion * config.components.similarProjects.weight * (flags.experienceSimilarProjectsAvailable ? 10 : 6),
        maxPoints: 10
    });

    const score = components.reduce((sum, c) => sum + c.weightedScore, 0);
    return { score, maxScore: 2, components, flagged: score < 2 };
}

export function calculateLiquidityScore(metrics: DerivedMetrics['liquidity'], config: ScoringConfig['liquidity']): SubScoreResult {
    const components: ComponentResult[] = [];
    const { currentRatio, quickRatio, netWCToSales } = config.components;

    const crPoints = evaluateThreshold(metrics.currentRatio.avg, currentRatio.thresholds);
    components.push({
        name: "Current Ratio",
        value: metrics.currentRatio.avg,
        points: crPoints,
        weightedScore: config.portion * currentRatio.weight * crPoints,
        maxPoints: 10
    });

    const qrPoints = evaluateThreshold(metrics.quickRatio.avg, quickRatio.thresholds);
    components.push({
        name: "Quick Ratio",
        value: metrics.quickRatio.avg,
        points: qrPoints,
        weightedScore: config.portion * quickRatio.weight * qrPoints,
        maxPoints: 10
    });

    const wcPoints = evaluateThreshold(metrics.netWCToSales.avg, netWCToSales.thresholds);
    components.push({
        name: "Net WC to Sales",
        value: metrics.netWCToSales.avg,
        points: wcPoints,
        weightedScore: config.portion * netWCToSales.weight * wcPoints,
        maxPoints: 10
    });

    const score = components.reduce((sum, c) => sum + c.weightedScore, 0);
    return { score, maxScore: 3.2, components, flagged: score < 2 };
}

export function calculateProfitabilityScore(metrics: DerivedMetrics['profitability'], config: ScoringConfig['profitability']): SubScoreResult {
    const components: ComponentResult[] = [];
    const { grossMargin, profitMargin, roe, roi } = config.components;

    const gmValue = metrics.grossMargin.avg * 100;
    const gmPoints = evaluateThreshold(gmValue, grossMargin.thresholds);
    components.push({
        name: "Gross Margin",
        value: gmValue,
        points: gmPoints,
        weightedScore: config.portion * grossMargin.weight * gmPoints,
        maxPoints: 10
    });

    const pmPoints = evaluateThreshold(metrics.profitMargin.avg, profitMargin.thresholds);
    components.push({
        name: "Profit Margin",
        value: metrics.profitMargin.avg,
        points: pmPoints,
        weightedScore: config.portion * profitMargin.weight * pmPoints,
        maxPoints: 10
    });

    const roePoints = evaluateThreshold(metrics.roe.avg, roe.thresholds);
    components.push({
        name: "ROE",
        value: metrics.roe.avg,
        points: roePoints,
        weightedScore: config.portion * roe.weight * roePoints,
        maxPoints: 10
    });

    const roiPoints = evaluateThreshold(metrics.roi.avg, roi.thresholds);
    components.push({
        name: "ROI",
        value: metrics.roi.avg,
        points: roiPoints,
        weightedScore: config.portion * roi.weight * roiPoints,
        maxPoints: 10
    });

    const score = components.reduce((sum, c) => sum + c.weightedScore, 0);
    return { score, maxScore: 4.8, components, flagged: score < 2 };
}

export function calculateScoreFromMetrics(
    metrics: DerivedMetrics,
    flags: CharacterFlags,
    config: ScoringConfig
): DetailedScoringResult {

    // 2. Component Scores
    const characterScore = calculateCharacterScore(flags, config.character);
    const liquidityScore = calculateLiquidityScore(metrics.liquidity, config.liquidity);
    const profitabilityScore = calculateProfitabilityScore(metrics.profitability, config.profitability);

    // 3. Total Score
    const totalScore = characterScore.score + liquidityScore.score + profitabilityScore.score;

    // 4. Decision
    let decision: "Acceptance" | "Reject" = "Reject";
    let loadingPct: number | null = null;

    if (characterScore.flagged || liquidityScore.flagged || profitabilityScore.flagged) {
        decision = "Reject";
        loadingPct = null;
    } else {
        decision = "Reject";
        for (const band of config.decision.bands) {
            if (totalScore >= band.min && totalScore <= band.max) {
                decision = band.decision;
                loadingPct = band.loading;
                break;
            }
        }
    }

    return {
        totalScore: Number(totalScore.toFixed(2)),
        decision,
        loadingPct,
        subScores: {
            character: characterScore,
            liquidity: liquidityScore,
            profitability: profitabilityScore
        },
        metrics,
        configVersion: "v1.0"
    };
}

export function calculateScoreV2(
    financials: DetailedFinancials,
    flags: CharacterFlags,
    config: ScoringConfig = DEFAULT_CONFIG
): DetailedScoringResult {
    const metrics = calculateDerivedMetrics(financials);
    return calculateScoreFromMetrics(metrics, flags, config);
}
