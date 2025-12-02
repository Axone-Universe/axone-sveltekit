import { workflow } from '@novu/framework';
import { z } from 'zod';
import { renderNewCampaignEmail } from '$lib/services/notifications/novu/emails';
import { renderCampaignWinnersEmail } from '$lib/services/notifications/novu/emails';

// Schema for new campaign workflow payload
const newCampaignPayloadSchema = z.object({
	campaignId: z.string()
});

// Schema for campaign winners workflow payload
const campaignWinnersPayloadSchema = z.object({
	campaignId: z.string()
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

export const testWorkflow = workflow('test-workflow', async ({ step }) => {
	await step.email('test-email', async () => {
		return {
			subject: 'Test Email',
			body: 'This is a test email from Novu Framework!'
		};
	});
});
