import { workflow } from '@novu/framework';
import { z } from 'zod';
import { renderNewCampaignEmail } from '$lib/services/notifications/novu/emails';
import { renderCampaignWinnersEmail } from '$lib/services/notifications/novu/emails';
import { renderNewCommentEmail } from '$lib/services/notifications/novu/emails';
import { renderTransactionProcessedEmail } from '$lib/services/notifications/novu/emails';

// Schema for new campaign workflow payload
const newCampaignPayloadSchema = z.object({
	campaignId: z.string()
});

// Schema for campaign winners workflow payload
const campaignWinnersPayloadSchema = z.object({
	campaignId: z.string()
});

// Schema for new comment workflow payload
const newCommentPayloadSchema = z.object({
	chapterId: z.string(),
	commentId: z.string()
});

// Schema for transaction processed workflow payload
const transactionProcessedPayloadSchema = z.object({
	transactionId: z.string()
});

// Control schema for email step (allows customization of subject)
const emailControlSchema = z.object({
	subject: z.string().default('Campaign Notification')
});

/**
 * Workflow for sending new campaign notifications
 */
export const newCampaignWorkflow = workflow(
	'new-campaign',
	async ({ step, payload }) => {
		await step.email(
			'send-new-campaign-email',
			async (controls) => {
				const emailBody = await renderNewCampaignEmail({
					campaignId: payload.campaignId
				});

				return {
					subject: controls.subject,
					body: emailBody
				};
			},
			{
				controlSchema: emailControlSchema
			}
		);
	},
	{
		payloadSchema: newCampaignPayloadSchema
	}
);

/**
 * Workflow for sending campaign winners notifications
 */
export const campaignWinnersWorkflow = workflow(
	'campaign-winners',
	async ({ step, payload }) => {
		await step.email(
			'send-campaign-winners-email',
			async (controls) => {
				const emailBody = await renderCampaignWinnersEmail({
					campaignId: payload.campaignId
				});

				return {
					subject: controls.subject,
					body: emailBody
				};
			},
			{
				controlSchema: emailControlSchema
			}
		);
	},
	{
		payloadSchema: campaignWinnersPayloadSchema
	}
);

/**
 * Workflow for sending new comment notifications on chapters
 */
export const newCommentWorkflow = workflow(
	'new-comment',
	async ({ step, payload }) => {
		await step.email(
			'send-new-comment-email',
			async (controls) => {
				const emailBody = await renderNewCommentEmail({
					chapterId: payload.chapterId,
					commentId: payload.commentId
				});

				return {
					subject: controls.subject,
					body: emailBody
				};
			},
			{
				controlSchema: emailControlSchema
			}
		);
	},
	{
		payloadSchema: newCommentPayloadSchema
	}
);

/**
 * Workflow for sending transaction processed notifications
 * Handles withdrawal requests, transaction failures, and successful payments
 */
export const transactionProcessedWorkflow = workflow(
	'transaction-processed',
	async ({ step, payload }) => {
		await step.email(
			'send-transaction-processed-email',
			async (controls) => {
				const emailBody = await renderTransactionProcessedEmail({
					transactionId: payload.transactionId
				});

				return {
					subject: controls.subject,
					body: emailBody
				};
			},
			{
				controlSchema: emailControlSchema
			}
		);
	},
	{
		payloadSchema: transactionProcessedPayloadSchema
	}
);
