import {
	newCampaignWorkflow,
	campaignWinnersWorkflow,
	newCommentWorkflow,
	transactionProcessedWorkflow,
	testWorkflow
} from '$lib/services/notifications/novu/workflows';
import { serve, Client } from '@novu/framework/sveltekit';
import { NOVU_SECRET_KEY } from '$env/static/private';

// Initialize the Novu Framework client
// This client instance is used by the serve function to handle requests
const client = new Client({
	secretKey: process.env.NOVU_SECRET_KEY || NOVU_SECRET_KEY
});

// Use serve with the client instance
// The serve function uses this client internally to handle all requests (GET, POST, OPTIONS)
// The client manages workflow execution and communication with Novu services
export const { GET, POST, OPTIONS } = serve({
	workflows: [
		newCampaignWorkflow,
		campaignWinnersWorkflow,
		newCommentWorkflow,
		transactionProcessedWorkflow
	],
	client
});
