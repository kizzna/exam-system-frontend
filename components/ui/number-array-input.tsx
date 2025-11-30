import { useState, useEffect, FocusEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';

interface NumberArrayInputProps {
    value?: number[];
    onChange: (value: number[]) => void;
    placeholder?: string;
    className?: string;
}

export function NumberArrayInput({ value, onChange, placeholder, className }: NumberArrayInputProps) {
    const safeValue = value || [];
    const [text, setText] = useState(safeValue.join(', '));

    // Sync text with value prop when it changes externally, but only if we're not currently editing (optional optimization)
    // actually, the safest way to avoid fighting the user's cursor is to only update text from props when the component mounts
    // or when the prop changes to something completely different (which is hard to detect).
    // A common pattern is to sync on blur, or use a key to force reset, or just trust local state while focused.
    // Let's try: Sync from props only if the parsed local text doesn't match the props (to avoid formatting wars).

    useEffect(() => {
        // Check if the current text parses to the same array as the incoming value
        const currentParsed = text.split(/[\s,]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        const valueSorted = [...safeValue].sort().join(',');
        const currentSorted = currentParsed.sort().join(',');

        // If the semantic value is different, update the text. 
        // This allows "1, " to stay "1, " even if value is [1].
        if (valueSorted !== currentSorted) {
            setText(safeValue.join(', '));
        }
    }, [value]);

    const parseAndNotify = (rawValue: string) => {
        const ids = rawValue
            .split(/[\s,]+/)
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n));
        onChange(ids);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setText(newVal);
        parseAndNotify(newVal);
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const ids = raw
            .split(/[\s,]+/)
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n));

        // Format local text nicely on blur
        setText(ids.join(', '));
    };

    return (
        <Input
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={className}
        />
    );
}
