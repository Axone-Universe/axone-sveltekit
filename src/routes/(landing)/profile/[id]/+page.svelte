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
	const styles = {
		sectionCard: "w-full card variant-ghost-surface p-8 flex flex-col gap-8 mb-4",
	}

	const viewerIsUser = $page.params.id === data.session?.user.id;

	// TODO: get from bucket
	let profileImage = defaultUserImage;
</script>

<Container class="my-8 w-full flex justify-center pt-16">
	<Container class="ml-0 mr-0 basis-3/5">
		<section id="DetailsSection" class="${styles.sectionCard}">
			<div class="flex w-full justify-center">
				<Avatar src={profileImage} width="w-24 sm:w-32" rounded="rounded-full" />
			</div>
			<div class="flex w-full justify-center">
				<div>
					<h3 class="h3 flex items-center gap-2 mb-2">
						{userResponse.firstName}
						{userResponse.lastName}
						{#if viewerIsUser}
							<a href="/profile/edit"><Icon data={pencilIcon} /></a>
						{/if}
					</h3>
					<!-- user type labels -->
					<div class="flex gap-2 flex-wrap justify-center">
						{#if userResponse.labels}
							{#each userLabels ?? [] as label}
								<div class="chip variant-filled">{label}</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</section>
		<section id="AboutMeSection" class="${styles.sectionCard}">
			<h3 class="h3">About Me</h3>
			<p>
				{userResponse.about
						? userResponse.about
						: 'Apparently, this user is really boring and did not say anything for their About section.'}
			</p>
		</section>
	</Container>
	<Container class="ml-0 mr-0">
		<section id="StatsSection" class="${styles.sectionCard} flex-col justify-start">
			<h3 class="h3">Stats</h3>
			<p class="m-0 p-0">Books read: 1
				<br/>
				Books authored: 2
				<br/>
				Books illustrated: 0
			</p>
		</section>
		<section id="GenrePreferencesSection" class="${styles.sectionCard}">
			<h3 class="h3">Genre Preferences</h3>
			{#if userGenres}
				<div class="flex gap-2 flex-wrap">
					{#each userGenres as genre}
						<div class="chip variant-filled">{genre}</div>
					{/each}
				</div>
			{:else}
				<div class="chip variant-soft">None</div>
			{/if}
		</section>
		<section id="SocialMediaSection" class="${styles.sectionCard}">
			<h3 class="h3">Connect</h3>
			<ul>
				{#if userResponse.facebook}
					<li>
						<span class="mr-2">
							<Icon data={facebookIcon} scale={2} />
						</span>
						<span class="flex-auto">
							<a class="anchor" href="https://www.facebook.com/{userResponse.facebook}" target="_blank">
								{userResponse.facebook}
							</a>
						</span>
					</li>
				{/if}
				{#if userResponse.instagram}
					<li>
						<span class="mr-2">
							<Icon data={instagramIcon} scale={2} />
						</span>
						<span class="flex-auto">
							<a class="anchor" href="https://www.instagram.com/{userResponse.instagram}" target="_blank">
								{userResponse.instagram}
							</a>
						</span>
					</li>
				{/if}
				{#if userResponse.twitter}
					<li>
						<span class="mr-2">
							<Icon data={twitterIcon} scale={2} />
						</span>
						<span class="flex-auto">
							<a class="anchor" href="https://www.twitter.com/{userResponse.twitter}" target="_blank">
								{userResponse.twitter}
							</a>
						</span>
					</li>
				{/if}
			</ul>
		</section>
	</Container>
</Container>
