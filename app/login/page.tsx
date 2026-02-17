"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const error = searchParams.get("error");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLocalError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setLocalError(result.error);
            } else {
                router.push("/");
            }
        } catch (err) {
            setLocalError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg border-slate-200">
            <CardHeader className="text-center space-y-2">
                <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">BondDesk</CardTitle>
                <CardDescription className="text-slate-500">
                    Enterprise Surety Eligibility & Scoring Engine
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-4">
                    {(error || localError) && (
                        <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 text-sm text-destructive flex gap-3 items-start animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold mb-1">Login Error</p>
                                <p>{localError || error}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pb-8">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-6 text-lg font-medium transition-all hover:scale-[1.01]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                    <p className="text-sm text-center text-slate-500 px-4">
                        Contact your administrator if you don't have an account or have forgotten your password.
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white p-4">
            <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-primary" />}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
