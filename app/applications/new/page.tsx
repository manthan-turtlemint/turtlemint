"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Application, Financials, VendorProfile, DetailedFinancials, CharacterFlags } from "@/types";
import { calculateScoreV2 } from "@/lib/scoring-engine-v2";
import { CheckCircle2, Circle, ChevronRight, ChevronLeft } from "lucide-react";
import { FinancialsV2Form } from "@/components/modules/new-application/financials-v2-form";

// Initial State Helpers
const initialFinancialYear = (year: number) => ({
    year,
    turnover: 0,
    grossProfit: 0,
    profitBeforeTax: 0,
    currentAssets: 0,
    cashBankReceivablesSecurities: 0,
    totalAssets: 0,
    currentLiabilities: 0,
    totalLiabilities: 0,
    ownFundsEquity: 0,
    totalDebt: 0,
    ebitdaComponents: {
        netIncome: 0,
        interest: 0,
        taxes: 0,
        depreciation: 0,
        amortization: 0
    }
});

export default function NewApplicationPage() {
    const router = useRouter();
    const { currentUser, updateApplicationStatus, addApplication } = useAppStore(); // Removed unused 'rules'
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [vendor, setVendor] = useState<VendorProfile>({
        legalName: "",
        pan: "",
        gstin: "",
        industry: "",
        address: "",
        contactPerson: "",
        yearsInBusiness: 0,
    });

    // Legacy Financials (still kept for type compatibility if needed, but we focus on V2)
    const [financials, setFinancials] = useState<Financials>({
        revenue: 0,
        ebitda: 0,
        netWorth: 0,
        totalDebt: 0,
        cash: 0,
        workingCapital: 0,
    });

    const [exposure, setExposure] = useState({
        existingLoans: 0,
        existingBonds: 0,
        bondUtilization: 0,
        claimsCount: 0,
        largestClaim: 0,
        projectIssues: false,
    });

    // V2 Data State
    const [detailedFinancials, setDetailedFinancials] = useState<DetailedFinancials>({
        yearX: initialFinancialYear(new Date().getFullYear() - 1),
        yearY: initialFinancialYear(new Date().getFullYear() - 2),
    });

    const [characterFlags, setCharacterFlags] = useState<CharacterFlags>({
        auditedReportAvailable: false,
        tdpCompanyIdentityAvailable: false,
        experienceSimilarProjectsAvailable: false,
        yearsOfExperience: 0,
    });

    const handleNext = () => setStep((p) => Math.min(p + 1, 4));
    const handleBack = () => setStep((p) => Math.max(p - 1, 1));

    const handleSubmit = async () => {
        setIsSubmitting(true);

        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Calculate Score V2
        // Sync yearsOfExperience from vendor profile to character flags if not manually set?
        // Or specific logic. Let's ensure characterFlags.yearsOfExperience matches vendor.yearsInBusiness
        const finalFlags = { ...characterFlags, yearsOfExperience: vendor.yearsInBusiness };

        const scoreResultV2 = calculateScoreV2(detailedFinancials, finalFlags);

        // Map V2 result to V1 result for compatibility (optional, or we use V2 primarily)
        // We will store both.

        // Populate legacy financials from detailed Year X for summary view
        const legacyFinancials: Financials = {
            revenue: detailedFinancials.yearX.turnover,
            ebitda: detailedFinancials.yearX.ebitdaComponents.netIncome +
                detailedFinancials.yearX.ebitdaComponents.interest +
                detailedFinancials.yearX.ebitdaComponents.taxes +
                detailedFinancials.yearX.ebitdaComponents.depreciation +
                detailedFinancials.yearX.ebitdaComponents.amortization,
            netWorth: detailedFinancials.yearX.ownFundsEquity,
            totalDebt: detailedFinancials.yearX.totalDebt,
            cash: detailedFinancials.yearX.cashBankReceivablesSecurities,
            workingCapital: detailedFinancials.yearX.currentAssets - detailedFinancials.yearX.currentLiabilities
        };

        const newApp: Application = {
            id: `app-${Date.now()}`,
            vendor,
            financials: legacyFinancials,
            exposure,
            status: "submitted",
            // score: ... (Legacy score engine? We can omit or map V2 logic to it roughly)
            score: {
                score: scoreResultV2.totalScore, // Map 0-100? V2 is 0-~10. V1 was 0-100.
                // Wait, V2 total score is sum of 3 components (approx 30 points max).
                // V1 expectation might be different. Let's just use V2 score number.
                rating: scoreResultV2.decision === "Acceptance" ? "A" : "C", // Mock mapping
                decision: scoreResultV2.decision === "Acceptance" ? "Approved" : "Decline",
                recommendedLimit: 0, // Not calculated in V2 yet
                collateralPercent: 0,
                breakdown: [] // Empty legacy breakdown
            },
            suggestedDecision: scoreResultV2.decision === "Acceptance" ? "Approved" : "Decline",

            // V2 Data
            detailedFinancials,
            characterFlags: finalFlags,
            scoringResultV2: scoreResultV2,
            overrides: [],

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        addApplication(newApp);
        router.push(`/applications/${newApp.id}`);
    };

    return (
        <AppLayout user={currentUser}>
            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">New Surety Application</h1>
                    <p className="text-muted-foreground">
                        Complete the steps below to evaluate eligibility (SOEASY v2).
                    </p>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= s
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground text-muted-foreground"
                                    }`}
                            >
                                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                            </div>
                            <span
                                className={`text-sm font-medium ${step >= s ? "text-foreground" : "text-muted-foreground"
                                    }`}
                            >
                                {s === 1
                                    ? "Vendor Profile"
                                    : s === 2
                                        ? "Financials (v2)"
                                        : s === 3
                                            ? "Exposure"
                                            : "Review"}
                            </span>
                            {s < 4 && <div className="h-px w-12 bg-muted mx-2" />}
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {step === 1 && "Vendor Details"}
                                {step === 2 && "Detailed Financials & Character"}
                                {step === 3 && "Exposure & History"}
                                {step === 4 && "Review & Submit"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {step === 1 && (
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="legalName">Legal Name</Label>
                                            <Input
                                                id="legalName"
                                                value={vendor.legalName}
                                                onChange={(e) =>
                                                    setVendor({ ...vendor, legalName: e.target.value })
                                                }
                                                placeholder="Acme Corp"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="industry">Industry</Label>
                                            <Select
                                                value={vendor.industry}
                                                onValueChange={(val) =>
                                                    setVendor({ ...vendor, industry: val })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Industry" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                                                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                                    <SelectItem value="Retail">Retail</SelectItem>
                                                    <SelectItem value="Service">Service</SelectItem>
                                                    <SelectItem value="Technology">Technology</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pan">PAN</Label>
                                            <Input
                                                id="pan"
                                                value={vendor.pan}
                                                onChange={(e) =>
                                                    setVendor({ ...vendor, pan: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gstin">GSTIN</Label>
                                            <Input
                                                id="gstin"
                                                value={vendor.gstin}
                                                onChange={(e) =>
                                                    setVendor({ ...vendor, gstin: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="years">Years in Business</Label>
                                        <Input
                                            id="years"
                                            type="number"
                                            value={vendor.yearsInBusiness}
                                            onChange={(e) =>
                                                setVendor({
                                                    ...vendor,
                                                    yearsInBusiness: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <FinancialsV2Form
                                    data={{ detailedFinancials, characterFlags }}
                                    updateData={(newData) => {
                                        if (newData.detailedFinancials) setDetailedFinancials(newData.detailedFinancials);
                                        if (newData.characterFlags) setCharacterFlags(newData.characterFlags);
                                    }}
                                />
                            )}

                            {step === 3 && (
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="claims">Claims in last 3 years</Label>
                                            <Input
                                                id="claims"
                                                type="number"
                                                value={exposure.claimsCount}
                                                onChange={(e) =>
                                                    setExposure({
                                                        ...exposure,
                                                        claimsCount: Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bondUtil">Existing Bond Util (%)</Label>
                                            <Input
                                                id="bondUtil"
                                                type="number"
                                                step="0.1"
                                                value={exposure.bondUtilization}
                                                onChange={(e) =>
                                                    setExposure({
                                                        ...exposure,
                                                        bondUtilization: Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-4">
                                        <Label>Has Project Completion Issues?</Label>
                                        <Select
                                            value={exposure.projectIssues ? "yes" : "no"}
                                            onValueChange={(val) =>
                                                setExposure({ ...exposure, projectIssues: val === "yes" })
                                            }
                                        >
                                            <SelectTrigger className="w-[100px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="no">No</SelectItem>
                                                <SelectItem value="yes">Yes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-4">
                                    <div className="rounded-md bg-muted p-4">
                                        <h3 className="font-semibold mb-2">Vendor Summary</h3>
                                        <div className="grid grid-cols-2 text-sm gap-2">
                                            <span className="text-muted-foreground">Name:</span>
                                            <span>{vendor.legalName}</span>
                                            <span className="text-muted-foreground">Industry:</span>
                                            <span>{vendor.industry}</span>
                                        </div>
                                    </div>
                                    <div className="rounded-md bg-muted p-4">
                                        <h3 className="font-semibold mb-2">Financial Summary (Values in ₹)</h3>
                                        <div className="grid grid-cols-2 text-sm gap-2">
                                            <span className="text-muted-foreground">Turnover (Latest):</span>
                                            <span>{detailedFinancials.yearX.turnover.toLocaleString()}</span>
                                            <span className="text-muted-foreground">Equity (Latest):</span>
                                            <span>{detailedFinancials.yearX.ownFundsEquity.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={step === 1 || isSubmitting}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            {step < 4 ? (
                                <Button onClick={handleNext}>
                                    Next
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? "Scoring..." : "Submit Application"}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
