<script lang="ts">
	import { Avatar, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import {
		facebook as facebookIcon,
		instagram as instagramIcon,
		pencil as pencilIcon,
		twitter as twitterIcon
	} from 'svelte-awesome/icons';

	import Container from '$lib/components/Container.svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import DocumentsInfiniteScroll from '$lib/components/documents/DocumentsInfiniteScroll.svelte';

	export let data: PageData;
	export let { userData } = data;

	let tabSet: number = 0;

	const userGenres = userData.genres;
	const userLabels = userData.labels;

	const viewerIsUser = $page.params.id === data.session?.user.id;
</script>

<Container class="mx-2 md:mx-40 xl:mx-96 min-h-screen">
	<div
		class="bg-center bg-no-repeat bg-cover rounded-lg"
		style="background-image: url({userData.imageURL})"
	>
		<div
			class="bg-gradient-to-b from-transparent from-10%
			[.dark_&]:via-[rgba(var(--color-surface-900))] via-[rgba(var(--color-surface-50))] via-70%
			[.dark_&]:to-[rgba(var(--color-surface-900))] to-[rgba(var(--color-surface-50))]
			w-full space-x-4 h-full"
		>
			<div class="flex flex-col items-center w-full gap-4 px-16">
				<div class="relative inline-block mt-10">
					<Avatar src={userData.imageURL} rounded="rounded-full" class="w-24 sm:w-32" />
					{#if viewerIsUser}
						<span class="p-4 badge-icon z-10 bg-surface-100-800-token absolute -bottom-1 right-4">
							<a href="/profile/edit"><Icon data={pencilIcon} /></a>
						</span>
					{/if}
				</div>

				<h3 class="flex items-center gap-2">
					{userData.firstName}
					{userData.lastName}
				</h3>

				<div class="flex gap-2">
					<a
						href={userData.facebook}
						target="_blank"
						class="btn-icon variant-filled {userData.facebook
							? 'bg-surface-800-100-token'
							: 'bg-surface-300-600-token'}"
					>
						<Icon data={facebookIcon} scale={1} />
					</a>
					<a
						href={userData.instagram}
						target="_blank"
						class="btn-icon variant-filled {userData.instagram
							? 'bg-surface-800-100-token'
							: 'bg-surface-300-600-token'}"
					>
						<Icon data={instagramIcon} scale={1} />
					</a>
					<a
						href={userData.twitter}
						target="_blank"
						class="btn-icon variant-filled {userData.twitter
							? 'bg-surface-800-100-token'
							: 'bg-surface-300-600-token'}"
					>
						<Icon data={twitterIcon} scale={1} />
					</a>
				</div>

				<div>
					<p>
						{userData.about
							? userData.about
							: 'Apparently, this user is really boring and did not say anything for their About section.'}
					</p>
				</div>
				<div class="flex gap-2 flex-wrap">
					{#if userData.labels}
						{#each userLabels ?? [] as label}
							<div class="chip variant-filled">{label}</div>
						{/each}
					{/if}
				</div>

				<hr class="w-full m-2" />
			</div>

			{#if userGenres && userGenres.length > 0}
				<div class="flex flex-col w-full gap-4 px-20">
					<h4>Genres Interests</h4>
					<div class=" w-full">
						<div class="flex gap-2 flex-wrap">
							{#each userGenres as genre}
								<div class="chip variant-filled">{genre}</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="h-1/4 px-4 md:px-16 overflow-auto space-y-4 bg-surface-50-900-token">
		<div class="flex flex-col w-full gap-4 mt-5">
			<TabGroup>
				<Tab bind:group={tabSet} name="bookTab" value={0}>Books</Tab>
				<Tab bind:group={tabSet} name="storylinesTab" value={1}>Storylines</Tab>
				<Tab bind:group={tabSet} name="chaptersTab" value={2}>Chapters</Tab>
				<!-- Tab Panels --->
				<svelte:fragment slot="panel">
					{#if tabSet === 0}
						<DocumentsInfiniteScroll
							documentType="Book"
							userID={userData._id}
							gridStyle={'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'}
							limit={8}
						/>
					{:else if tabSet === 1}
						<DocumentsInfiniteScroll
							documentType="Storyline"
							userID={userData._id}
							gridStyle={'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'}
							limit={8}
						/>
					{:else if tabSet === 2}
						<DocumentsInfiniteScroll
							documentType="Chapter"
							userID={userData._id}
							gridStyle={'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'}
							limit={8}
						/>
					{/if}
				</svelte:fragment>
			</TabGroup>
		</div>
	</div>
</Container>
