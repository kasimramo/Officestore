// Action Node Processor
// Executes automated actions (approve, reject, fulfill, create PR, etc.)

import { ActionNode, ExecutionContext, WorkflowActionType } from '../../shared/types/workflow.js';
import { db, sql } from '../../db/index.js';
import { logWorkflowHistory } from '../workflowEngine.js';

export interface NodeProcessResult {
  nextNodeId: string | null;
  shouldPause: boolean;
  resumeAt?: Date;
  contextUpdates?: Partial<ExecutionContext>;
  error?: string;
}

/**
 * Process action node - executes automated action
 */
export async function processActionNode(
  node: ActionNode,
  context: ExecutionContext
): Promise<NodeProcessResult> {
  const { action, reason, vendorId, status, metadata } = node.config;

  console.log(`    ⚡ Executing action: ${action}`);

  // Execute action based on type
  switch (action) {
    case WorkflowActionType.AUTO_APPROVE:
      await autoApproveRequest(context);
      break;

    case WorkflowActionType.AUTO_REJECT:
      await autoRejectRequest(context, reason);
      break;

    case WorkflowActionType.FULFILL_REQUEST:
      await fulfillRequest(context);
      break;

    case WorkflowActionType.CREATE_PR:
      await createPurchaseRequisition(context, vendorId);
      break;

    case WorkflowActionType.RESERVE_STOCK:
      await reserveStock(context);
      break;

    case WorkflowActionType.UPDATE_STATUS:
      await updateRequestStatus(context, status);
      break;

    default:
      throw new Error(`Unknown action type: ${action}`);
  }

  return {
    nextNodeId: node.next || null,
    shouldPause: false
  };
}

// ============================================================================
// ACTION IMPLEMENTATIONS
// ============================================================================

/**
 * Auto-approve a request
 */
async function autoApproveRequest(context: ExecutionContext): Promise<void> {
  if (!context.requestId) {
    throw new Error('Request ID is required for auto-approval');
  }

  const dbInstance = db();

  // Update request status to approved
  await dbInstance.execute(
    sql`UPDATE requests
        SET status = 'approved',
            approved_at = NOW(),
            approved_by = NULL,
            updated_at = NOW()
        WHERE id = ${context.requestId}`
  );

  console.log(`    ✅ Auto-approved request: ${context.requestId}`);
}

/**
 * Auto-reject a request with reason
 */
async function autoRejectRequest(context: ExecutionContext, reason?: string): Promise<void> {
  if (!context.requestId) {
    throw new Error('Request ID is required for auto-rejection');
  }

  const dbInstance = db();

  // Update request status to rejected with notes
  await dbInstance.execute(
    sql`UPDATE requests
        SET status = 'rejected',
            notes = COALESCE(notes || E'\n\n', '') || ${`Auto-rejected: ${reason || 'Workflow condition not met'}`},
            updated_at = NOW()
        WHERE id = ${context.requestId}`
  );

  console.log(`    ❌ Auto-rejected request: ${context.requestId} - ${reason}`);
}

/**
 * Fulfill a request (adjust stock and mark fulfilled)
 */
async function fulfillRequest(context: ExecutionContext): Promise<void> {
  if (!context.requestId) {
    throw new Error('Request ID is required for fulfillment');
  }

  const dbInstance = db();

  // Get request items
  const requestItems = await dbInstance.execute(
    sql`SELECT ri.*, ci.name as item_name
        FROM request_items ri
        JOIN catalogue_items ci ON ri.catalogue_item_id = ci.id
        WHERE ri.request_id = ${context.requestId}`
  );

  if (!requestItems || requestItems.length === 0) {
    throw new Error('No items found for request');
  }

  // Get request details for site/area
  const request = await dbInstance.execute(
    sql`SELECT site_id, area_id FROM requests WHERE id = ${context.requestId} LIMIT 1`
  );

  if (!request || request.length === 0) {
    throw new Error('Request not found');
  }

  const { site_id, area_id } = request[0] as any;

  // Adjust stock for each item
  for (const item of requestItems as any[]) {
    await dbInstance.execute(
      sql`UPDATE stock
          SET quantity = quantity - ${item.quantity},
              updated_at = NOW()
          WHERE catalogue_item_id = ${item.catalogue_item_id}
          AND site_id = ${site_id}
          AND area_id = ${area_id}`
    );
  }

  // Mark request as fulfilled
  await dbInstance.execute(
    sql`UPDATE requests
        SET status = 'fulfilled',
            fulfilled_at = NOW(),
            fulfilled_by = NULL,
            updated_at = NOW()
        WHERE id = ${context.requestId}`
  );

  console.log(`    📦 Fulfilled request: ${context.requestId} (${requestItems.length} items)`);
}

