import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AuditLog } from '@/lib/types/audit';

interface AuditDetailsDialogProps {
    log: AuditLog | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AuditDetailsDialog({ log, open, onOpenChange }: AuditDetailsDialogProps) {
    if (!log) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Audit Log Details</DialogTitle>
                    <DialogDescription>
                        Activity ID: {log.id} | Action: {log.action}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold">User:</span> {log.user?.username} ({log.user?.email})
                        </div>
                        <div>
                            <span className="font-semibold">Timestamp:</span> {new Date(log.created_at).toLocaleString()}
                        </div>
                        <div>
                            <span className="font-semibold">Resource:</span> {log.resource_type} / {log.resource_id}
                        </div>
                        <div>
                            <span className="font-semibold">IP Address:</span> {log.ip_address}
                        </div>
                    </div>

                    {/* Diff View */}
                    {(log.old_values || log.new_values) && (
                        <div className="border rounded-md p-4 bg-muted/50">
                            <h4 className="font-semibold mb-2 text-sm">Changes:</h4>

                            {/* Comparison Table */}
                            <div className="text-sm">
                                <div className="grid grid-cols-3 gap-4 border-b pb-2 font-medium text-muted-foreground">
                                    <div>Field</div>
                                    <div>Old Value</div>
                                    <div>New Value</div>
                                </div>
                                {(() => {
                                    const oldV = log.old_values || {};
                                    const newV = log.new_values || {};
                                    const allKeys = Array.from(new Set([...Object.keys(oldV), ...Object.keys(newV)]));

                                    // Sort keys for consistent order
                                    allKeys.sort();

                                    return allKeys.map(key => {
                                        const oldVal = oldV[key];
                                        const newVal = newV[key];
                                        // Simple equality check (works for primitives, typical in these logs)
                                        const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                                        if (!isChanged) return null; // Option: Only show changed fields

                                        return (
                                            <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b last:border-0 items-center">
                                                <div className="font-mono text-xs font-semibold">{key}</div>
                                                <div className="font-mono text-xs text-red-600 bg-red-50 p-1 rounded break-all">
                                                    {oldVal !== undefined ? JSON.stringify(oldVal) : <span className="text-muted-foreground italic">undefined</span>}
                                                </div>
                                                <div className="font-mono text-xs text-green-600 bg-green-50 p-1 rounded break-all">
                                                    {newVal !== undefined ? JSON.stringify(newVal) : <span className="text-muted-foreground italic">undefined</span>}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}

                                {/* Show message if no changes detected but objects exist (edge case) */}
                                {(!log.old_values && !log.new_values) && <div className="text-muted-foreground italic py-2">No changes recorded.</div>}
                            </div>
                        </div>
                    )}

                    {/* Original Details (fallback / full view) */}
                    {(!log.old_values && !log.new_values && log.details) && (
                        <div className="border rounded-md p-4 bg-muted/50">
                            <h4 className="font-semibold mb-2 text-sm">Details:</h4>
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                                {JSON.stringify(log.details, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
