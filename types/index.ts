export type UserRole = "admin" | "underwriter" | "risk_manager" | "broker";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
}

export type ApplicationStatus =
    | "draft"
    | "submitted"
    | "under_review"
    | "approved"
    | "conditional"
    | "declined"
    | "finalized";

export type Decision = "Approved" | "Conditional" | "Decline";

export interface VendorProfile {
    legalName: string;
    pan: string;
    gstin: string;
    industry: string;
    address: string;
    contactPerson: string;
    yearsInBusiness: number;
}

export interface Financials {
    revenue: number;
    ebitda: number;
    netWorth: number;
    totalDebt: number;
    cash: number; // Cash & Bank
    workingCapital: number; // Computed or input
    currentRatio?: number; // Computed
    debtEquity?: number; // Computed
}

export interface ScoringResult {
    score: number; // 0-100
    rating: "A" | "B" | "C" | "D";
    decision: Decision;
    recommendedLimit: number;
    collateralPercent: number;
    breakdown: Array<{
        ruleId: string;
        ruleName: string;
        points: number;
        triggered: boolean;
    }>;
}

export interface Application {
    id: string;
    vendor: VendorProfile;
    financials: Financials;
    exposure: {
        existingLoans: number;
        existingBonds: number;
        bondUtilization: number;
        claimsCount: number;
        largestClaim: number;
        projectIssues: boolean;
    };
    detailedFinancials?: DetailedFinancials;
    characterFlags?: CharacterFlags;
    score?: ScoringResult;
    status: ApplicationStatus;
    suggestedDecision?: Decision;
    finalDecision?: Decision;
    finalLimit?: number;
    finalCollateral?: number;
    scoringResultV2?: DetailedScoringResult;
    overrides?: Override[];
    createdAt: string;
    updatedAt: string;
}

export interface ScoringRule {
    id: string;
    name: string;
    condition: string; // Simplistic string representation for MVP
    points: number;
    category: "Financial" | "Behavioral" | "Compliance" | "Industry";
    enabled: boolean;
}

// --- SOEASY V2 Types ---

export interface CharacterFlags {
    auditedReportAvailable: boolean;
    yearsOfExperience: number;
    tdpCompanyIdentityAvailable: boolean;
    experienceSimilarProjectsAvailable: boolean;
}

export interface EbitdaComponents {
    netIncome: number;
    interest: number;
    taxes: number;
    depreciation: number;
    amortization: number;
}

export interface DetailedFinancialYear {
    year: number;
    turnover: number;
    grossProfit: number;
    profitBeforeTax: number;
    currentAssets: number;
    cashBankReceivablesSecurities: number;
    totalAssets: number;
    currentLiabilities: number;
    totalLiabilities: number;
    ownFundsEquity: number;
    totalDebt: number;
    ebitdaComponents: EbitdaComponents;
}

export interface DetailedFinancials {
    yearX: DetailedFinancialYear; // Latest
    yearY: DetailedFinancialYear; // Previous
}

export interface RatioSet {
    x: number;
    y: number;
    avg: number;
}

export interface DerivedMetrics {
    liquidity: {
        currentRatio: RatioSet;
        quickRatio: RatioSet;
        netWCToSales: RatioSet;
    };
    profitability: {
        grossMargin: RatioSet;
        profitMargin: RatioSet;
        roe: RatioSet;
        roi: RatioSet;
    };
}

export interface ComponentResult {
    name: string;
    value: number | boolean;
    points: number;
    weightedScore: number;
    maxPoints: number;
}

export interface SubScoreResult {
    score: number;
    maxScore: number;
    components: ComponentResult[];
    flagged: boolean;
}

export interface DetailedScoringResult {
    totalScore: number;
    decision: "Acceptance" | "Reject";
    loadingPct: number | null;
    subScores: {
        character: SubScoreResult;
        liquidity: SubScoreResult;
        profitability: SubScoreResult;
    };
    metrics: DerivedMetrics;
    configVersion: string;
}

export interface ScoringThreshold {
    operator: '>' | '>=' | '<' | '<=' | '=';
    value: number;
    points: number;
}

export interface ComponentConfig {
    weight: number;
    overallPortion: number;
    thresholds?: ScoringThreshold[];
    boolPoints?: { true: number; false: number };
}

export type SubScoreConfig = {
    portion: number;
    components: Record<string, ComponentConfig>;
};

export interface ScoringConfig {
    character: SubScoreConfig;
    liquidity: SubScoreConfig;
    profitability: SubScoreConfig;
    decision: {
        hardRejectScore: number;
        bands: Array<{ min: number; max: number; decision: "Acceptance" | "Reject"; loading: number | null }>;
    };
}

export interface Override {
    id: string;
    type: 'metric' | 'component_point' | 'final_decision';
    target: string;
    value: unknown;
    reason: string;
    actor: string;
    timestamp: string;
}
