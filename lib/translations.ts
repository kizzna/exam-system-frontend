import { RosterEntry } from '@/lib/types/tasks';

export const ROW_STATUS_TRANSLATIONS: Record<RosterEntry['row_status'] | 'DEFAULT', string> = {
    'GHOST': 'ไม่มีรายชื่อ',
    'MISSING': 'ไม่พบใบตอบ',
    'ABSENT_MISMATCH': 'ขาดสอบแต่มีใบตอบ',
    'DUPLICATE': 'รหัสซ้ำ',
    'ERROR': 'ข้อมูลผิดพลาด',
    'UNEXPECTED': 'ผิดปกติ',
    'ABSENT': 'ขาดสอบ',
    'OK': 'ปกติ',
    'DEFAULT': 'ปกติ'
};

export const getThaiRowStatus = (status: string | null | undefined): string => {
    if (!status) return '-';
    return ROW_STATUS_TRANSLATIONS[status as RosterEntry['row_status']] || status;
};

export const CLASS_LEVEL_TRANSLATIONS: Record<string, string> = {
    '1': 'ชั้นตรี',
    '2': 'ชั้นโท',
    '3': 'ชั้นเอก'
};

export const CLASS_GROUP_TRANSLATIONS: Record<string, string> = {
    '1': 'ประถม',
    '2': 'มัธยม',
    '3': 'อุดม'
};

export const getThaiClassLevel = (level: string | number | null | undefined): string => {
    if (!level) return '-';
    return CLASS_LEVEL_TRANSLATIONS[level.toString()] || level.toString();
};

export const getThaiClassGroup = (group: string | number | null | undefined): string => {
    if (!group) return '-';
    return CLASS_GROUP_TRANSLATIONS[group.toString()] || group.toString();
};
