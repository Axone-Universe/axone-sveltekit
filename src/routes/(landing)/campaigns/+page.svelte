<script lang="ts">
	import { format } from 'date-fns';

	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { Paginator } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';
	import { Icon } from 'svelte-awesome';
	import { plus as plusIcon } from 'svelte-awesome/icons';

	export let data: PageData;
	const { campaigns } = data;

	let paginatorSettings = {
		offset: 0, // page offset
		limit: 6, // current amount per page
		size: campaigns.length, // total number of items
		amounts: [6, 12, 24] // possible selectable amounts
	};

	$: paginatedCampaigns = campaigns.slice(
		paginatorSettings.offset * paginatorSettings.limit, // start
		paginatorSettings.offset * paginatorSettings.limit + paginatorSettings.limit // end
	);
</script>

<Container>
	<div class="flex justify-between items-center">
		<h1 class="my-8">Campaigns</h1>
		<a href={`${$page.url.pathname}/create`}><Icon data={plusIcon} scale={2} /></a>
	</div>
	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
		{#each paginatedCampaigns as campaign}
			<div class="card card-hover flex flex-col gap-4 overflow-hidden">
				<header>
					<img
						src={campaign.bannerURL}
						class="bg-black/50 w-full aspect-[21/9]"
						alt={`${campaign.title} banner`}
					/>
				</header>
				<div class="px-4 grow space-y-6 py-4">
					<div class="space-y-4">
						<div>
							<h3>{campaign.title}</h3>
							<p class="text-xs font-semibold">
								{format(new Date(campaign.dates[0].startDate), 'd MMM y')} - {format(
									new Date(campaign.dates[0].endDate),
									'd MMM y'
								)}
							</p>

							<a class="text-xs" href={campaign.organizer.link}>By {campaign.organizer.name}</a>
						</div>
						<div class="flex gap-2 flex-wrap">
							{#each campaign.tags as tag}
								<span class="chip variant-filled">{tag}</span>
							{/each}
						</div>
					</div>
					<hr class="w-full" />
					<div>
						<!-- <h4 class="mb-2">About</h4> -->
						<p class="italic text-sm">"{campaign.about}"</p>
					</div>
				</div>
				<footer class="card-footer">
					<a
						class="btn variant-filled-primary w-full"
						href={`${$page.url.pathname}/${campaign.id}`}
					>
						Learn more
					</a>
				</footer>
			</div>
		{/each}
	</div>
	<Paginator bind:settings={paginatorSettings} amountText="campaigns" />
</Container>
