import { novu } from '$lib/util/notifications/novu';

export interface TriggerNewCampaignWorkflowParams {
	campaignId: string;
}

export interface TriggerCampaignWinnersWorkflowParams {
	campaignId: string;
}

/**
 * Triggers the new campaign workflow for the 'general' topic
 * This function sends a notification to all subscribers of the 'general' topic
 */
export async function triggerNewCampaignWorkflow({ campaignId }: TriggerNewCampaignWorkflowParams) {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	try {
		await novu.trigger('new-campaign', {
			to: [{ type: 'Topic' as any, topicKey: 'general' }],
			payload: {
				campaignId
			}
		});
	} catch (e: unknown) {
		console.log('novu - trigger new campaign workflow error');
		console.log(e);
		throw e;
	}
}

/**
 * Triggers the campaign winners workflow for the 'general' topic
 * This function sends a notification to all subscribers of the 'general' topic
 */
export async function triggerCampaignWinnersWorkflow({
	campaignId
}: TriggerCampaignWinnersWorkflowParams) {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	try {
		await novu.trigger('campaign-winners', {
			to: [{ type: 'Topic' as any, topicKey: 'general' }],
			payload: {
				campaignId
			}
		});
	} catch (e: unknown) {
		console.log('novu - trigger campaign winners workflow error');
		console.log(e);
		throw e;
	}
}