/**
 * Create purchase requisition for out-of-stock items
 */
async function createPurchaseRequisition(context: ExecutionContext, vendorId?: string): Promise<void> {
  if (!context.requestId) {
    throw new Error('Request ID is required for PR creation');
  }

  const dbInstance = db();

  // Get request items
  const requestItems = await dbInstance.execute(
    sql`SELECT ri.*, ci.name as item_name, ci.cost_per_unit, ci.supplier
        FROM request_items ri
        JOIN catalogue_items ci ON ri.catalogue_item_id = ci.id
        WHERE ri.request_id = ${context.requestId}`
  );

  if (!requestItems || requestItems.length === 0) {
    throw new Error('No items found for request');
  }

  // Calculate total cost
  let totalCost = 0;
  for (const item of requestItems as any[]) {
    const itemCost = parseFloat(item.cost_per_unit || '0') * parseInt(item.quantity || '0');
    totalCost += itemCost;
  }

  // Create PR record (simplified - in production, you'd have a purchase_requisitions table)
  // For now, we'll just update the request with procurement queue status
  await dbInstance.execute(
    sql`UPDATE requests
        SET status = 'procurement_queue',
            notes = COALESCE(notes || E'\n\n', '') || ${`PR Created - Total: $${totalCost.toFixed(2)}, Vendor: ${vendorId || 'TBD'}`},
            updated_at = NOW()
        WHERE id = ${context.requestId}`
  );

  console.log(`    📝 Created PR for request: ${context.requestId} (vendor: ${vendorId || 'TBD'}, cost: $${totalCost.toFixed(2)})`);
}

/**
 * Reserve stock for this request (prevent overselling)
 */
async function reserveStock(context: ExecutionContext): Promise<void> {
  if (!context.requestId) {
    throw new Error('Request ID is required for stock reservation');
  }

  const dbInstance = db();

  // Get request items
  const requestItems = await dbInstance.execute(
    sql`SELECT ri.*, ci.name as item_name
        FROM request_items ri
        JOIN catalogue_items ci ON ri.catalogue_item_id = ci.id
        WHERE ri.request_id = ${context.requestId}`
  );

  if (!requestItems || requestItems.length === 0) {
    throw new Error('No items found for request');
  }

  // Get request details for site/area
  const request = await dbInstance.execute(
    sql`SELECT site_id, area_id FROM requests WHERE id = ${context.requestId} LIMIT 1`
  );

  if (!request || request.length === 0) {
    throw new Error('Request not found');
  }

  const { site_id, area_id } = request[0] as any;

  // Check if we have enough stock for all items
  for (const item of requestItems as any[]) {
    const stock = await dbInstance.execute(
      sql`SELECT quantity FROM stock
          WHERE catalogue_item_id = ${item.catalogue_item_id}
          AND site_id = ${site_id}
          AND area_id = ${area_id}
          LIMIT 1`
    );

    if (!stock || stock.length === 0) {
      throw new Error(`No stock found for item: ${item.item_name}`);
    }

    const availableQty = parseInt((stock[0] as any).quantity || '0');
    const requestedQty = parseInt(item.quantity || '0');

    if (availableQty < requestedQty) {
      throw new Error(`Insufficient stock for ${item.item_name}: need ${requestedQty}, have ${availableQty}`);
    }
  }

  // Update request status to reserved
  await dbInstance.execute(
    sql`UPDATE requests
        SET status = 'reserved',
            updated_at = NOW()
        WHERE id = ${context.requestId}`
  );

  console.log(`    🔒 Reserved stock for request: ${context.requestId}`);
}

/**
 * Update request status to custom value
 */
async function updateRequestStatus(context: ExecutionContext, status?: string): Promise<void> {
  if (!context.requestId) {
    throw new Error('Request ID is required for status update');
  }

  if (!status) {
    throw new Error('Status value is required');
  }

  const dbInstance = db();

  await dbInstance.execute(
    sql`UPDATE requests
        SET status = ${status},
            updated_at = NOW()
        WHERE id = ${context.requestId}`
  );

  console.log(`    🔄 Updated request status to: ${status}`);
}
