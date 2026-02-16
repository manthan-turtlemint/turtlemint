"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"; // Assuming we have switch or checks
import { DetailedFinancials, CharacterFlags } from "@/types";
import { Button } from "@/components/ui/button";

interface FinancialsV2FormProps {
    data: {
        detailedFinancials: DetailedFinancials;
        characterFlags: CharacterFlags;
    };
    updateData: (data: Partial<{ detailedFinancials: DetailedFinancials; characterFlags: CharacterFlags }>) => void;
}

export function FinancialsV2Form({ data, updateData }: FinancialsV2FormProps) {
    const { detailedFinancials, characterFlags } = data;

    const handleFinancialChange = (year: 'yearX' | 'yearY', field: string, value: string) => {
        // Deep update helper
        const newData = { ...detailedFinancials };
        const numValue = parseFloat(value) || 0;

        // Handle nested ebitdaComponents
        if (field.startsWith('ebitda.')) {
            const ebitdaField = field.split('.')[1] as keyof typeof newData.yearX.ebitdaComponents;
            newData[year].ebitdaComponents = {
                ...newData[year].ebitdaComponents,
                [ebitdaField]: numValue
            };
        } else {
            const f = field as keyof typeof newData.yearX;
            if (f !== 'ebitdaComponents' && f !== 'year') {
                (newData[year] as any)[f] = numValue;
            }
        }
        updateData({ detailedFinancials: newData });
    };

    const handleFlagChange = (field: keyof CharacterFlags, value: any) => {
        updateData({
            characterFlags: {
                ...characterFlags,
                [field]: value
            }
        });
    };

    // Helper to render a financial input row
    const renderRow = (label: string, field: string) => {
        const getVal = (yearData: any, f: string) => {
            if (f.startsWith('ebitda.')) {
                const k = f.split('.')[1];
                return (yearData.ebitdaComponents as any)[k];
            }
            return (yearData as any)[f];
        };

        return (
            <div className="grid grid-cols-3 gap-4 mb-4 items-center">
                <Label className="col-span-1 border-b border-dotted pb-1">{label}</Label>
                <div className="col-span-1">
                    <Input
                        type="number"
                        placeholder="Year X (Latest)"
                        value={getVal(detailedFinancials.yearX, field)}
                        onChange={(e) => handleFinancialChange('yearX', field, e.target.value)}
                        className="text-right font-mono"
                    />
                </div>
                <div className="col-span-1">
                    <Input
                        type="number"
                        placeholder="Year Y (Previous)"
                        value={getVal(detailedFinancials.yearY, field)}
                        onChange={(e) => handleFinancialChange('yearY', field, e.target.value)}
                        className="text-right font-mono"
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Character Flags */}
            <Card>
                <CardHeader>
                    <CardTitle>Character & Experience</CardTitle>
                    <CardDescription>Qualitative factors affecting eligibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                            <Label>Audited Financial Report Available?</Label>
                            <p className="text-sm text-muted-foreground">Is the latest financial report audited by a qualified accountant?</p>
                        </div>
                        <Switch
                            checked={characterFlags.auditedReportAvailable}
                            onCheckedChange={(c) => handleFlagChange('auditedReportAvailable', c)}
                        />
                    </div>

                    <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                            <Label>TDP Company Identity?</Label>
                            <p className="text-sm text-muted-foreground">Does the company have verified TDP identity?</p>
                        </div>
                        <Switch
                            checked={characterFlags.tdpCompanyIdentityAvailable}
                            onCheckedChange={(c) => handleFlagChange('tdpCompanyIdentityAvailable', c)}
                        />
                    </div>

                    <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                            <Label>Experience in Similar Projects?</Label>
                            <p className="text-sm text-muted-foreground">Has the vendor successfully completed similar projects?</p>
                        </div>
                        <Switch
                            checked={characterFlags.experienceSimilarProjectsAvailable}
                            onCheckedChange={(c) => handleFlagChange('experienceSimilarProjectsAvailable', c)}
                        />
                    </div>

                    <div className="grid w-full items-center gap-1.5 pt-4">
                        <Label>Years of Experience (Operation Duration)</Label>
                        <Input
                            type="number"
                            className="w-full max-w-xs"
                            value={characterFlags.yearsOfExperience}
                            onChange={(e) => handleFlagChange('yearsOfExperience', parseFloat(e.target.value))}
                        />
                        <p className="text-sm text-muted-foreground">Derived from registration date usually.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Data */}
            <Card>
                <CardHeader>
                    <CardTitle>Financial Data (Last 2 Years)</CardTitle>
                    <CardDescription>Enter values exactly as per the financial statements.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4 font-semibold text-center bg-muted/50 p-2 rounded-t-lg">
                        <div className="text-left">Metric</div>
                        <div>Year X (Latest)</div>
                        <div>Year Y (Previous)</div>
                    </div>

                    {renderRow("Turnover", "turnover")}
                    {renderRow("Gross Profit", "grossProfit")}
                    {renderRow("Profit Before Tax (PBT)", "profitBeforeTax")}

                    <div className="my-6 border-t" />

                    {renderRow("Current Assets", "currentAssets")}
                    {renderRow("Cash / Bank / Receivables", "cashBankReceivablesSecurities")}
                    {renderRow("Total Assets", "totalAssets")}

                    <div className="my-6 border-t" />

                    {renderRow("Current Liabilities", "currentLiabilities")}
                    {renderRow("Total Liabilities", "totalLiabilities")}
                    {renderRow("Own Funds / Equity", "ownFundsEquity")}
                    {renderRow("Total Debt", "totalDebt")}

                    <div className="my-6 border-t" />
                    <Label className="text-lg font-semibold mb-4 block text-primary">EBITDA Components</Label>

                    {renderRow("Net Income", "ebitda.netIncome")}
                    {renderRow("Interest", "ebitda.interest")}
                    {renderRow("Taxes", "ebitda.taxes")}
                    {renderRow("Depreciation", "ebitda.depreciation")}
                    {renderRow("Amortization", "ebitda.amortization")}

                </CardContent>
            </Card>
        </div>
    );
}
