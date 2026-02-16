"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function PendingApproval() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Approval Pending</CardTitle>
                    <CardDescription>
                        Your account has been created successfully.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-slate-600">
                        An administrator needs to approve your access request before you can use the platform.
                        You will be able to log in once your account is active.
                    </p>
                    <div className="pt-4">
                        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
                            Return to Login
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
