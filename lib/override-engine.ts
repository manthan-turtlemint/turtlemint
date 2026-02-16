import {
    DetailedScoringResult,
    DetailedFinancials,
    CharacterFlags,
    ScoringConfig,
    Override,
    DetailedScoringResult as Result // Alias
} from "@/types";
import { calculateScoreFromMetrics, calculateDerivedMetrics, DEFAULT_CONFIG } from "./scoring-engine-v2";

// Helper to set value by path string (e.g. "liquidity.currentRatio.avg")
function set(obj: any, path: string, value: any) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
}

export function calculateScoreWithOverrides(
    financials: DetailedFinancials,
    flags: CharacterFlags,
    config: ScoringConfig = DEFAULT_CONFIG,
    overrides: Override[] = []
): DetailedScoringResult {

    // 1. Calculate Base Metrics
    let metrics = calculateDerivedMetrics(financials);

    // 2. Apply Metric Overrides
    const metricOverrides = overrides.filter(o => o.type === 'metric');
    if (metricOverrides.length > 0) {
        // Clone metrics to avoid mutation of base calculation if needed elsewhere
        metrics = JSON.parse(JSON.stringify(metrics));
        metricOverrides.forEach(o => {
            // Target example: "liquidity.currentRatio.avg" or "profitability.grossMargin.x"
            // We blindly set the value at the path. Validation should happen at input.
            set(metrics, o.target, Number(o.value));
        });
    }

    // 3. Calculate Scores based on (potentially overridden) Metrics
    let result = calculateScoreFromMetrics(metrics, flags, config);

    // 4. Apply Component Point Overrides
    // Target example: "liquidity.currentRatio" -> Set points to 10
    const pointOverrides = overrides.filter(o => o.type === 'component_point');
    if (pointOverrides.length > 0) {
        // We need to re-calculate totals after modifying components
        // Clone result? It's fresh from calc.

        pointOverrides.forEach(o => {
            const [subScoreName, componentName] = o.target.split('.');
            // Map target component name to internal component name if needed?
            // Assuming target matches the keys in config or similar. 
            // In scoring engine, component names are "Current Ratio", "Gross Margin".
            // Let's assume the Override Target uses the convenient keys like "currentRatio" 
            // and we map them to the Display Names found in the result.

            const subScore = result.subScores[subScoreName as keyof typeof result.subScores];
            if (subScore) {
                // Find component by fuzzy match or strict map?
                // The result components have names like "Current Ratio". 
                // The target might be "currentRatio".
                // Let's implement a map or search.
                const targetName = componentName;
                // Simple normalizer: remove spaces, lowercase.
                const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

                const component = subScore.components.find(c => normalize(c.name) === normalize(targetName));

                if (component) {
                    const newPoints = Number(o.value);
                    const oldPoints = component.points;
                    component.points = newPoints;

                    // Recalculate Weighted Score
                    // We need the weight. It's not on the component result.
                    // But we know: weightedScore = portion * weight * points.
                    // So: weightedScore_new = weightedScore_old * (newPoints / oldPoints).
                    // Handle oldPoints == 0 edge case. 
                    // If oldPoints == 0, we can't infer weight factor easily from result alone.
                    // So we should probably look up the config.

                    const subConfig = config[subScoreName as keyof ScoringConfig];
                    // @ts-ignore
                    const compConfig = subConfig?.components[componentName]; // matches key in config? "currentRatio"

                    if (compConfig) {
                        // @ts-ignore
                        component.weightedScore = subConfig.portion * compConfig.weight * newPoints;
                    } else if (oldPoints !== 0) {
                        component.weightedScore = component.weightedScore * (newPoints / oldPoints);
                    }
                }
            }
        });

        // Recalculate SubScore Totals
        Object.values(result.subScores).forEach(sub => {
            sub.score = sub.components.reduce((sum, c) => sum + c.weightedScore, 0);
            // Re-eval hard reject flag? "If any sub-score < 2".
            // sub.flagged = sub.score < 2; // Logic in scoring engine. Re-apply here.
            // Wait, is it score or components?
            // Scoring Engine: "flagged: score < 2".
            sub.flagged = sub.score < 2;
        });

        // Recalculate Total Score
        result.totalScore = Number((
            result.subScores.character.score +
            result.subScores.liquidity.score +
            result.subScores.profitability.score
        ).toFixed(2));

        // Re-evaluate Decision based on new Total Score (unless decision override exists later)
        // Copy logic from scoring engine... or just separate decision logic.
        // For DRY, let's copy the Band logic here or export a `evaluateDecision` function.
        // I'll replicate it simply here as it's short.

        let decision: "Acceptance" | "Reject" = "Reject";
        let loadingPct: number | null = null;
        const { character, liquidity, profitability } = result.subScores;

        if (character.flagged || liquidity.flagged || profitability.flagged) {
            decision = "Reject";
            loadingPct = null;
        } else {
            decision = "Reject"; // default
            for (const band of config.decision.bands) {
                if (result.totalScore >= band.min && result.totalScore <= band.max) {
                    decision = band.decision;
                    loadingPct = band.loading;
                    break;
                }
            }
        }
        result.decision = decision;
        result.loadingPct = loadingPct;
    }

    // 5. Apply Final Decision Overrides
    const decisionOverride = overrides.find(o => o.type === 'final_decision');
    if (decisionOverride) {
        const val = decisionOverride.value as { decision: "Acceptance" | "Reject"; loadingPct?: number | null };
        result.decision = val.decision;
        if (val.loadingPct !== undefined) {
            result.loadingPct = val.loadingPct;
        }
    }

    return result;
}
