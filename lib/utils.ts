import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
export function calculateStudentRoll(classLevel: number, group: number, masterRoll: string): string {
    // Logic from docs/master_roll-and-student_roll-explained.md
    // digit 1 : class and group map
    // 1: c1g1, 2: c1g2, 3: c1g3
    // 4: c2g1, 5: c2g2, 6: c2g3
    // 7: c3g1, 8: c3g2, 9: c3g3

    // We can derive this: prefix = (classLevel - 1) * 3 + group
    // But let's handle edge cases or use a map if simpler.
    // Assuming classLevel 1-3 and group 1-3 based on doc examples.

    // Note: The doc says "digit 2-5 : roll number of student", implying 4 digits padding
    // e.g. master roll 1 -> 0001
    // prefix 1 + 0001 = 10001

    if (!masterRoll) return '';

    // Extract numeric part of masterRoll (just in case it's string)
    const rollNum = parseInt(masterRoll, 10);
    if (isNaN(rollNum)) return masterRoll; // Fallback

    // Validate classLevel and group
    if (isNaN(classLevel) || isNaN(group) || classLevel < 1 || group < 1) {
        return masterRoll;
    }

    const prefix = (classLevel - 1) * 3 + group;

    // Pad rollNum to 4 digits
    const paddedRoll = rollNum.toString().padStart(4, '0');

    return `${prefix}${paddedRoll}`;
}
