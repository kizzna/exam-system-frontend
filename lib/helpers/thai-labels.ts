export const CLASS_LEVELS = {
    1: { id: 1, short: 'ตรี', full: 'ธรรมศึกษาชั้นตรี' },
    2: { id: 2, short: 'โท', full: 'ธรรมศึกษาชั้นโท' },
    3: { id: 3, short: 'เอก', full: 'ธรรมศึกษาชั้นเอก' },
};

export const CLASS_GROUPS = {
    1: { id: 1, short: 'ประถม', full: 'ประถมศึกษา' },
    2: { id: 2, short: 'มัธยม', full: 'มัธยมศึกษา' },
    3: { id: 3, short: 'อุดม', full: 'อุดมศึกษา' },
};

export function getClassLevelLabel(level: number, full: boolean = false): string {
    const data = CLASS_LEVELS[level as keyof typeof CLASS_LEVELS];
    return data ? (full ? data.full : data.short) : '';
}

export function getClassGroupLabel(group: number, full: boolean = false): string {
    const data = CLASS_GROUPS[group as keyof typeof CLASS_GROUPS];
    return data ? (full ? data.full : data.short) : '';
}
