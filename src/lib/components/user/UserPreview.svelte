<script lang="ts">
	import type { UserProperties } from '$lib/properties/user';
	import { Avatar, getToastStore } from '@skeletonlabs/skeleton';
	import type { ToastSettings } from '@skeletonlabs/skeleton';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';

	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { user as userIcon, book, edit, pencil, star } from 'svelte-awesome/icons';

	export let user: UserProperties;
	export let currentUser: UserProperties | null = null;

	let customClass = '';
	export { customClass as class };

	const toastStore = getToastStore();
	const userLabels = user.labels as unknown as Record<string, boolean>;

	$: isAdmin = currentUser?.admin ?? false;

	async function toggleAmbassador() {
		if (!currentUser?._id) return;

		try {
			// We need to update the target user, not the current user
			// For now, this will update via the standard update route
			// Note: In production, you may want a dedicated admin route
			const response = await trpc($page).users.updateUserAsAdmin.mutate({
				userId: user._id,
				ambassador: !user.ambassador
			});

			if (response.success) {
				user.ambassador = !user.ambassador;
				const toast: ToastSettings = {
					message: `${user.firstName} ${
						user.ambassador ? 'promoted to' : 'removed from'
					} ambassador`,
					background: 'variant-filled-success'
				};
				toastStore.trigger(toast);
			}
		} catch (error) {
			const toast: ToastSettings = {
				message: 'Failed to update ambassador status',
				background: 'variant-filled-error'
			};
			toastStore.trigger(toast);
		}
	}
</script>

<div
	class={`card p-2 card-hover group rounded-md overflow-hidden w-full aspect-[2/3] relative cursor-pointer text-left text-white ${customClass}`}
>
	<!-- Ambassador Badge -->
	{#if user.ambassador}
		<div class="absolute top-2 left-2 z-10 badge variant-filled-warning">
			<Icon data={star} scale={0.8} />
			<span class="ml-1">Ambassador</span>
		</div>
	{/if}

	<!-- Admin Dropdown -->
	{#if isAdmin}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="absolute top-2 right-2 z-10" on:click|stopPropagation>
			<button
				class="btn btn-sm variant-filled-primary"
				on:click={toggleAmbassador}
				title={user.ambassador ? 'Remove Ambassador' : 'Make Ambassador'}
			>
				<Icon data={star} scale={0.8} />
			</button>
		</div>
	{/if}

	<header class="h-2/6 flex flex-col items-center">
		<a href={'/profile/' + user._id}>
			{#if user.imageURL !== undefined}
				<Avatar src={user.imageURL} width="w-20 md:w-32" rounded="rounded-full" />
			{:else}
				<button class="btn-icon bg-surface-900 w-20 md:w-32">
					<Icon data={userIcon} scale={3} />
				</button>
			{/if}
		</a>
	</header>
	<div class="h-3/6 p-1 md:p-4 space-y-4 flex flex-col items-center">
		<h3 class="line-clamp-1">{user.firstName} {user.lastName}</h3>
		<article>
			<p class="opacity-75 line-clamp-3 md:line-clamp-4">
				<i>{user.about}</i>
			</p>
		</article>
	</div>
	<hr class="opacity-50" />
	<footer class="h-1/6 p-4 flex justify-center items-center space-x-4">
		<div class="flex justify-center space-x-2">
			{#if user.labels}
				{#each user.labels as label}
					<div class="chip variant-filled">{label}</div>
				{/each}
			{/if}
		</div>
	</footer>
</div>
