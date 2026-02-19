"use client";

import { useState, useEffect, useRef } from 'react';

export interface TestResult {
    status: 'pass' | 'fail' | 'ignored' | 'error' | 'no_tests' | 'running';
    output?: string;
    error?: string;
}

export function useAutonomousTesting() {
    const [testStatuses, setTestStatuses] = useState<Record<string, TestResult>>({});
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket("ws://localhost:8000/ws/tests");
            wsRef.current = ws;

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "test_result") {
                        setTestStatuses(prev => ({
                            ...prev,
                            [data.file_path]: data.result
                        }));
                    }
                } catch (e) {
                    console.error("Test Result Parse Error", e);
                }
            };

            ws.onclose = () => {
                setTimeout(connect, 3000);
            };
        };

        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const setRunning = (filePath: string) => {
        setTestStatuses(prev => ({
            ...prev,
            [filePath]: { status: 'running' }
        }));
    };

    return { testStatuses, setRunning };
}
