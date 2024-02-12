<script lang="ts">
	import type { UserProperties } from '$lib/properties/user';
	import { Avatar } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { user as userIcon, book, edit, pencil } from 'svelte-awesome/icons';

	export let user: UserProperties;

	let customClass = '';
	export { customClass as class };

	const userLabels = user.labels as unknown as Record<string, boolean>;
</script>

<div
	class={`card p-2 card-hover group rounded-md overflow-hidden w-full aspect-[2/3] relative cursor-pointer text-left text-white ${customClass}`}
>
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
