<script lang="ts">
	import { Avatar, Step, Stepper, FileButton, getToastStore } from '@skeletonlabs/skeleton';
	import type { ToastSettings } from '@skeletonlabs/skeleton';
	import defaultUserImage from '$lib/assets/default-user.png';
	import { USER_LABELS, type UserProperties } from '$lib/properties/user';
	import TextArea from '$lib/components/TextArea.svelte';
	import { GENRES } from '$lib/properties/genre';
	import { pencil as pencilIcon } from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { StorageBucketError, UploadFileToBucketParams } from '$lib/util/types';
	import { uploadImage } from '$lib/util/bucket/bucket';

	export let userProperties: UserProperties;
	export let onSubmit: any;
	export let supabase: SupabaseClient;

	let genres = userProperties.genres ?? [];
	let labels = userProperties.labels ?? [];

	const toastStore = getToastStore();

	const aboutMaxLength = 500;
	/**
	 * Toast settings
	 */
	const successUploadToast: ToastSettings = {
		message: 'Profile picture has been uploaded successfully',
		// Provide any utility or variant background style:
		background: 'variant-filled-success'
	};
	const progressUploadToast: ToastSettings = {
		message: 'Uploading profile picture...',
		// Provide any utility or variant background style:
		background: 'variant-filled-secondary',
		autohide: false
	};
	const errorUploadToast: ToastSettings = {
		message: 'There was an issue uploading the profile picture',
		// Provide any utility or variant background style:
		background: 'variant-filled-error'
	};

	let profileImage = defaultUserImage;

	async function submit() {
		userProperties.genres = genres;
		userProperties.labels = labels;
		onSubmit(userProperties);
	}

	/**
	 * The avatarFileSelected function is an asynchronous function that handles the selection of an avatar image file.
	 * It triggers a toast message to indicate the progress of the file upload, uploads the file to a specified bucket,
	 * and then triggers a success or error toast message based on the response. Finally, it updates the profile photo.
	 * @param event The event object that contains information about the file selection.
	 */
	async function avatarFileSelected(event: Event) {
		let newAvatarImage = (event.target as HTMLInputElement)?.files?.[0] as File;
		newAvatarImage = renameFile(newAvatarImage, 'profile');

		const bucketName = `profiles/${userProperties._id}`;

		const response = await uploadImage(supabase, bucketName, newAvatarImage, toastStore);

		if (response.error) {
			errorUploadToast.message = errorUploadToast.message + '. Reason: ' + response.error.message;
			toastStore.trigger(errorUploadToast);
		} else {
			userProperties.imageURL = response.url!;
			toastStore.trigger(successUploadToast);
		}
	}

	function renameFile(originalFile: File, newName: string) {
		const originalName = originalFile.name;
		newName = newName + '.' + originalName.split('.').pop();

		return new File([originalFile], newName, {
			type: originalFile.type,
			lastModified: originalFile.lastModified
		});
	}
</script>

<Stepper on:complete={submit}>
	<Step>
		<svelte:fragment slot="header">Basic Information</svelte:fragment>
		<div class="min-h-[calc(60vh)] space-y-4">
			<div class="flex flex-col items-center w-full">
				<div class="relative inline-block w-24 h-24">
					<FileButton
						on:change={avatarFileSelected}
						name="avatarFileButton"
						button=""
						class="badge-icon variant-filled-primary w-6 h-6 absolute -bottom-0 -right-0 z-10"
					>
						<Icon data={pencilIcon} />
					</FileButton>
					<Avatar src={userProperties.imageURL} width="w-24" rounded="rounded-full" />
				</div>
			</div>
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
			<div class="flex flex-wrap gap-2">
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
		<div class="min-h-[calc(60vh)] space-y-4">
			<div>
				You can have multiple roles as a user on the Axone platform. You are given the Reader role
				by default and you can have Writer, Editor, and Illustrator as additional roles. These roles
				are important for determining how we can provide you exposure should you be looking to
				collaborate on the platform.
			</div>
			<div class="flex justify-center">
				<div class="btn-group variant-filled w-fit">
					{#each USER_LABELS as userLabel}
						<button
							class={labels.includes(userLabel) ? 'variant-filled-primary' : 'variant-soft'}
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
					{/each}
				</div>
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
