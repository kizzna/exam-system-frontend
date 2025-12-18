import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AuditAction, AuditLogParams } from '@/lib/types/audit';
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface AuditFiltersProps {
    filters: AuditLogParams;
    onFilterChange: (filters: AuditLogParams) => void;
    showUsernameFilter?: boolean;
}

export function AuditFilters({
    filters,
    onFilterChange,
    showUsernameFilter,
}: AuditFiltersProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleActionChange = (value: string) => {
        onFilterChange({ ...filters, action: value === 'ALL' ? undefined : value, page: 1 });
    };

    const handleInputChange = (field: keyof AuditLogParams, value: string) => {
        onFilterChange({ ...filters, [field]: value || undefined, page: 1 });
    };

    const clearFilters = () => {
        onFilterChange({
            page: 1,
            size: filters.size,
            resource_type: filters.resource_type,
            resource_id: filters.resource_id
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="w-[200px]">
                <Select
                    value={filters.action || 'ALL'}
                    onValueChange={handleActionChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Actions</SelectItem>
                        {Object.values(AuditAction).map((action) => (
                            <SelectItem key={action} value={action}>
                                {action}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {mounted && showUsernameFilter && (
                <div className="w-[200px]">
                    <Input
                        placeholder="Filter by Username"
                        value={filters.username || ''}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                    />
                </div>
            )}

            <div className="flex items-center gap-2">
                <Input
                    type="date"
                    className="w-[160px]"
                    value={filters.start_date ? filters.start_date.split('T')[0] : ''}
                    onChange={(e) => handleInputChange('start_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                    type="date"
                    className="w-[160px]"
                    value={filters.end_date ? filters.end_date.split('T')[0] : ''}
                    onChange={(e) => handleInputChange('end_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
                />
            </div>

            <Button variant="ghost" onClick={clearFilters} size="icon" title="Clear Filters">
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
