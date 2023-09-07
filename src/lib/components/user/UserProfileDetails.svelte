<script lang="ts">
	import { Avatar, Step, Stepper } from '@skeletonlabs/skeleton';

	import defaultUserImage from '$lib/assets/default-user.png';
	import type { UserProperties } from '$lib/shared/user';
	import TextArea from '$lib/components/TextArea.svelte';

	export let userProperties: UserProperties;
	export let onSubmit: any;

	const genres = userProperties.genres as unknown as Record<string, boolean>;
	const labels = userProperties.labels as unknown as Record<string, boolean>;

	let profileImage = defaultUserImage;

	async function submit() {
		onSubmit(userProperties);
	}
</script>

<Stepper on:complete={submit}>
	<Step>
		<svelte:fragment slot="header">Basic Information</svelte:fragment>
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
			You can have multiple roles as a user on the Axone platform. You are given the Reader role by
			default and you can have Writer, Editor, and Illustrator as additional roles. These roles are
			important for determining how we can provide you exposure should you be looking to collaborate
			on the platform.
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
	</Step>
</Stepper>
