"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScoringConfig, ScoringThreshold, ComponentConfig } from "@/types";
import { Save, RotateCcw } from "lucide-react";
import { DEFAULT_CONFIG } from "@/lib/scoring-engine-v2";

export default function AdminRulesPage() {
    const { currentUser, scoringConfig, updateScoringConfig } = useAppStore();
    const [config, setConfig] = useState<ScoringConfig>(scoringConfig);
    const [isDirty, setIsDirty] = useState(false);

    // Sync local state with store when store updates (initial load)
    useEffect(() => {
        setConfig(scoringConfig);
    }, [scoringConfig]);

    const handleSave = () => {
        updateScoringConfig(config);
        setIsDirty(false);
        // In a real app, we'd show a toast here
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
        setIsDirty(true);
    };

    const updateWeight = (section: keyof ScoringConfig, component: string, value: number) => {
        // Type narrowing for section that has components
        if (section === 'decision') return;

        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                components: {
                    ...prev[section].components,
                    [component]: {
                        ...prev[section].components[component],
                        weight: value
                    }
                }
            }
        }));
        setIsDirty(true);
    };

    const updateThreshold = (
        section: keyof ScoringConfig,
        component: string,
        index: number,
        field: keyof ScoringThreshold,
        value: any
    ) => {
        if (section === 'decision') return;

        const currentComp = config[section].components[component];
        if (!currentComp.thresholds) return;

        const newThresholds = [...currentComp.thresholds];
        newThresholds[index] = { ...newThresholds[index], [field]: value };

        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                components: {
                    ...prev[section].components,
                    [component]: {
                        ...prev[section].components[component],
                        thresholds: newThresholds
                    }
                }
            }
        }));
        setIsDirty(true);
    };

    const renderComponentConfig = (sectionKey: 'character' | 'liquidity' | 'profitability', key: string, comp: ComponentConfig) => {
        return (
            <Card key={key} className="mb-4">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Label htmlFor={`weight-${key}`}>Weight</Label>
                            <Input
                                id={`weight-${key}`}
                                type="number"
                                className="w-20"
                                step="0.01"
                                value={comp.weight}
                                onChange={(e) => updateWeight(sectionKey, key, parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {comp.thresholds && (
                        <div>
                            <p className="text-sm font-medium mb-2">Thresholds</p>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Operator</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {comp.thresholds.map((t, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono">{t.operator}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="w-24 h-8"
                                                    value={t.value}
                                                    onChange={(e) => updateThreshold(sectionKey, key, i, 'value', parseFloat(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="w-24 h-8"
                                                    value={t.points}
                                                    onChange={(e) => updateThreshold(sectionKey, key, i, 'points', parseFloat(e.target.value))}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {comp.boolPoints && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Points (True)</Label>
                                <Input disabled value={comp.boolPoints.true} className="mt-1" />
                            </div>
                            <div>
                                <Label>Points (False)</Label>
                                <Input disabled value={comp.boolPoints.false} className="mt-1" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <AppLayout user={currentUser}>
            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Scoring Configuration</h1>
                        <p className="text-muted-foreground">Adjust weights, thresholds, and decision bands.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleReset} disabled={!isDirty}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Default
                        </Button>
                        <Button onClick={handleSave} disabled={!isDirty}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="liquidity">
                    <TabsList>
                        <TabsTrigger value="liquidity">Liquidity (32%)</TabsTrigger>
                        <TabsTrigger value="profitability">Profitability (48%)</TabsTrigger>
                        <TabsTrigger value="character">Character (20%)</TabsTrigger>
                        <TabsTrigger value="decision">Decision Bands</TabsTrigger>
                    </TabsList>

                    <TabsContent value="liquidity" className="space-y-4">
                        {Object.entries(config.liquidity.components).map(([key, comp]) =>
                            renderComponentConfig('liquidity', key, comp)
                        )}
                    </TabsContent>

                    <TabsContent value="profitability" className="space-y-4">
                        {Object.entries(config.profitability.components).map(([key, comp]) =>
                            renderComponentConfig('profitability', key, comp)
                        )}
                    </TabsContent>

                    <TabsContent value="character" className="space-y-4">
                        {Object.entries(config.character.components).map(([key, comp]) =>
                            renderComponentConfig('character', key, comp)
                        )}
                    </TabsContent>

                    <TabsContent value="decision">
                        <Card>
                            <CardHeader>
                                <CardTitle>Decision Logic</CardTitle>
                                <CardDescription>Score ranges for automatic approvals and rejections.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Min Score</TableHead>
                                            <TableHead>Max Score</TableHead>
                                            <TableHead>Decision</TableHead>
                                            <TableHead>Loading %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {config.decision.bands.map((band, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{band.min}</TableCell>
                                                <TableCell>{band.max}</TableCell>
                                                <TableCell>
                                                    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${band.decision === 'Acceptance' ? 'border-transparent bg-[#009F69] text-white' : 'border-transparent bg-destructive text-destructive-foreground'
                                                        }`}>
                                                        {band.decision}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{band.loading !== null ? `${band.loading}%` : '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
