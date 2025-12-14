/**
 * useReprocessTaskStream Hook
 * Real-time reprocess task progress streaming via Server-Sent Events (SSE)
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from '../stores/auth-store';

export interface ReprocessTaskEvent {
    stage: ProcessingStage;
    message: string;
    progress_percentage: number;
    sheets_total: number;
    sheets_processed: number;
    elapsed_seconds: number;
    timestamp: string;
    error_details?: string;
    task_id?: string;
    result?: any;
}

export type ProcessingStage =
    | 'uploading'
    | 'extracting'
    | 'organizing_qr'
    | 'processing_sheets'
    | 'collecting_results'
    | 'generating_csv'
    | 'loading_database'
    | 'cleanup'
    | 'completed'
    | 'failed';

export interface ReprocessStreamState {
    events: ReprocessTaskEvent[];
    currentEvent: ReprocessTaskEvent | null;
    isConnected: boolean;
    isComplete: boolean;
    error: string | null;
}

export function useReprocessTaskStream(taskId: string | null) {
    const [state, setState] = useState<ReprocessStreamState>({
        events: [],
        currentEvent: null,
        isConnected: false,
        isComplete: false,
        error: null,
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const accessToken = useAuthStore((state) => state.accessToken);

    const addEvent = useCallback((event: ReprocessTaskEvent) => {
        setState((prev) => ({
            ...prev,
            events: [...prev.events, event],
            currentEvent: event,
        }));
    }, []);

    const connect = useCallback(async () => {
        if (!taskId || !accessToken) {
            console.warn('[SSE] Cannot connect: missing taskId or token');
            return;
        }

        // Cancel existing connection
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        console.log(`[SSE] Connecting to reprocess stream: ${taskId}`);

        const url = `${process.env.NEXT_PUBLIC_API_URL}/sheets/reprocess/${taskId}/stream`;

        try {
            await fetchEventSource(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                signal: abortController.signal,

                onopen: async (response) => {
                    if (response.ok) {
                        console.log('[SSE] Connection established');
                        setState((prev) => ({
                            ...prev,
                            isConnected: true,
                            error: null,
                        }));
                    } else if (response.status === 401) {
                        // Unauthorized - session expired, stop retrying
                        console.error('[SSE] Session expired (401). Please refresh the page.');
                        setState((prev) => ({
                            ...prev,
                            error: 'Session expired. Please refresh the page to continue.',
                            isConnected: false,
                        }));
                        abortController.abort();
                        throw new Error('Session expired');
                    } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        // Client error - don't retry
                        const errorText = await response.text();
                        console.error('[SSE] Client error:', response.status, errorText);
                        setState((prev) => ({
                            ...prev,
                            error: `Connection failed: ${response.statusText}`,
                            isConnected: false,
                        }));
                        throw new Error(`Connection failed: ${response.statusText}`);
                    }
                },

                onmessage: (event) => {
                    // Skip empty events
                    if (!event.data || event.data.trim() === '') {
                        console.log('[SSE] Received empty event, skipping');
                        return;
                    }

                    try {
                        const data: ReprocessTaskEvent = JSON.parse(event.data);

                        console.log(
                            `[SSE] Event type: ${event.event || 'message'}, Stage: ${data.stage}, Message: ${data.message}`
                        );

                        addEvent(data);

                        // Check if task is complete
                        if (event.event === 'complete' || data.stage === 'completed') {
                            console.log('[SSE] Task completed');
                            setState((prev) => ({
                                ...prev,
                                isComplete: true,
                                isConnected: false,
                            }));
                            abortController.abort();
                        } else if (event.event === 'error' || data.stage === 'failed') {
                            console.error('[SSE] Task failed:', data.error_details || data.message);
                            setState((prev) => ({
                                ...prev,
                                isComplete: true,
                                isConnected: false,
                                error: data.error_details || data.message,
                            }));
                            abortController.abort();
                        }
                    } catch (error) {
                        console.error('[SSE] Failed to parse event:', error, 'Data:', event.data);
                    }
                },

                onerror: (error) => {
                    console.error('[SSE] Connection error:', error);

                    // If we have a session expired error, don't retry
                    const currentState = state;
                    if (currentState.error?.includes('Session expired')) {
                        console.log('[SSE] Not retrying due to session expiry');
                        abortController.abort();
                        return;
                    }

                    setState((prev) => ({
                        ...prev,
                        isConnected: false,
                    }));
                    // Don't throw - let it retry for other errors
                },

                onclose: () => {
                    console.log('[SSE] Connection closed');
                    setState((prev) => ({
                        ...prev,
                        isConnected: false,
                    }));
                },
            });
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('[SSE] Connection aborted');
            } else {
                console.error('[SSE] Connection error:', error);
                setState((prev) => ({
                    ...prev,
                    isConnected: false,
                    error: error instanceof Error ? error.message : 'Connection failed',
                }));
            }
        }
    }, [taskId, accessToken, addEvent]);

    const disconnect = useCallback(() => {
        console.log('[SSE] Disconnecting');
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setState((prev) => ({
            ...prev,
            isConnected: false,
        }));
    }, []);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        if (taskId && !state.isComplete) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [taskId, state.isComplete]);

    return {
        ...state,
        connect,
        disconnect,
    };
}
