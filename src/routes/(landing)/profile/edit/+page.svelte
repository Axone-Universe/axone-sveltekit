<script lang="ts">
	import { Avatar, Step, Stepper } from '@skeletonlabs/skeleton';

	import defaultUserImage from '$lib/assets/default-user.png';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { onMount, beforeUpdate } from 'svelte';
	import { UserPropertyBuilder } from '$lib/shared/user';
	import type { UserProperties } from '$lib/shared/user';

	export let data: PageData;
	const { session, userResponse } = data;
	const aboutMaxLength = 500;

	const userPropertyBuilder = new UserPropertyBuilder();
	let genres = userResponse.genres as unknown as Record<string, boolean>;
	let labels = userResponse.labels as unknown as Record<string, boolean>;
	userResponse.about = userResponse.about ? userResponse.about : '';

	let email = session?.user.email;
	let password = '';
	let confirmPassword = '';

	let profileImage = defaultUserImage;

	$: remaining = aboutMaxLength - userResponse.about!.length;

	onMount(() => {
		genres = userResponse.genres as unknown as Record<string, boolean>;
		labels = userResponse.labels as unknown as Record<string, boolean>;
	});

	async function submit() {
		if (email !== session?.user.email || password !== '') {
			// TODO: update user info
		}

		await trpc($page).users.update.mutate(userResponse as UserProperties);

		// all good, redirect to newly-created profile
		await goto(`/profile/${session?.user.id}`);
	}
</script>

<Container class="mx-4  md:mx-40 xl:mx-96">
	<Stepper on:complete={submit}>
		<Step>
			<svelte:fragment slot="header">Basic Information</svelte:fragment>
			<Avatar src={profileImage} width="w-24" rounded="rounded-full" />
			<label>
				*First name
				<input class="input" type="text" bind:value={userResponse.firstName} />
				<!-- {#if firstNameError}<p class="text-error-500">First name is required.</p>{/if} -->
			</label>

			<label>
				*Last name
				<input class="input" type="text" bind:value={userResponse.lastName} />
				<!-- {#if lastNameError}<p class="text-error-500">Last name is required.</p>{/if} -->
			</label>

			<label>
				Email address
				<input name="firstName" class="input" type="text" bind:value={email} />
			</label>

			<label>
				About
				<textarea class="textarea" bind:value={userResponse.about} />
			</label>
			<div class="text-sm">Characters left: {remaining}</div>
		</Step>

		<Step>
			<svelte:fragment slot="header">Genre Preferences</svelte:fragment>
			<div class="flex flex-wrap gap-4 space-x-4">
				{#each Object.keys(genres) as genre}
					<span
						class="chip {genres[genre] ? 'variant-filled' : 'variant-soft'}"
						on:click={() => {
							genres[genre] = !genres[genre];
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
			<div class="flex-col items-center space-y-4">
				{#each Object.keys(labels) as label}
					<div>
						<span
							class="chip {labels[label] ? 'variant-filled' : 'variant-soft'}"
							on:click={() => {
								labels[label] = !labels[label];
							}}
							on:keypress
						>
							<span>{label}</span>
						</span>
					</div>
				{/each}
			</div>
		</Step>
		<Step>
			<svelte:fragment slot="header">Social Media</svelte:fragment>
			<label>
				Facebook profile link
				<input class="input" type="text" bind:value={userResponse.facebook} />
			</label>
			<label>
				Instagram handle
				<input class="input" type="text" bind:value={userResponse.instagram} />
			</label>
			<label>
				Twitter handle
				<input class="input" type="text" bind:value={userResponse.twitter} />
			</label>
		</Step>
	</Stepper>
</Container>
