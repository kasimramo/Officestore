// Integration Node Processor
// Calls external APIs and stores response in context

import { IntegrationNode, ExecutionContext } from '../../shared/types/workflow.js';

export interface NodeProcessResult {
  nextNodeId: string | null;
  shouldPause: boolean;
  resumeAt?: Date;
  contextUpdates?: Partial<ExecutionContext>;
  error?: string;
}

/**
 * Process integration node - calls external API
 */
export async function processIntegrationNode(
  node: IntegrationNode,
  context: ExecutionContext
): Promise<NodeProcessResult> {
  const { method, url, headers, body, responseKey, timeoutMs } = node.config;

  console.log(`    🔌 Calling external API: ${method} ${url}`);

  try {
    // Call external API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs || 10000);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();

    console.log(`    ✅ API call successful, storing in context.${responseKey}`);

    // Store response in context
    return {
      nextNodeId: node.next || null,
      shouldPause: false,
      contextUpdates: {
        [responseKey]: responseData
      }
    };
  } catch (error) {
    console.error(`    ❌ API call failed:`, error);
    throw error;
  }
}
