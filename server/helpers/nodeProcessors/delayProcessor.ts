// Delay Node Processor
// Pauses workflow for specified duration

import { DelayNode, ExecutionContext } from '../../shared/types/workflow.js';

export interface NodeProcessResult {
  nextNodeId: string | null;
  shouldPause: boolean;
  resumeAt?: Date;
  contextUpdates?: Partial<ExecutionContext>;
  error?: string;
}

/**
 * Process delay node - schedules workflow resume
 */
export async function processDelayNode(
  node: DelayNode,
  context: ExecutionContext
): Promise<NodeProcessResult> {
  const { delayType, delayValue, delayUntil, escalateTo } = node.config;

  let resumeAt: Date;

  switch (delayType) {
    case 'hours':
      if (!delayValue) throw new Error('Delay value required for hours type');
      resumeAt = new Date(Date.now() + delayValue * 60 * 60 * 1000);
      console.log(`    ⏳ Delaying ${delayValue} hours (resume at: ${resumeAt.toISOString()})`);
      break;

    case 'days':
      if (!delayValue) throw new Error('Delay value required for days type');
      resumeAt = new Date(Date.now() + delayValue * 24 * 60 * 60 * 1000);
      console.log(`    ⏳ Delaying ${delayValue} days (resume at: ${resumeAt.toISOString()})`);
      break;

    case 'until':
      if (!delayUntil) throw new Error('Delay until date required for until type');
      resumeAt = new Date(delayUntil);
      console.log(`    ⏳ Delaying until: ${resumeAt.toISOString()}`);
      break;

    default:
      throw new Error(`Unknown delay type: ${delayType}`);
  }

  // TODO: Schedule background job to resume workflow at resumeAt
  // For now, just pause with resume time

  return {
    nextNodeId: node.next || null,
    shouldPause: true,
    resumeAt
  };
}
