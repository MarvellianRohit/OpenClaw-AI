import { useState, useEffect, useRef } from 'react';
import { useNotification } from "@/components/NotificationContext";

export interface SystemStats {
    cpu_percent: number;
    memory_percent: number;
    memory_used_gb: string;
    gpu_active_cores: number; // Simulated
    gpu_load_percent: number; // calculated locally
    thermal_pressure: number;
    swap_used_mb: number;
    quality_score?: number; // Phase BU
    avg_complexity?: number;
}

export function useSystemVitals() {
    const { addNotification, removeNotification } = useNotification();
    const [stats, setStats] = useState<SystemStats>({
        cpu_percent: 0,
        memory_percent: 0,
        memory_used_gb: "0.00",
        gpu_active_cores: 0,
        gpu_load_percent: 0,
        thermal_pressure: 0,
        swap_used_mb: 0
    });
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            const ws = new WebSocket("ws://localhost:8000/ws/vitals");
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                removeNotification("vitals-error");
            };

            ws.onclose = () => {
                setIsConnected(false);
                addNotification({
                    id: "vitals-error",
                    message: "Hardware telemetry lost. Stats may be stale.",
                    type: "warning",
                    persistent: true
                });
                reconnectTimeout = setTimeout(connect, 3000);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Add gpu_load_percent estimation (e.g. active cores / 40 * 100)
                    // M3 Max has up to 40 GPU cores.
                    // If simulate returns 0-40, we map to 0-100%.
                    const load = Math.min(100, (data.gpu_active_cores / 40) * 100);

                    setStats({
                        ...data,
                        gpu_load_percent: load,
                        quality_score: data.quality_score,
                        avg_complexity: data.avg_complexity
                    });
                } catch (e) {
                    console.error("Vitals Parse Error", e);
                }
            };
        };

        connect();

        return () => {
            if (wsRef.current) wsRef.current.close();
            clearTimeout(reconnectTimeout);
        };
    }, []);

    return { stats, isConnected };
}
