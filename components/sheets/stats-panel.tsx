import React from 'react';

export function StatsPanel() {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-red-50 rounded border border-red-100 flex items-center justify-center text-red-600 font-bold">
                Errors: 12
            </div>
            <div className="h-20 bg-blue-50 rounded border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                Processed: 1,140
            </div>
        </div>
    );
}
