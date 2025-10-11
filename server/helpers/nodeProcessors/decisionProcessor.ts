// Decision Node Processor
// Evaluates conditions and determines next node based on true/false result

import { DecisionNode, ExecutionContext } from '../../shared/types/workflow.js';
import { evaluateCondition } from '../conditionEvaluator.js';

export interface NodeProcessResult {
  nextNodeId: string | null;
  shouldPause: boolean;
  resumeAt?: Date;
  contextUpdates?: Partial<ExecutionContext>;
  error?: string;
}

/**
 * Process decision node - evaluates condition and routes to true/false branch
 */
export async function processDecisionNode(
  node: DecisionNode,
  context: ExecutionContext
): Promise<NodeProcessResult> {
  const { condition, trueNodeId, falseNodeId } = node.config;

  // Evaluate condition using full condition evaluator
  const result = evaluateCondition(condition, context);

  console.log(`    📊 Condition "${condition}" evaluated to: ${result}`);

  // Determine next node based on result
  const nextNodeId = result ? trueNodeId : falseNodeId;

  if (!nextNodeId) {
    throw new Error(`Decision node ${node.id} missing ${result ? 'true' : 'false'} branch`);
  }

  return {
    nextNodeId,
    shouldPause: false
  };
}
