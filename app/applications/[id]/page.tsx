"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, FileText, ShieldAlert, Circle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Decision, DetailedScoringResult } from "@/types";

export default function ApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { applications, currentUser, finalizeDecision } = useAppStore();
    const [activeTab, setActiveTab] = useState("overview");
    const [isOverrideOpen, setIsOverrideOpen] = useState(false);

    const id = params.id as string;
    const application = applications.find((app) => app.id === id);

    // Override State
    const [decision, setDecision] = useState<Decision>("Conditional");
    const [limit, setLimit] = useState(0);
    const [collateral, setCollateral] = useState(0);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (application && application.score) {
            // Initialize override values with system suggestions if not finalized
            if (application.status !== 'finalized') {
                setDecision(application.score.decision);
                setLimit(application.score.recommendedLimit);
                setCollateral(application.score.collateralPercent);
            } else {
                setDecision(application.finalDecision!);
                setLimit(application.finalLimit!);
                setCollateral(application.finalCollateral!);
                // Notes would need to be stored in application model properly
            }
        }
    }, [application]);

    if (!application) {
        return (
            <AppLayout user={currentUser}>
                <div className="flex h-full items-center justify-center">
                    <p>Application not found</p>
                </div>
            </AppLayout>
        );
    }

    const handleFinalize = () => {
        finalizeDecision(application.id, decision, limit, collateral, notes, currentUser);
        setIsOverrideOpen(false);
    };

    const isFinalized = application.status === "finalized";
    const scoreV2 = application.scoringResultV2; // Convenience accessor

    return (
        <AppLayout user={currentUser}>
            <div className="flex flex-col space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {application.vendor.legalName}
                            </h1>
                            <Badge variant={isFinalized ? (application.finalDecision === 'Approved' ? 'success' : 'destructive') : 'secondary'}>
                                {application.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Application ID: {application.id} • Created on{" "}
                            {formatDate(application.createdAt)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {!isFinalized && (
                            <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
                                <DialogTrigger asChild>
                                    <Button>Review & Finalize</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Finalize Decision</DialogTitle>
                                        <DialogDescription>
                                            Review system recommendations and apply overrides if necessary.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="decision" className="text-right">
                                                Decision
                                            </Label>
                                            <Select
                                                value={decision}
                                                onValueChange={(val) => setDecision(val as Decision)}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Approved">Approved</SelectItem>
                                                    <SelectItem value="Conditional">Conditional</SelectItem>
                                                    <SelectItem value="Decline">Decline</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="limit" className="text-right">
                                                Limit (₹)
                                            </Label>
                                            <Input
                                                id="limit"
                                                type="number"
                                                value={limit}
                                                onChange={(e) => setLimit(Number(e.target.value))}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="collateral" className="text-right">
                                                Collateral %
                                            </Label>
                                            <Input
                                                id="collateral"
                                                type="number"
                                                value={collateral}
                                                onChange={(e) => setCollateral(Number(e.target.value))}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="notes" className="text-right">
                                                Justification
                                            </Label>
                                            <Textarea
                                                id="notes"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="col-span-3"
                                                placeholder="Reason for override..."
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleFinalize}>Confirm & Finalize</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                {/* KPI Summary */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Risk Score (V2)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                {scoreV2 ? scoreV2.totalScore : (application.score?.score || "N/A")}
                                {scoreV2 && (
                                    <span className="text-xs font-normal text-muted-foreground">/ 10</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Rec. Decision
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {scoreV2 ? scoreV2.decision : application.score?.decision}
                            </div>
                            {scoreV2?.loadingPct !== null && scoreV2?.loadingPct !== undefined && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Loading: {scoreV2.loadingPct}%
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="financials">Financials</TabsTrigger>
                        <TabsTrigger value="scoring">Scoring Breakdown</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vendor Profile</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Legal Name</p>
                                        <p>{application.vendor.legalName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Industry</p>
                                        <p>{application.vendor.industry}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Contact</p>
                                        <p>{application.vendor.contactPerson}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Address</p>
                                        <p>{application.vendor.address || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">PAN</p>
                                        <p>{application.vendor.pan}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">GSTIN</p>
                                        <p>{application.vendor.gstin}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Exposure Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Existing Bond Util.</p>
                                        <p>{application.exposure.bondUtilization * 100}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Claims (3 yrs)</p>
                                        <p>{application.exposure.claimsCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="financials">
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">Revenue</TableCell>
                                            <TableCell>{formatCurrency(application.financials.revenue)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Net Worth</TableCell>
                                            <TableCell>{formatCurrency(application.financials.netWorth)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">EBITDA</TableCell>
                                            <TableCell>{formatCurrency(application.financials.ebitda)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Total Debt</TableCell>
                                            <TableCell>{formatCurrency(application.financials.totalDebt)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="scoring">
                        <Card>
                            <CardHeader>
                                <CardTitle>Scoring Breakdown (SOEASY v2)</CardTitle>
                                <CardDescription>
                                    Detailed scoring analysis based on financial ratios and character checks.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {scoreV2 ? (
                                    <div className="space-y-8">
                                        {/* Score Summary */}
                                        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-medium text-muted-foreground">Total Score</span>
                                                <span className="text-3xl font-bold">{scoreV2.totalScore}</span>
                                                <span className="text-xs text-muted-foreground">Max 10.0</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-medium text-muted-foreground">Character</span>
                                                <span className="text-xl font-bold">{scoreV2.subScores.character.score.toFixed(2)}</span>
                                                <span className="text-xs text-muted-foreground">Max 2.0</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-medium text-muted-foreground">Liquidity</span>
                                                <span className="text-xl font-bold">{scoreV2.subScores.liquidity.score.toFixed(2)}</span>
                                                <span className="text-xs text-muted-foreground">Max 3.2</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-medium text-muted-foreground">Profitability</span>
                                                <span className="text-xl font-bold">{scoreV2.subScores.profitability.score.toFixed(2)}</span>
                                                <span className="text-xs text-muted-foreground">Max 4.8</span>
                                            </div>
                                        </div>

                                        {/* Detailed Tables */}
                                        <div className="grid gap-6">
                                            {(['character', 'liquidity', 'profitability'] as const).map((key) => {
                                                const subScore = scoreV2.subScores[key];
                                                return (
                                                    <div key={key} className="space-y-4">
                                                        <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                                                            {key} Sub-Score
                                                            {subScore.flagged && <Badge variant="destructive">Low Score Alert</Badge>}
                                                        </h3>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Component</TableHead>
                                                                    <TableHead className="text-right">Value</TableHead>
                                                                    <TableHead className="text-right">Points</TableHead>
                                                                    <TableHead className="text-right">Weighted</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {subScore.components.map((c, i) => (
                                                                    <TableRow key={i}>
                                                                        <TableCell>{c.name}</TableCell>
                                                                        <TableCell className="text-right font-mono">
                                                                            {typeof c.value === 'boolean'
                                                                                ? (c.value ? "Yes" : "No")
                                                                                : typeof c.value === 'number'
                                                                                    ? c.value.toFixed(2)
                                                                                    : c.value}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">{c.points}</TableCell>
                                                                        <TableCell className="text-right font-bold">{c.weightedScore.toFixed(2)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No V2 scoring data available for this application.
                                        <br />
                                        <span className="text-sm">Submit a new application to use the V2 engine.</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle>Documents</CardTitle>
                                <CardDescription>Uploaded files attached to this application.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 p-2 border rounded">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm">GST_Certificate.pdf</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 border rounded">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm">Financials_FY23.pdf</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
