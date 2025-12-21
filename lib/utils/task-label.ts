
export function getTaskLabel(taskId: string) {
    if (!taskId || taskId.length !== 8) return `สนามสอบ: ${taskId}`;

    const centerCode = taskId.substring(0, 6);
    const levelDigit = taskId[6];
    const typeDigit = taskId[7];

    const levels: Record<string, string> = {
        '1': 'ตรี',
        '2': 'โท',
        '3': 'เอก'
    };

    const types: Record<string, string> = {
        '1': 'ประถม',
        '2': 'มัธยม',
        '3': 'อุดม'
    };

    const level = levels[levelDigit] || '';
    const type = types[typeDigit] || '';

    return `สนามสอบ ${centerCode} ${level} ${type}`.trim();
}
