// Notification Node Processor
// Sends notifications via email, in-app, SMS, or Slack

import { NotificationNode, ExecutionContext, NotificationChannel } from '../../shared/types/workflow.js';

export interface NodeProcessResult {
  nextNodeId: string | null;
  shouldPause: boolean;
  resumeAt?: Date;
  contextUpdates?: Partial<ExecutionContext>;
  error?: string;
}

/**
 * Process notification node - sends notification and continues immediately
 */
export async function processNotificationNode(
  node: NotificationNode,
  context: ExecutionContext
): Promise<NodeProcessResult> {
  const { channel, sendTo, template, customMessage, metadata } = node.config;

  console.log(`    🔔 Sending ${channel} notification to: ${sendTo}`);

  // Resolve recipient
  const recipient = await resolveRecipient(sendTo, context);

  // Send notification based on channel
  switch (channel) {
    case NotificationChannel.EMAIL:
      await sendEmailNotification(recipient, template, context, customMessage);
      break;

    case NotificationChannel.IN_APP:
      await sendInAppNotification(recipient, template, context, customMessage);
      break;

    case NotificationChannel.SMS:
      await sendSmsNotification(recipient, template, context, customMessage);
      break;

    case NotificationChannel.SLACK:
      await sendSlackNotification(recipient, template, context, customMessage);
      break;

    default:
      throw new Error(`Unknown notification channel: ${channel}`);
  }

  return {
    nextNodeId: node.next || null,
    shouldPause: false
  };
}

// ============================================================================
// NOTIFICATION IMPLEMENTATIONS (Placeholders - will be implemented in Step 2.4)
// ============================================================================

async function resolveRecipient(sendTo: string, context: ExecutionContext): Promise<string> {
  // Parse recipient (role:uuid, user:uuid, or dynamic:requestor)
  const [targetType, targetValue] = sendTo.split(':');

  if (targetType === 'dynamic') {
    if (targetValue === 'requestor') {
      return context.requestData?.requestorId || '';
    }
    // Add more dynamic recipients as needed
  }

  return targetValue;
}

async function sendEmailNotification(
  recipient: string,
  template: string,
  context: ExecutionContext,
  customMessage?: string
): Promise<void> {
  // TODO: Send email using email service
  console.log(`    📧 Email sent to ${recipient} (template: ${template})`);
}

async function sendInAppNotification(
  recipient: string,
  template: string,
  context: ExecutionContext,
  customMessage?: string
): Promise<void> {
  // TODO: Create in-app notification record
  console.log(`    📱 In-app notification created for ${recipient}`);
}

async function sendSmsNotification(
  recipient: string,
  template: string,
  context: ExecutionContext,
  customMessage?: string
): Promise<void> {
  // TODO: Send SMS via SMS service (Twilio, etc.)
  console.log(`    📲 SMS sent to ${recipient}`);
}

async function sendSlackNotification(
  recipient: string,
  template: string,
  context: ExecutionContext,
  customMessage?: string
): Promise<void> {
  // TODO: Send to Slack via webhook
  console.log(`    💬 Slack notification sent to ${recipient}`);
}
