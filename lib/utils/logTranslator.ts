// utils/logTranslator.ts

type LogMatcher = {
    // The regex to look for in the English message
    regex: RegExp;
    // A function to build the Thai string using captured groups (args)
    replacer: (args: RegExpMatchArray) => string;
};

// Define your patterns here. Order matters (most specific to least specific).
const MATCHERS: LogMatcher[] = [
    // --- Batch Process Patterns ---
    {
        regex: /Starting extraction/i,
        replacer: () => `กำลังเริ่มแตกไฟล์ ZIP`,
    },
    {
        regex: /Extraction complete - (\d+) sheets/i,
        replacer: (match) => `แตกไฟล์ ZIP เสร็จสิ้น - ${match[1]} ฉบับ`,
    },
    {
        regex: /Creating sheet records/i,
        replacer: () => `กำลังสร้างข้อมูลใบคำตอบ`,
    },
    {
        regex: /Dispatching (\d+) tasks to workers/i,
        replacer: (match) => `กำลังส่งงาน ${match[1]} รายการไปยังระบบประมวลผล`,
    },
    {
        regex: /Processing: (\d+)\/(\d+) sheets completed/i,
        replacer: (match) => `กำลังประมวลผล: เสร็จสิ้น ${match[1]}/${match[2]} ฉบับ`,
    },
    {
        regex: /All (\d+) tasks completed \((\d+) failed\)/i,
        replacer: (match) => `ประมวลผลครบ ${match[1]} รายการ (ล้มเหลว ${match[2]})`,
    },
    {
        regex: /Collecting worker results/i,
        replacer: () => `กำลังรวบรวมผลลัพธ์`,
    },
    {
        regex: /Collected (\d+) results/i,
        replacer: (match) => `รวบรวมผลลัพธ์เรียบร้อย ${match[1]} รายการ`,
    },
    {
        regex: /Generating CSV files/i,
        replacer: () => `กำลังสร้างไฟล์ CSV`,
    },
    {
        regex: /CSV generation complete: (\d+) sheets, (\d+) answers/i,
        replacer: (match) => `สร้างไฟล์ CSV เสร็จสิ้น: ${match[1]} ฉบับ, ${match[2]} คำตอบ`,
    },
    {
        regex: /Loading to database/i,
        replacer: () => `กำลังบันทึกลงฐานข้อมูล`,
    },
    {
        regex: /Database load complete: (\d+) sheets, (\d+) answers in (\d+)ms/i,
        replacer: (match) => `บันทึกลงฐานข้อมูลเสร็จสิ้น: ${match[1]} ฉบับ, ${match[2]} คำตอบ (ใช้เวลา ${match[3]} ms)`,
    },
    {
        regex: /Cleaning up batch files/i,
        replacer: () => `กำลังล้างไฟล์ชั่วคราว`,
    },
    {
        regex: /Batch completed successfully/i,
        replacer: () => `อัปโหลดและตรวจข้อสอบเสร็จสมบูรณ์`,
    },

    // --- Reprocess / Shared Patterns ---
    {
        // Match: "Initializing reprocess job for 5 sheets"
        regex: /Initializing reprocess job for (\d+) sheets/i,
        replacer: (match) => `กำลังเริ่มประมวลผลใหม่สำหรับ ${match[1]} ฉบับ`,
    },
    {
        // Match: "processed 0/5 sheets"
        regex: /processed (\d+)\/(\d+) sheets/i,
        replacer: (match) => `ประมวลผลแล้ว ${match[1]} จาก ${match[2]} ฉบับ`,
    },
    {
        // Match: "Generating CSV for database update"
        regex: /Generating CSV for database update/i,
        replacer: () => `กำลังสร้างไฟล์ CSV เพื่ออัปเดตฐานข้อมูล`,
    },
    {
        // Match: "Loading reprocessed data"
        regex: /Loading reprocessed data/i,
        replacer: () => `กำลังโหลดและบันทึกข้อมูลใหม่`,
    },
    {
        // Match: "Finalizing scores"
        regex: /Finalizing scores/i,
        replacer: () => `กำลังสรุปผลคะแนน (Surgical Update)`,
    },
    {
        // Match: "Reprocessing completed successfully"
        regex: /Reprocessing completed successfully/i,
        replacer: () => `การประมวลผลเสร็จสมบูรณ์`,
    },
    {
        // Match: "Job failed: Some Error Message"
        regex: /Job failed: (.+)/i,
        replacer: (match) => `เกิดข้อผิดพลาด: ${match[1]}`,
    },
];

export function translateLog(englishMessage: string): string {
    if (!englishMessage) return "";

    // 1. Clean up common prefixes if they exist in your raw log
    // e.g. "[Reprocessing OMR] processed..." -> "processed..."
    const cleanMessage = englishMessage.replace(/^\[.*?\]\s*/, "");

    // 2. Find a matching pattern
    for (const matcher of MATCHERS) {
        const match = cleanMessage.match(matcher.regex);
        if (match) {
            return matcher.replacer(match);
        }
    }

    // 3. Fallback: Return original English if no match found
    return englishMessage;
}