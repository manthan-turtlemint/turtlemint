import {
    Application,
    Financials,
    ScoringResult,
    ScoringRule,
    VendorProfile,
} from "@/types";

export function calculateScore(
    vendor: VendorProfile,
    financials: Financials,
    exposure: any, // using explicit any for now to simplify, ideally strictly typed
    rules: ScoringRule[]
): ScoringResult {
    let baseScore = 100;
    const breakdown: ScoringResult["breakdown"] = [];

    // Evaluate each rule
    rules.forEach((rule) => {
        if (!rule.enabled) return;

        let triggered = false;
        try {
            // safe eval context
            const context = {
                ...vendor,
                ...financials,
                ...exposure,
                industry: vendor.industry, // explicit mapping
                revenue: financials.revenue,
                netWorth: financials.netWorth,
                claimsCount: exposure.claimsCount,
            };

            // Very simple rule engine for MVP:
            // We will parse simple conditions like "revenue > 1000"
            // In a real app, use a proper rule engine library like 'json-rules-engine'

            // We'll use a Function constructor for MVP safe-ish eval of the condition string
            // const check = new Function("ctx", "with(ctx) { return " + rule.condition + " }");
            // triggered = check(context);

            // Actually, for MVP let's implement a super simple parser to avoid eval if possible,
            // or just use manual hardcoded logic for the demo rules if the parser is too complex.
            // Let's safe-eval for flexibility as requested "configurable rule-based".

            const check = new Function(
                "revenue", "netWorth", "claimsCount", "industry",
                `return ${rule.condition}`
            );

            triggered = check(
                financials.revenue,
                financials.netWorth,
                exposure.claimsCount,
                vendor.industry
            );

        } catch (e) {
            console.error(`Error evaluating rule ${rule.id}:`, e);
            triggered = false;
        }

        if (triggered) {
            baseScore += rule.points;
            breakdown.push({
                ruleId: rule.id,
                ruleName: rule.name,
                points: rule.points,
                triggered: true,
            });
        }
    });

    // Clamp score 0-100
    const finalScore = Math.max(0, Math.min(100, baseScore));

    // Determine Rating
    let rating: ScoringResult["rating"] = "D";
    if (finalScore >= 80) rating = "A";
    else if (finalScore >= 60) rating = "B";
    else if (finalScore >= 40) rating = "C";

    // Determine Decision
    let decision: ScoringResult["decision"] = "Decline";
    if (finalScore >= 80) decision = "Approved";
    else if (finalScore >= 60) decision = "Conditional";

    // Recommend Bond Limit
    // capacity = min( 0.2 * revenue, 0.5 * net_worth ) then adjust by rating multiplier
    // Multipliers: A=1.0, B=0.8, C=0.5, D=0.0
    const rawCapacity = Math.min(
        0.2 * financials.revenue,
        0.5 * financials.netWorth
    );

    let ratingMultiplier = 0;
    if (rating === "A") ratingMultiplier = 1.0;
    else if (rating === "B") ratingMultiplier = 0.8;
    else if (rating === "C") ratingMultiplier = 0.5;

    const recommendedLimit = rawCapacity * ratingMultiplier;

    // Collateral %
    let collateralPercent = 100;
    if (rating === "A") collateralPercent = 0;
    else if (rating === "B") collateralPercent = 10;
    else if (rating === "C") collateralPercent = 25;
    else collateralPercent = 50; // D rating usually declined, but if overridden maybe 50%

    return {
        score: finalScore,
        rating,
        decision,
        recommendedLimit,
        collateralPercent,
        breakdown,
    };
}
