/**
 * Hook for subscribing to webhook events via SSE.
 * 
 * When a webhook is triggered on the backend, this hook receives the notification
 * and can trigger the workflow execution in the UI.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface WebhookNotification {
  session_id: string;
  path: string;
  method: string;
  payload: unknown;
  timestamp: number;
  binary_path: string | null;
}

interface UseWebhookEventsOptions {
  /** Called when a webhook is received */
  onWebhook?: (notification: WebhookNotification) => void;
  /** Whether to automatically connect */
  enabled?: boolean;
}

interface UseWebhookEventsReturn {
  /** Whether connected to the SSE stream */
  isConnected: boolean;
  /** Last received webhook notification */
  lastWebhook: WebhookNotification | null;
  /** Manually reconnect to the stream */
  reconnect: () => void;
  /** Disconnect from the stream */
  disconnect: () => void;
}

/**
 * Subscribe to webhook events for a project.
 * 
 * @param projectId - The project ID to subscribe to
 * @param options - Configuration options
 * @returns Connection state and controls
 */
export function useWebhookEvents(
  projectId: string | null,
  options: UseWebhookEventsOptions = {}
): UseWebhookEventsReturn {
  const { onWebhook, enabled = true } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastWebhook, setLastWebhook] = useState<WebhookNotification | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const onWebhookRef = useRef(onWebhook);
  
  // Keep callback ref updated
  useEffect(() => {
    onWebhookRef.current = onWebhook;
  }, [onWebhook]);
  
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  const connect = useCallback(() => {
    if (!projectId || !enabled) return;
    
    // Close existing connection
    disconnect();
    
    const url = `/api/projects/${projectId}/webhook-events`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    eventSource.addEventListener('connected', () => {
      setIsConnected(true);
      console.log('[WebhookEvents] Connected to webhook events for project:', projectId);
    });
    
    eventSource.addEventListener('webhook', (event) => {
      try {
        const notification: WebhookNotification = JSON.parse(event.data);
        console.log('[WebhookEvents] Received webhook:', notification);
        setLastWebhook(notification);
        onWebhookRef.current?.(notification);
      } catch (e) {
        console.error('[WebhookEvents] Failed to parse webhook notification:', e);
      }
    });
    
    eventSource.onerror = (error) => {
      console.error('[WebhookEvents] SSE error:', error);
      setIsConnected(false);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          connect();
        }
      }, 5000);
    };
  }, [projectId, enabled, disconnect]);
  
  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);
  
  // Connect when projectId changes or enabled changes
  useEffect(() => {
    if (enabled && projectId) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [projectId, enabled, connect, disconnect]);
  
  return {
    isConnected,
    lastWebhook,
    reconnect,
    disconnect,
  };
}
