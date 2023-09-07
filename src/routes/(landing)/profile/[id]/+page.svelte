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
	export let { userResponse } = data;

	const userGenres = userResponse.genres;
	const userLabels = userResponse.labels;

	const viewerIsUser = $page.params.id === data.session?.user.id;

	// TODO: get from bucket
	let profileImage = defaultUserImage;
</script>

<Container class="my-8 w-full flex justify-center">
	<div class="card variant-ghost-surface p-8 max-w-2xl flex flex-col gap-8">
		<div class="flex flex-col sm:flex-row justify-between items-center w-full gap-8">
			<div class="flex gap-4 items-center mx-auto sm:mx-0">
				<Avatar src={profileImage} width="w-24 sm:w-32" rounded="rounded-full" />
				<div class="flex flex-col gap-1">
					<h3 class="flex items-center gap-2">
						{userResponse.firstName}
						{userResponse.lastName}
						{#if viewerIsUser}
							<a href="/profile/edit"><Icon data={pencilIcon} /></a>
						{/if}
					</h3>
					<div class="flex gap-2 flex-wrap">
						{#if userResponse.labels}
							{#each userLabels ?? [] as label}
								<div class="chip variant-filled">{label}</div>
							{/each}
						{/if}
					</div>
					<div class="flex gap-2">
						{#if userResponse.facebook}
							<Icon data={facebookIcon} scale={2} />
						{/if}
						{#if userResponse.instagram}
							<Icon data={instagramIcon} scale={2} />
						{/if}
						{#if userResponse.twitter}
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
					{userResponse.about
						? userResponse.about
						: 'Apparently, this user is really boring and did not say anything for their About section.'}
				</p>
			</div>
		</div>
		<hr class="w-full" />
		<div>
			<h2 class="mb-4">Genre Preferences</h2>
			<div class="gap-4 w-full">
				<div class="card p-4">
					{#if userGenres}
						<div class="flex gap-2 flex-wrap">
							{#each userGenres as genre}
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
