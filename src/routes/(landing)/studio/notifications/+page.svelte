<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import EmailTemplatePreview from '$lib/components/notifications/EmailTemplatePreview.svelte';
	import NewCampaign from '$lib/components/notifications/email-templates/new-campaign.svelte';
	import CampaignWinners from '$lib/components/notifications/email-templates/campaign-winners.svelte';
	import { getModalStore, type ModalSettings, type ModalComponent } from '@skeletonlabs/skeleton';
	import { PUBLIC_DOMAIN_NAME } from '$env/static/public';
	import type { PageData } from './$types';

	export let data: PageData;

	const modalStore = getModalStore();

	const emailTemplates = [
		{
			name: 'New Campaign',
			component: NewCampaign,
			props: {
				campaignTitle: 'Sample Campaign: The Great Writing Challenge',
				campaignDescription:
					'Join us for an exciting writing challenge! This campaign is designed to inspire creativity and help writers develop their skills. Submit your best work and compete for amazing prizes.',
				startDate: 'March 1, 2025',
				endDate: 'March 31, 2025',
				criteria: [
					{ value: 'Minimum 5,000 words' },
					{ value: 'Original content only' },
					{ value: 'Must be submitted before deadline' },
					{ value: 'Follow all community guidelines' }
				],
				rewards: [
					{ value: 'First place: $1,000 cash prize' },
					{ value: 'Second place: $500 cash prize' },
					{ value: 'Third place: $250 cash prize' },
					{ value: 'Top 10: Featured publication opportunity' }
				],
				resources: [
					{ value: 'Writing style guide' },
					{ value: 'Submission template' },
					{ value: 'Community forum access' }
				],
				campaignUrl: `${PUBLIC_DOMAIN_NAME}/book/sample`,
				origin: PUBLIC_DOMAIN_NAME
			}
		},
		{
			name: 'Campaign Winners',
			component: CampaignWinners,
			props: {
				campaignTitle: 'Sample Campaign: The Great Writing Challenge',
				winners: [
					{
						firstName: 'John',
						lastName: 'Doe',
						email: 'john.doe@example.com',
						position: 1
					},
					{
						firstName: 'Jane',
						lastName: 'Smith',
						email: 'jane.smith@example.com',
						position: 2
					},
					{
						firstName: 'Bob',
						lastName: 'Johnson',
						email: 'bob.johnson@example.com',
						position: 3
					}
				],
				campaignUrl: `${PUBLIC_DOMAIN_NAME}/book/sample`,
				origin: PUBLIC_DOMAIN_NAME
			}
		}
	];

	function previewTemplate(template: (typeof emailTemplates)[0]) {
		const modalComponent: ModalComponent = {
			ref: EmailTemplatePreview,
			props: {
				component: template.component,
				props: template.props
			}
		};

		const modal: ModalSettings = {
			type: 'component',
			component: modalComponent,
			modalClasses: 'max-w-5xl max-h-[90vh] overflow-auto'
		};

		modalStore.trigger(modal);
	}
</script>

<Container class="w-full min-h-screen">
	<InfoHeader
		emoji="📧"
		heading="Email Templates"
		description="Preview email notification templates used in the platform."
	/>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
		{#each emailTemplates as template}
			<button
				class="card p-6 text-left hover:shadow-lg transition-shadow cursor-pointer"
				on:click={() => previewTemplate(template)}
			>
				<h3 class="text-xl font-semibold mb-2">{template.name}</h3>
				<p class="text-sm text-surface-600-300-token">
					Click to preview how this email template will appear to recipients.
				</p>
			</button>
		{/each}
	</div>
</Container>
