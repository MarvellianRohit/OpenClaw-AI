import { useState, useRef, useEffect, useCallback } from "react";
import { useNotification } from "@/components/NotificationContext";

const RECONNECT_INTERVAL = 3000;

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

type ConnectionStatus = "connecting" | "open" | "closed" | "error";

export function useOpenClawStream() {
    const { addNotification, removeNotification } = useNotification();
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentStream, setCurrentStream] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [thoughtTrace, setThoughtTrace] = useState<any>(null);
    const [thoughtStatus, setThoughtStatus] = useState<"idle" | "thinking" | "planned">("idle");

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const streamRef = useRef("");

    const connect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        setStatus("connecting");
        const ws = new WebSocket("ws://localhost:8000/ws/chat");
        wsRef.current = ws;
        setSocket(ws);

        ws.onopen = () => {
            setStatus("open");
            setStatusMessage("Ready");
            console.log("✅ WebSocket Connected");
            removeNotification("chat-error");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.status) {
                    setStatusMessage(data.status);
                } else if (data.chunk) {
                    setStatusMessage((prev) => prev.includes("Compiling") ? prev : "Streaming...");
                    streamRef.current += data.chunk;
                    setCurrentStream(streamRef.current);
                } else if (data.type === "thought") {
                    setThoughtStatus(data.status);
                    if (data.trace) setThoughtTrace(data.trace);
                } else if (data.done) {
                    setIsProcessing(false);
                    setStatusMessage("");

                    if (streamRef.current.trim()) {
                        setMessages((prev) => [
                            ...prev,
                            {
                                id: Date.now().toString(),
                                role: "assistant",
                                content: streamRef.current,
                                timestamp: Date.now(),
                            },
                        ]);
                    }
                    streamRef.current = "";
                    setCurrentStream("");
                } else if (data.error) {
                    console.error("Server Error:", data.error);
                    setIsProcessing(false);
                    setStatusMessage("Error: " + data.error);
                }
            } catch (e) {
                console.error("JSON Parse Error:", e);
            }
        };

        ws.onclose = () => {
            setStatus("closed");
            console.log("❌ WebSocket Disconnected");

            addNotification({
                id: "chat-error",
                message: "Chat connection lost. M3 Max Backend may be offline.",
                type: "error",
                persistent: true,
                actionLabel: "RETRY NOW",
                onAction: connect
            } as any);

            reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL);
        };

        ws.onerror = (error) => {
            console.error("⚠️ WebSocket Error:", error);
            setStatus("error");
            setStatusMessage("Connection Error");

            addNotification({
                message: "Critical WebSocket error detected in Chat Stream.",
                type: "error",
                persistent: false
            });
        };
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connect]);

    const sendMessage = useCallback((content: string, activeFile?: string | null) => {
        if (!content.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsProcessing(true);
        setStatusMessage("Sending...");

        streamRef.current = "";
        setCurrentStream("");

        wsRef.current.send(JSON.stringify({
            message: content,
            active_file: activeFile
        }));
    }, []);

    const sendAction = useCallback((action: any) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error("WS not open for action");
            return;
        }
        wsRef.current.send(JSON.stringify(action));
    }, []);

    const simulateStream = useCallback((chunk: string, done: boolean = false) => {
        setIsProcessing(true);
        setStatusMessage("Simulating...");

        if (done) {
            setIsProcessing(false);
            setStatusMessage("");
            if (streamRef.current.trim()) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: streamRef.current,
                        timestamp: Date.now(),
                    },
                ]);
            }
            streamRef.current = "";
            setCurrentStream("");
        } else {
            streamRef.current += chunk;
            setCurrentStream(streamRef.current);
        }
    }, []);

    return {
        messages,
        setMessages,
        sendMessage,
        sendAction,
        simulateStream,
        isProcessing,
        currentStream,
        connectionStatus: status,
        statusMessage,
        socket,
        thoughtTrace,
        thoughtStatus
    };
}
