<script lang="ts">
	import { Avatar, Step, Stepper, FileButton, getToastStore } from '@skeletonlabs/skeleton';
	import type { ToastSettings } from '@skeletonlabs/skeleton';
	import defaultUserImage from '$lib/assets/default-user.png';
	import { USER_LABELS, type UserProperties, type UserLabel } from '$lib/properties/user';
	import TextArea from '$lib/components/TextArea.svelte';
	import { GENRES } from '$lib/properties/genre';
	import { pencil as pencilIcon, book, edit, paintBrush } from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { StorageBucketError, UploadFileToBucketParams } from '$lib/util/types';
	import { uploadImage } from '$lib/util/bucket/bucket';
	import UserFilter from '$lib/components/user/UserFilter.svelte';
	import type { HydratedDocument } from 'mongoose';

	export let userProperties: UserProperties;
	export let onSubmit: any;
	export let supabase: SupabaseClient;

	let genres = userProperties.genres ?? [];
	let labels: UserLabel[] = userProperties.labels?.length ? userProperties.labels : ['Reader'];
	let referralSource = userProperties.referralSource ?? '';
	let referralAboutSource = userProperties.referralAboutSource ?? '';
	let socialMediaSources = userProperties.referralSocialMediaSource ?? [];
	let referralUsers: { [key: string]: HydratedDocument<UserProperties> } = {};

	const toastStore = getToastStore();

	const REFERRAL_SOURCES = [
		"Cape Town Writers' Network",
		'Social Media',
		'Google Search',
		'Referral',
		'Other'
	] as const;

	const SOCIAL_MEDIA_OPTIONS = ['Instagram', 'LinkedIn', 'TikTok', 'Facebook'] as const;

	const ROLE_CONFIG: Record<string, { icon: any; description: string; disabled?: boolean }> = {
		Reader: {
			icon: book,
			description: 'Discover and enjoy stories from the community',
			disabled: true
		},
		Writer: {
			icon: edit,
			description: 'Create original stories and collaborate with others'
		},
		Illustrator: {
			icon: paintBrush,
			description: 'Bring stories to life with visual art'
		},
		Editor: {
			icon: pencilIcon,
			description: 'Help refine and polish written content'
		}
	};

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

		// Handle referralSource based on selection
		if (referralSource) {
			userProperties.referralSource = referralSource;
		}

		// Handle referralAboutSource - only set if "Other" is selected
		if (referralSource === 'Other' && referralAboutSource.trim()) {
			userProperties.referralAboutSource = referralAboutSource.trim();
		} else {
			userProperties.referralAboutSource = undefined;
		}

		// Handle referralSocialMediaSource - only set if "Social Media" is selected
		if (referralSource === 'Social Media') {
			userProperties.referralSocialMediaSource = socialMediaSources;
		} else {
			userProperties.referralSocialMediaSource = undefined;
		}

		// Handle referralUser - only set if "Referral" is selected
		if (referralSource !== 'Referral') {
			userProperties.referralUser = undefined;
		}

		console.log('UserProfileDetails submit:', {
			referralSource: userProperties.referralSource,
			referralAboutSource: userProperties.referralAboutSource,
			referralSocialMediaSource: userProperties.referralSocialMediaSource,
			referralUser: userProperties.referralUser
		});

		onSubmit(userProperties);
	}

	function onReferralUserSelect(event: any) {
		const userId = event.detail.value;
		if (userId && referralUsers[userId]) {
			userProperties.referralUser = userId;
		}
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

			<!-- User Role Section -->
			<div class="space-y-4 pt-4 border-t border-surface-300-600-token">
				<h3 class="text-lg font-semibold">User Role</h3>
				<p class="text-sm text-surface-600-300-token">
					Select the roles that best describe you. Reader role is selected by default, and you can
					choose additional roles to help us provide you with the right opportunities on the
					platform.
				</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each USER_LABELS as userLabel}
						{@const config = ROLE_CONFIG[userLabel]}
						<button
							type="button"
							disabled={config.disabled && labels.includes(userLabel)}
							class="card p-4 text-left transition-all duration-200 {labels.includes(userLabel)
								? 'variant-filled-primary ring-2 ring-primary-500'
								: 'variant-soft hover:variant-soft-primary'} {config.disabled &&
							labels.includes(userLabel)
								? 'opacity-75 cursor-not-allowed'
								: 'cursor-pointer'}"
							on:click={() => {
								if (config.disabled && labels.includes(userLabel)) return;
								const index = labels.indexOf(userLabel);
								if (index > -1) {
									labels = labels.filter((v) => v !== userLabel);
								} else {
									labels = [...labels, userLabel];
								}
							}}
						>
							<div class="flex items-start gap-3">
								<div
									class="w-10 h-10 rounded-lg flex items-center justify-center {labels.includes(
										userLabel
									)
										? 'bg-primary-500/20'
										: 'bg-surface-400-500-token/20'}"
								>
									<Icon data={config.icon} scale={1.2} />
								</div>
								<div class="flex-1">
									<h4 class="font-semibold mb-1">
										{userLabel}
										{#if config.disabled}
											<span class="text-xs opacity-70">(Default)</span>
										{/if}
									</h4>
									<p class="text-xs text-surface-600-300-token leading-relaxed">
										{config.description}
									</p>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Social Media Section -->
			<div class="space-y-4 pt-4 border-t border-surface-300-600-token">
				<h3 class="text-lg font-semibold">Social Media</h3>
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
		</div>
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
		<svelte:fragment slot="header">How Did You Hear About Us?</svelte:fragment>
		<div class="min-h-[calc(60vh)] space-y-6">
			<p class="text-surface-600-300-token">Help us understand how you discovered Axone Universe</p>

			<!-- Referral Source Selection -->
			<div class="space-y-4">
				<!-- svelte-ignore a11y-label-has-associated-control -->
				<label class="font-semibold">Select one option:</label>
				<div class="space-y-3">
					{#each REFERRAL_SOURCES as source}
						<label class="flex items-center space-x-3 cursor-pointer">
							<input
								type="radio"
								name="referralSource"
								value={source}
								bind:group={referralSource}
								class="radio"
							/>
							<span>{source}</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Social Media Options (shown when "Social Media" is selected) -->
			{#if referralSource === 'Social Media'}
				<div class="space-y-4 p-4 card variant-soft">
					<!-- svelte-ignore a11y-label-has-associated-control -->
					<label class="font-semibold">Which social media platform(s)?</label>
					<div class="flex flex-wrap gap-2">
						{#each SOCIAL_MEDIA_OPTIONS as platform}
							<button
								class="chip {socialMediaSources.includes(platform)
									? 'variant-filled-primary'
									: 'variant-soft'}"
								on:click={() => {
									const index = socialMediaSources.indexOf(platform);
									if (index > -1) {
										socialMediaSources = socialMediaSources.filter((v) => v !== platform);
									} else {
										socialMediaSources = [...socialMediaSources, platform];
									}
								}}
							>
								{platform}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Referral User Selection (shown when "Referral" is selected) -->
			{#if referralSource === 'Referral'}
				<div class="space-y-4 p-4 card variant-soft">
					<!-- svelte-ignore a11y-label-has-associated-control -->
					<label class="font-semibold">Who referred you?</label>
					<UserFilter onUserSelect={onReferralUserSelect} users={referralUsers} class="w-full" />
					{#if userProperties.referralUser && referralUsers[userProperties.referralUser]}
						<div class="flex items-center gap-2 text-sm">
							<span class="text-surface-600-300-token">Selected:</span>
							<span class="font-semibold">
								{referralUsers[userProperties.referralUser].firstName}
								{referralUsers[userProperties.referralUser].lastName}
							</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Other Option (shown when "Other" is selected) -->
			{#if referralSource === 'Other'}
				<div class="space-y-4 p-4 card variant-soft">
					<label>
						<span class="font-semibold">Please specify:</span>
						<input
							class="input mt-2"
							type="text"
							bind:value={referralAboutSource}
							placeholder="How did you hear about us?"
						/>
					</label>
				</div>
			{/if}
		</div>
	</Step>
</Stepper>
