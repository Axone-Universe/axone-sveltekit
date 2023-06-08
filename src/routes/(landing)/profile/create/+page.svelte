<script lang="ts">
	import { Avatar, Step, Stepper } from '@skeletonlabs/skeleton';

	import defaultUserImage from '$lib/assets/default-user.png';
	import Container from '$lib/components/Container.svelte';
	import type { CreateUser } from '$lib/util/types';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { GenresBuilder } from '$lib/util/genres';

	export let data: PageData;
	const { session } = data;

	const aboutMaxLength = 500;

	let profileImage = defaultUserImage;

	const genres = new GenresBuilder();

	const userInfo: CreateUser = {
		firstName: '',
		lastName: '',
		about: '',
		userWriterChecked: false,
		userEditorChecked: false,
		userIllustratorChecked: false,
		facebook: '',
		instagram: '',
		twitter: '',
		genres: genres.getGenres()
	};

	$: if (userInfo.about.length > aboutMaxLength) {
		userInfo.about = userInfo.about.slice(0, aboutMaxLength);
	}

	async function submit() {
		await trpc($page).users.create.mutate(userInfo);

		// all good, redirect to newly-created profile
		await goto(`/profile/${session?.user.id}`);
	}
</script>

<Container>
	<Stepper on:complete={submit}>
		<Step locked={userInfo.firstName.length === 0 || userInfo.lastName.length === 0}>
			<svelte:fragment slot="header">Basic Information</svelte:fragment>
			<Avatar src={profileImage} width="w-24" rounded="rounded-full" />
			<label>
				*First name
				<input class="input" type="text" bind:value={userInfo.firstName} />
				<!-- {#if firstNameError}<p class="text-error-500">First name is required.</p>{/if} -->
			</label>

			<label>
				*Last name
				<input class="input" type="text" bind:value={userInfo.lastName} />
				<!-- {#if lastNameError}<p class="text-error-500">Last name is required.</p>{/if} -->
			</label>

			<label>
				About
				<textarea class="textarea" bind:value={userInfo.about} />
			</label>
			<div class="text-sm">Characters left: {aboutMaxLength - userInfo.about.length}</div>
		</Step>
		<Step>
			<svelte:fragment slot="header">Genre Preferences</svelte:fragment>
			<div class="flex flex-wrap gap-2">
				{#each Object.keys(userInfo.genres) as genre}
					<span
						class="chip {userInfo.genres[genre] ? 'variant-filled' : 'variant-soft'}"
						on:click={() => {
							userInfo.genres[genre] = !userInfo.genres[genre];
						}}
						on:keypress
					>
						<span>{genre}</span>
					</span>
				{/each}
			</div>
		</Step>
		<Step>
			<svelte:fragment slot="header">User Role</svelte:fragment>
			<div>
				You can have multiple roles as a user on the Axone platform. You are given the Reader role
				by default and you can have Writer, Editor, and Illustrator as additional roles. These roles
				are important for determining how we can provide you exposure should you be looking to
				collaborate on the platform.
			</div>
			<label class="flex items-center space-x-2">
				<input class="checkbox" type="checkbox" bind:checked={userInfo.userWriterChecked} />
				<p>Writer - I want to write content whether for myself or in collaboration with others.</p>
			</label>
			<label class="flex items-center space-x-2">
				<input class="checkbox" type="checkbox" bind:checked={userInfo.userEditorChecked} />
				<p>Editor - I want to help other writers edit their work to uphold high standards.</p>
			</label>
			<label class="flex items-center space-x-2">
				<input class="checkbox" type="checkbox" bind:checked={userInfo.userIllustratorChecked} />
				<p>Illustrator - I want to create illustrative content for written work by writers.</p>
			</label>
		</Step>
		<Step>
			<svelte:fragment slot="header">Social Media</svelte:fragment>
			<label>
				Facebook profile link
				<input class="input" type="text" bind:value={userInfo.facebook} />
			</label>
			<label>
				Instagram handle
				<input class="input" type="text" bind:value={userInfo.instagram} />
			</label>
			<label>
				Twitter handle
				<input class="input" type="text" bind:value={userInfo.twitter} />
			</label>
		</Step>
	</Stepper>
</Container>
