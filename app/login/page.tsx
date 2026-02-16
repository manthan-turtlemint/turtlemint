"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Welcome to BondDesk</CardTitle>
                    <CardDescription>
                        Enterprise Surety Eligibility & Scoring Engine
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-700">
                        <p className="font-semibold mb-1">Notice:</p>
                        <p>Only Gmail accounts are permitted. New accounts require manual approval by the administrator.</p>
                    </div>
                    <Button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="w-full flex items-center justify-center gap-2 py-6 text-lg"
                    >
                        <Mail className="w-5 h-5" />
                        Sign in with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
