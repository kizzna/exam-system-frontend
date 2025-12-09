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
