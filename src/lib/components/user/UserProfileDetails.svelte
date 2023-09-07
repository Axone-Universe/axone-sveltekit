<script lang="ts">
	import { Avatar, Step, Stepper } from '@skeletonlabs/skeleton';

	import defaultUserImage from '$lib/assets/default-user.png';
	import { USER_LABELS, type UserProperties } from '$lib/shared/user';
	import TextArea from '$lib/components/TextArea.svelte';
	import { GENRES } from '$lib/shared/genre';

	export let userProperties: UserProperties;
	export let onSubmit: any;

	let genres = userProperties.genres ?? [];
	let labels = userProperties.labels ?? [];

	const aboutMaxLength = 500;

	let profileImage = defaultUserImage;

	async function submit() {
		userProperties.genres = genres;
		userProperties.labels = labels;
		onSubmit(userProperties);
	}
</script>

<Stepper on:complete={submit}>
	<Step>
		<svelte:fragment slot="header">Basic Information</svelte:fragment>
		<div class="min-h-[calc(60vh)]">
			<Avatar src={profileImage} width="w-24" rounded="rounded-full" />
			<label>
				*First name
				<input class="input" type="text" bind:value={userProperties.firstName} />
				<!-- {#if firstNameError}<p class="text-error-500">First name is required.</p>{/if} -->
			</label>

			<label>
				*Last name
				<input class="input" type="text" bind:value={userProperties.lastName} />
				<!-- {#if lastNameError}<p class="text-error-500">Last name is required.</p>{/if} -->
			</label>

			<label>
				Email address
				<input
					name="firstName"
					class="input"
					type="text"
					bind:value={userProperties.email}
					disabled
				/>
			</label>
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label>
				About
				<TextArea maxLength={500} bind:textContent={userProperties.about} />
			</label>
		</div>
		<!-- svelte-ignore a11y-label-has-associated-control -->
	</Step>

	<Step>
		<svelte:fragment slot="header">Genre Preferences</svelte:fragment>
		<div class="min-h-[calc(60vh)]">
			<div class="flex flex-wrap gap-4 space-x-4">
				{#each GENRES as genre}
					<button
						class="chip {genres.includes(genre) ? 'variant-filled' : 'variant-soft'}"
						on:click={() => {
							const index = genres.indexOf(genre);
							if (index > -1) {
								genres = genres.filter((v) => v !== genre);
							} else {
								genres = [...genres, genre];
							}
						}}
					>
						{genre}
					</button>
				{/each}
			</div>
		</div>
	</Step>
	<Step>
		<svelte:fragment slot="header">User Role</svelte:fragment>
		<div class="min-h-[calc(60vh)]">
			<div>
				You can have multiple roles as a user on the Axone platform. You are given the Reader role
				by default and you can have Writer, Editor, and Illustrator as additional roles. These roles
				are important for determining how we can provide you exposure should you be looking to
				collaborate on the platform.
			</div>
			<div class="flex-col items-center space-y-4">
				{#each USER_LABELS as userLabel}
					<div>
						<button
							class="chip {labels.includes(userLabel) ? 'variant-filled' : 'variant-soft'}"
							on:click={() => {
								const index = labels.indexOf(userLabel);
								if (index > -1) {
									labels = labels.filter((v) => v !== userLabel);
								} else {
									labels = [...labels, userLabel];
								}
							}}
							on:keypress
						>
							{userLabel}
						</button>
					</div>
				{/each}
			</div>
		</div>
	</Step>
	<Step>
		<svelte:fragment slot="header">Social Media</svelte:fragment>
		<div class="min-h-[calc(60vh)]">
			<label>
				Facebook profile link
				<input class="input" type="text" bind:value={userProperties.facebook} />
			</label>
			<label>
				Instagram handle
				<input class="input" type="text" bind:value={userProperties.instagram} />
			</label>
			<label>
				Twitter handle
				<input class="input" type="text" bind:value={userProperties.twitter} />
			</label>
		</div>
	</Step>
</Stepper>
