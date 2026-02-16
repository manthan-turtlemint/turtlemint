"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Application,
    ApplicationStatus,
    Decision,
    ScoringRule,
    User,
    ScoringConfig,
} from "@/types";
import { DEFAULT_CONFIG } from "./scoring-engine-v2";
import * as actions from "./actions";

interface AppState {
    currentUser: User | null;
    users: User[]; // This will stay legacy or be used for something else
    applications: Application[];
    rules: ScoringRule[];
    scoringConfig: ScoringConfig;
    loading: boolean;
}

interface AppContextType extends AppState {
    addApplication: (app: Application) => Promise<void>;
    updateApplicationStatus: (id: string, status: ApplicationStatus) => Promise<void>;
    finalizeDecision: (
        id: string,
        decision: Decision,
        limit: number,
        collateral: number,
        notes: string,
        user: User
    ) => Promise<void>;
    addRule: (rule: ScoringRule) => Promise<void>; // Note: logic needed in actions.ts if used
    toggleRule: (id: string) => Promise<void>;
    updateScoringConfig: (config: ScoringConfig) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [applications, setApplications] = useState<Application[]>([]);
    const [rules, setRules] = useState<ScoringRule[]>([]);
    const [scoringConfig, setScoringConfig] = useState<ScoringConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);

    // Sync with DB on mount / session change
    useEffect(() => {
        if (status === "authenticated") {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [apps, dbRules, config] = await Promise.all([
                        actions.getApplications(),
                        actions.getRules(),
                        actions.getScoringConfig(),
                    ]);
                    setApplications(apps);
                    setRules(dbRules);
                    if (config) setScoringConfig(config);
                } catch (error) {
                    console.error("Failed to fetch data:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        } else if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status]);

    const addApplication = async (app: Application) => {
        await actions.createApplication(app);
        // Optimistic update or just refetch
        const apps = await actions.getApplications();
        setApplications(apps);
    };

    const updateApplicationStatus = async (id: string, status: ApplicationStatus) => {
        await actions.updateAppStatus(id, status);
        setApplications(prev =>
            prev.map(app => app.id === id ? { ...app, status } : app)
        );
    };

    const finalizeDecision = async (
        id: string,
        decision: Decision,
        limit: number,
        collateral: number,
        notes: string,
        user: User
    ) => {
        await actions.finalizeApp(id, decision, limit, collateral);
        setApplications(prev =>
            prev.map(app =>
                app.id === id
                    ? {
                        ...app,
                        status: "finalized",
                        finalDecision: decision,
                        finalLimit: limit,
                        finalCollateral: collateral,
                    }
                    : app
            )
        );
    };

    const addRule = async (rule: ScoringRule) => {
        // Implementation omitted for brevity, would need createScoringRule action
    };

    const toggleRule = async (id: string) => {
        await actions.toggleScoringRule(id);
        setRules(prev =>
            prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
        );
    };

    const updateScoringConfig = async (newConfig: ScoringConfig) => {
        await actions.updateConfig(newConfig);
        setScoringConfig(newConfig);
    };

    const currentUser: User | null = session?.user ? {
        id: session.user.id,
        name: session.user.name || "User",
        email: session.user.email || "",
        role: (session.user.role as any) || "underwriter",
    } : null;

    return (
        <AppContext.Provider
            value={{
                currentUser,
                users: [], // Legacy
                applications,
                rules,
                scoringConfig,
                loading,
                addApplication,
                updateApplicationStatus,
                finalizeDecision,
                addRule,
                toggleRule,
                updateScoringConfig,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppStore() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useAppStore must be used within an AppProvider");
    }
    return context;
}
