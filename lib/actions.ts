"use server";

import { prisma } from "@/lib/prisma";
import { Application, ScoringRule, ScoringConfig, ApplicationStatus, Decision } from "@/types";
import { revalidatePath } from "next/cache";

async function getUserId() {
    const userId = "demo-user";
    // Ensure the demo user exists in the DB so relations don't break
    await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            name: "Public Demo User",
            email: "demo@bonddesk.com",
            role: "admin",
            isApproved: true,
        },
    });
    return userId;
}

// Applications
export async function getApplications() {
    const userId = await getUserId();
    const apps = await prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    // Map DB model back to Application type (reverse flattening)
    return apps.map(app => ({
        ...app,
        vendor: {
            legalName: app.legalName,
            pan: app.pan,
            gstin: app.gstin,
            industry: app.industry,
            address: app.address,
            contactPerson: app.contactPerson,
            yearsInBusiness: app.yearsInBusiness,
        },
        financials: {
            revenue: app.revenue,
            ebitda: app.ebitda,
            netWorth: app.netWorth,
            totalDebt: app.totalDebt,
            cash: app.cash,
            workingCapital: app.workingCapital,
        },
        exposure: {
            existingLoans: app.existingLoans,
            existingBonds: app.existingBonds,
            bondUtilization: app.bondUtilization,
            claimsCount: app.claimsCount,
            largestClaim: app.largestClaim,
            projectIssues: app.projectIssues,
        },
        detailedFinancials: app.detailedFinancials ? JSON.parse(app.detailedFinancials) : undefined,
        characterFlags: app.characterFlags ? JSON.parse(app.characterFlags) : undefined,
        score: app.score ? {
            score: app.score,
            rating: app.rating as any,
            decision: app.decision as any,
            recommendedLimit: app.recommendedLimit || 0,
            collateralPercent: app.collateralPercent || 0,
            breakdown: app.breakdown ? JSON.parse(app.breakdown) : [],
        } : undefined,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
    })) as Application[];
}

export async function createApplication(app: Application) {
    const userId = await getUserId();
    const result = await prisma.application.create({
        data: {
            userId,
            legalName: app.vendor.legalName,
            pan: app.vendor.pan,
            gstin: app.vendor.gstin,
            industry: app.vendor.industry,
            address: app.vendor.address,
            contactPerson: app.vendor.contactPerson,
            yearsInBusiness: app.vendor.yearsInBusiness,
            revenue: app.financials.revenue,
            ebitda: app.financials.ebitda,
            netWorth: app.financials.netWorth,
            totalDebt: app.financials.totalDebt,
            cash: app.financials.cash,
            workingCapital: app.financials.workingCapital,
            existingLoans: app.exposure.existingLoans,
            existingBonds: app.exposure.existingBonds,
            bondUtilization: app.exposure.bondUtilization,
            claimsCount: app.exposure.claimsCount,
            largestClaim: app.exposure.largestClaim,
            projectIssues: app.exposure.projectIssues,
            detailedFinancials: app.detailedFinancials ? JSON.stringify(app.detailedFinancials) : null,
            characterFlags: app.characterFlags ? JSON.stringify(app.characterFlags) : null,
            status: app.status,
            score: app.score?.score,
            rating: app.score?.rating,
            decision: app.score?.decision,
            recommendedLimit: app.score?.recommendedLimit,
            collateralPercent: app.score?.collateralPercent,
            breakdown: app.score?.breakdown ? JSON.stringify(app.score.breakdown) : null,
        },
    });
    revalidatePath("/");
    return result;
}

export async function updateAppStatus(id: string, status: ApplicationStatus) {
    const userId = await getUserId();
    await prisma.application.update({
        where: { id, userId },
        data: { status },
    });
    revalidatePath("/");
}

export async function finalizeApp(id: string, decision: Decision, limit: number, collateral: number) {
    const userId = await getUserId();
    await prisma.application.update({
        where: { id, userId },
        data: {
            status: "finalized",
            finalDecision: decision,
            finalLimit: limit,
            finalCollateral: collateral,
        },
    });
    revalidatePath("/");
}

// Rules
export async function getRules() {
    const userId = await getUserId();
    return await prisma.scoringRule.findMany({
        where: { userId },
    }) as any as ScoringRule[];
}

export async function toggleScoringRule(id: string) {
    const userId = await getUserId();
    const rule = await prisma.scoringRule.findUnique({ where: { id, userId } });
    if (!rule) return;
    await prisma.scoringRule.update({
        where: { id, userId },
        data: { enabled: !rule.enabled },
    });
    revalidatePath("/admin");
}

// Config
export async function getScoringConfig() {
    const userId = await getUserId();
    const config = await prisma.scoringConfig.findUnique({
        where: { userId },
    });
    return config ? JSON.parse(config.content) : null;
}

export async function updateConfig(config: ScoringConfig) {
    const userId = await getUserId();
    await prisma.scoringConfig.upsert({
        where: { userId },
        create: { userId, content: JSON.stringify(config) },
        update: { content: JSON.stringify(config) },
    });
    revalidatePath("/admin");
}
