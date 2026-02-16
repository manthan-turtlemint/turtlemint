"use client";

import { useAppStore } from "@/lib/store";
import { AppLayout } from "@/components/layout/app-layout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

// Mock audit logs for MVP since we didn't implement fully connected logs
const MOCK_AUDIT_LOGS = [
    {
        id: "evt-1",
        actor: "Alice Admin",
        action: "Updated Rule",
        entity: "Rule: High Revenue Stability",
        details: "Changed points from 5 to 10",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
        id: "evt-2",
        actor: "Bob Underwriter",
        action: "Created Application",
        entity: "App: Acme Infra Ltd",
        details: "New submission",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
        id: "evt-3",
        actor: "Bob Underwriter",
        action: "Override Decision",
        entity: "App: StartUp Tech",
        details: "Changed from Decline to Conditional",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
];

export default function AuditLogsPage() {
    const { currentUser } = useAppStore();

    return (
        <AppLayout user={currentUser}>
            <div className="flex flex-col space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        Track all system activities and changes.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>System Activity</CardTitle>
                        <CardDescription>
                            Immutable record of all critical actions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {MOCK_AUDIT_LOGS.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-xs">
                                            {formatDate(log.timestamp)}
                                        </TableCell>
                                        <TableCell>{log.actor}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{log.action}</Badge>
                                        </TableCell>
                                        <TableCell>{log.entity}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {log.details}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
