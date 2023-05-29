<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome';
	import {
		facebook as facebookIcon,
		instagram as instagramIcon,
		pencil as pencilIcon,
		twitter as twitterIcon
	} from 'svelte-awesome/icons';

	import defaultUserImage from '$lib/assets/default-user.png';
	import Container from '$lib/components/Container.svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	export let data: PageData;
	export let { userNode } = data;

	const viewerIsUser = $page.params.id === data.session?.user.id;

	// TODO: get from bucket
	let profileImage = defaultUserImage;

	function userVariant(label: string) {
		switch (label) {
			case 'Writer':
				return 'variant-filled-primary';
			case 'Editor':
				return 'variant-filled-secondary';
			case 'Illustrator':
				return 'variant-filled-tertiary';
			default:
				return 'variant-filled';
		}
	}
</script>

<Container classes="my-8 w-full flex justify-center">
	<div class="card variant-ghost-surface p-8 max-w-2xl flex flex-col gap-8">
		<div class="flex flex-col sm:flex-row justify-between items-center w-full gap-8">
			<div class="flex gap-4 items-center mx-auto sm:mx-0">
				<Avatar src={profileImage} width="w-24 sm:w-32" rounded="rounded-full" />
				<div class="flex flex-col gap-1">
					<h3 class="flex items-center gap-2">
						{userNode?.properties.firstName}
						{userNode?.properties.lastName}
						{#if viewerIsUser}
							<a href="/profile/edit"><Icon data={pencilIcon} /></a>
						{/if}
					</h3>
					{#if userNode}
						<div class="flex gap-2 flex-wrap">
							{#each userNode.labels as label}
								{#if label !== 'User'}
									<div class={`chip ${userVariant(label)}`}>{label}</div>
								{/if}
							{/each}
						</div>
					{/if}
					<div class="flex gap-2">
						{#if userNode && userNode.properties.facebook}
							<Icon data={facebookIcon} scale={2} />
						{/if}
						{#if userNode && userNode.properties.instagram}
							<Icon data={instagramIcon} scale={2} />
						{/if}
						{#if userNode && userNode.properties.twitter}
							<Icon data={twitterIcon} scale={2} />
						{/if}
					</div>
				</div>
			</div>
			<div class="card p-4 flex flex-col w-full sm:w-fit">
				<p>Books read: 1</p>
				<p>Books authored: 2</p>
				<p>Books illustrated: 0</p>
			</div>
		</div>
		<hr class="w-full" />
		<div>
			<h2 class="mb-4">About</h2>
			<div class="card p-4">
				<p>
					{userNode?.properties.about
						? userNode?.properties.about
						: 'Apparently, this user is really boring and did not say anything for their About section.'}
				</p>
			</div>
		</div>
		<hr class="w-full" />
		<div>
			<h2 class="mb-4">Genre Preferences</h2>
			<div class="grid sm:grid-cols-2 gap-4 w-full">
				<div class="card p-4">
					<header class="text-xl pb-4 font-bold">Fictional</header>
					{#if userNode && userNode.properties.fictional}
						<div class="flex gap-2 flex-wrap">
							{#each userNode.properties.fictional as genre}
								<div class="chip variant-filled">{genre}</div>
							{/each}
						</div>
					{:else}
						<div class="chip variant-soft">None</div>
					{/if}
				</div>
				<div class="card p-4">
					<header class="text-xl pb-4 font-bold">Non-fictional</header>
					{#if userNode && userNode.properties.nonFictional}
						<div class="flex gap-2 flex-wrap">
							{#each userNode.properties.nonFictional as genre}
								<div class="chip variant-filled">{genre}</div>
							{/each}
						</div>
					{:else}
						<div class="chip variant-soft">None</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</Container>
