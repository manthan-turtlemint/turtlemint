"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
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
    users: User[];
    applications: Application[];
    rules: ScoringRule[];
    scoringConfig: ScoringConfig;
    loading: boolean;
}

interface AppContextType extends AppState {
    setRole: (role: "admin" | "underwriter") => void;
    addApplication: (app: Application) => Promise<void>;
    updateApplicationStatus: (id: string, status: ApplicationStatus) => Promise<void>;
    finalizeDecision: (
        id: string,
        decision: Decision,
        limit: number,
        collateral: number,
        notes: string,
        user: User | null
    ) => Promise<void>;
    addRule: (rule: ScoringRule) => Promise<void>;
    toggleRule: (id: string) => Promise<void>;
    updateScoringConfig: (config: ScoringConfig) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [role, setRoleState] = useState<"admin" | "underwriter">("underwriter");
    const [applications, setApplications] = useState<Application[]>([]);
    const [rules, setRules] = useState<ScoringRule[]>([]);
    const [scoringConfig, setScoringConfig] = useState<ScoringConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);

    // Initial role load
    useEffect(() => {
        const savedRole = localStorage.getItem("bonddesk_role") as "admin" | "underwriter";
        if (savedRole) {
            setRoleState(savedRole);
        }
    }, []);

    const setRole = (newRole: "admin" | "underwriter") => {
        setRoleState(newRole);
        localStorage.setItem("bonddesk_role", newRole);
    };

    // Sync with DB
    useEffect(() => {
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
    }, []);

    const addApplication = async (app: Application) => {
        await actions.createApplication(app);
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
        user: User | null
    ) => {
        if (!user) throw new Error("Unauthorized");
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
        // Implementation omitted for brevity
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

    const currentUser: User = {
        id: "demo-user",
        name: "Public User",
        email: "demo@bonddesk.com",
        role: role,
    };

    return (
        <AppContext.Provider
            value={{
                currentUser,
                users: [],
                applications,
                rules,
                scoringConfig,
                loading,
                setRole,
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
