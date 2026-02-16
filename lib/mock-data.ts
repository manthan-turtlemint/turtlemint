import { Application, ScoringRule, User } from "@/types";

export const MOCK_USERS: User[] = [
    {
        id: "u1",
        name: "Alice Admin",
        email: "alice@surety.com",
        role: "admin",
    },
    {
        id: "u2",
        name: "Bob Underwriter",
        email: "bob@surety.com",
        role: "underwriter",
    },
    {
        id: "u3",
        name: "Charlie Risk",
        email: "charlie@surety.com",
        role: "risk_manager",
    },
];

export const MOCK_RULES: ScoringRule[] = [
    {
        id: "r1",
        name: "High Revenue Stability",
        condition: "revenue > 10000000",
        points: 10,
        category: "Financial",
        enabled: true,
    },
    {
        id: "r2",
        name: "Positive Net Worth",
        condition: "netWorth > 0",
        points: 20,
        category: "Financial",
        enabled: true,
    },
    {
        id: "r3",
        name: "History of Claims",
        condition: "claimsCount > 0",
        points: -30,
        category: "Behavioral",
        enabled: true,
    },
    {
        id: "r4",
        name: "Infrastructure Industry Bonus",
        condition: "industry == 'Infrastructure'",
        points: 5,
        category: "Industry",
        enabled: true,
    },
];

export const MOCK_APPLICATIONS: Application[] = [
    {
        id: "app-101",
        vendor: {
            legalName: "Acme Infra Ltd",
            pan: "ABCDE1234F",
            gstin: "27ABCDE1234F1Z5",
            industry: "Infrastructure",
            address: "123 Industrial Estate, Mumbai",
            contactPerson: "Rajesh Kumar",
            yearsInBusiness: 12,
        },
        financials: {
            revenue: 50000000,
            ebitda: 8000000,
            netWorth: 20000000,
            totalDebt: 10000000,
            cash: 5000000,
            workingCapital: 8000000,
        },
        exposure: {
            existingLoans: 5000000,
            existingBonds: 2000000,
            bondUtilization: 0.4,
            claimsCount: 0,
            largestClaim: 0,
            projectIssues: false,
        },
        // SOEASY v2 Data
        detailedFinancials: {
            yearX: {
                year: 2023,
                turnover: 50000000,
                grossProfit: 15000000, // 30% margin
                profitBeforeTax: 5000000, // 10% margin
                currentAssets: 25000000,
                cashBankReceivablesSecurities: 10000000,
                totalAssets: 40000000,
                currentLiabilities: 15000000,
                totalLiabilities: 20000000,
                ownFundsEquity: 20000000,
                totalDebt: 10000000,
                ebitdaComponents: {
                    netIncome: 4000000,
                    interest: 1000000,
                    taxes: 1000000, // PBT = 4m+1m? No PBT=5m. Net=4m.
                    depreciation: 1500000,
                    amortization: 500000,
                }
            },
            yearY: {
                year: 2022,
                turnover: 45000000,
                grossProfit: 13500000,
                profitBeforeTax: 4500000,
                currentAssets: 22000000,
                cashBankReceivablesSecurities: 9000000,
                totalAssets: 38000000,
                currentLiabilities: 14000000,
                totalLiabilities: 19000000,
                ownFundsEquity: 19000000,
                totalDebt: 9000000,
                ebitdaComponents: {
                    netIncome: 3500000,
                    interest: 1000000,
                    taxes: 1000000,
                    depreciation: 1500000,
                    amortization: 500000,
                }
            }
        },
        characterFlags: {
            auditedReportAvailable: true,
            tdpCompanyIdentityAvailable: true,
            experienceSimilarProjectsAvailable: true,
            yearsOfExperience: 12,
        },
        status: "submitted",
        score: {
            score: 85,
            rating: "A",
            decision: "Approved",
            recommendedLimit: 10000000,
            collateralPercent: 10,
            breakdown: [
                {
                    ruleId: "r1",
                    ruleName: "High Revenue Stability",
                    points: 10,
                    triggered: true,
                },
                {
                    ruleId: "r2",
                    ruleName: "Positive Net Worth",
                    points: 20,
                    triggered: true,
                },
                {
                    ruleId: "r4",
                    ruleName: "Infrastructure Industry Bonus",
                    points: 5,
                    triggered: true,
                },
            ],
        },
        suggestedDecision: "Approved",
        createdAt: "2023-10-25T10:00:00Z",
        updatedAt: "2023-10-25T10:05:00Z",
    },
    {
        id: "app-102",
        vendor: {
            legalName: "StartUp Tech Pvt Ltd",
            pan: "FGHIJ5678K",
            gstin: "27FGHIJ5678K1Z5",
            industry: "Technology",
            address: "456 Tech Park, Bangalore",
            contactPerson: "Sarah Lee",
            yearsInBusiness: 2,
        },
        financials: {
            revenue: 5000000,
            ebitda: -100000,
            netWorth: 500000,
            totalDebt: 2000000,
            cash: 100000,
            workingCapital: -500000,
        },
        exposure: {
            existingLoans: 1000000,
            existingBonds: 0,
            bondUtilization: 0,
            claimsCount: 0,
            largestClaim: 0,
            projectIssues: false,
        },
        status: "submitted",
        score: {
            score: 45,
            rating: "C",
            decision: "Decline",
            recommendedLimit: 0,
            collateralPercent: 100,
            breakdown: [
                {
                    ruleId: "r2",
                    ruleName: "Positive Net Worth",
                    points: 20,
                    triggered: true,
                },
            ],
        },
        suggestedDecision: "Decline",
        createdAt: "2023-10-26T14:30:00Z",
        updatedAt: "2023-10-26T14:35:00Z",
    },
];
