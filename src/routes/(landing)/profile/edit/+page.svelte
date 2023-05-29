<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	import defaultUserImage from '$lib/assets/default-user.png';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;
	const { session, user } = data;

	let email = session?.user.email;
	let password = '';
	let confirmPassword = '';

	const aboutMaxLength = 500;

	let profileImage = defaultUserImage;

	$: if (user.about.length > aboutMaxLength) {
		user.about = user.about.slice(0, aboutMaxLength);
	}

	async function submit() {
		if (email !== session?.user.email || password !== '') {
			// TODO: update user info
		}
		await trpc($page).users.create.mutate(user);

		// all good, redirect to newly-created profile
		await goto(`/profile/${session?.user.id}`);
	}
</script>

<Container classes="space-y-8">
	<h1>My Profile</h1>
	<h2>Account Information</h2>
	<div class="space-y-4">
		<label>
			Email address
			<input name="firstName" class="input" type="text" bind:value={email} />
		</label>
		<h3>Change Password</h3>
		<div class="flex gap-4">
			<label>
				New Password
				<input name="lastName" class="input" type="password" bind:value={password} />
			</label>
			<label>
				Confirm new Password
				<input name="lastName" class="input" type="password" bind:value={confirmPassword} />
			</label>
		</div>
	</div>

	<h2>Basic Information</h2>
	<div class="space-y-4">
		<Avatar src={profileImage} width="w-32" rounded="rounded-full" />
		<label>
			First name
			<input name="firstName" class="input" type="text" bind:value={user.firstName} />
		</label>
		<label>
			Last name
			<input name="lastName" class="input" type="text" bind:value={user.lastName} />
		</label>
		<label>
			About
			<textarea name="about" class="textarea" bind:value={user.about} />
		</label>
	</div>

	<h2 class="my-8">Genre Preferences</h2>
	<div>
		<label hidden>
			Fictional genre preferences
			<input name="fictional" class="input" type="text" bind:value={user.fictional} />
		</label>
		<label hidden>
			Non-fictional genre preferences
			<input name="nonFictional" class="input" type="text" bind:value={user.nonFictional} />
		</label>
		<div class="space-y-4">
			<h3>Fiction</h3>
			<div class="flex flex-wrap gap-2">
				{#each Object.keys(user.fictional) as genre}
					<span
						class="chip {user.fictional[genre] ? 'variant-filled' : 'variant-soft'}"
						on:click={() => {
							user.fictional[genre] = !user.fictional[genre];
						}}
						on:keypress
					>
						<span>{genre}</span>
					</span>
				{/each}
			</div>
			<h3>Non-fiction</h3>
			<div class="flex flex-wrap gap-2">
				{#each Object.keys(user.nonFictional) as genre}
					<span
						class="chip {user.nonFictional[genre] ? 'variant-filled' : 'variant-soft'}"
						on:click={() => {
							user.nonFictional[genre] = !user.nonFictional[genre];
						}}
						on:keypress
					>
						<span>{genre}</span>
					</span>
				{/each}
			</div>
		</div>
	</div>

	<h2 class="my-8">User Role</h2>
	<div class="space-y-2">
		<label class="flex items-center space-x-2">
			<input
				name="userWriter"
				class="checkbox"
				type="checkbox"
				bind:checked={user.userWriterChecked}
			/>
			<p>Writer - I want to write content whether for myself or in collaboration with others.</p>
		</label>
		<label class="flex items-center space-x-2">
			<input
				name="userEditor"
				class="checkbox"
				type="checkbox"
				bind:checked={user.userEditorChecked}
			/>
			<p>Editor - I want to help other writers edit their work to uphold high standards.</p>
		</label>
		<label class="flex items-center space-x-2">
			<input
				name="userIllustrator"
				class="checkbox"
				type="checkbox"
				bind:checked={user.userIllustratorChecked}
			/>
			<p>Illustrator - I want to create illustrative content for written work by writers.</p>
		</label>
	</div>
	<h2 class="mt-8">Social Media</h2>
	<div class="space-y-2">
		<label>
			Facebook profile link
			<input name="facebook" class="input" type="text" bind:value={user.facebook} />
		</label>
		<label>
			Instagram handle
			<input name="instagram" class="input" type="text" bind:value={user.instagram} />
		</label>
		<label>
			Twitter handle
			<input name="twitter" class="input" type="text" bind:value={user.twitter} />
		</label>
	</div>
	<a class="btn variant-filled mt-8 mr-2" href={`/profile/${session?.user.id}`}>Cancel</a>
	<button class="btn variant-filled-primary mt-8" on:click={submit}>Update Profile</button>
</Container>
