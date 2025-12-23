'use client';

import { useState } from 'react';
import { PlayCircle, FileVideo } from 'lucide-react';

// Hardcoded list or fetch from database
const videos = [
    { id: '2025-12-21-omr_2568_guide.mp4', title: 'วิธีตรวจใบตอบปรนัย (ฉบับแรก)' },
    { id: '2025-12-22_12-41-11-login-and-filter.mp4', title: 'Login และวิธีกรองสนามสอบ' },
    { id: '2025-12-22_12-46-11-sheet-navigation.mp4', title: 'วิธีเลื่อนไปยังใบตอบที่มีปัญหา' },
    { id: '2025-12-22_13-04-21-task-swap-move.mp4', title: 'วิธีสลับใบตอบทั้งสนาม และย้ายใบตอบบางฉบับ' },
    { id: '2025-12-22_13-11-42-delete-restore-correct.mp4', title: 'วิธีลบใบตอบ/กู้คืนใบตอบ และค้นหานักเรียนให้กับใบตอบ' },
];

export default function TutorialPage() {
    const [currentVideo, setCurrentVideo] = useState<string | null>(null);

    return (
        <div className="p-8 max-w-6xl mx-auto align-center">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 align-center">
                <FileVideo className="h-8 w-8 text-primary" />
                วิธีตรวจใบตอบปรนัย
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Player Section */}
                <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden aspect-video shadow-lg relative">
                    {currentVideo ? (
                        <video
                            controls
                            autoPlay
                            className="w-full h-full"
                            controlsList="nodownload"
                            src={`/stream/video/${currentVideo}`}
                        >
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 bg-zinc-900 border border-zinc-800">
                            <PlayCircle className="h-16 w-16 mb-4 opacity-50" />
                            <p>กรุณาเลือกวีดีโอ</p>
                        </div>
                    )}
                </div>

                {/* Video List Section */}
                <div className="bg-card p-4 rounded-lg shadow border border-border">
                    <h2 className="font-semibold mb-4 text-foreground">วีดีโอ</h2>
                    <ul className="space-y-2">
                        {videos.map((vid) => (
                            <li
                                key={vid.id}
                                onClick={() => setCurrentVideo(vid.id)}
                                className={`p-3 rounded-md cursor-pointer transition-all ${currentVideo === vid.id
                                    ? 'bg-primary/10 border-primary/50 border text-primary'
                                    : 'hover:bg-accent border border-transparent text-foreground'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <PlayCircle className={`h-5 w-5 ${currentVideo === vid.id ? 'fill-current' : ''}`} />
                                    <span className="text-sm font-medium">{vid.title}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
