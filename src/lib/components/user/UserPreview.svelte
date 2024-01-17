<script lang="ts">
	import type { UserProperties } from '$lib/properties/user';
	import { Avatar } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { user, book, edit, pencil } from 'svelte-awesome/icons';

	export let userData: UserProperties;

	let customClass = '';
	export { customClass as class };

	const userLabels = userData.labels as unknown as Record<string, boolean>;
</script>

<div
	class={`card p-2 card-hover group rounded-md overflow-hidden w-full aspect-[2/3] relative cursor-pointer text-left text-white ${customClass}`}
>
	<header class="h-2/6 flex flex-col items-center">
		<a href={'/profile/' + userData._id}>
			{#if userData.imageURL !== undefined}
				<Avatar src={userData.imageURL} width="w-32" rounded="rounded-full" />
			{:else}
				<button class="btn-icon bg-surface-900 w-32">
					<Icon data={user} scale={3} />
				</button>
			{/if}
		</a>
	</header>
	<div class="h-3/6 p-4 space-y-4 flex flex-col items-center">
		<h3 class="line-clamp-1">{userData.firstName} {userData.lastName}</h3>
		<article>
			<p class="opacity-75 line-clamp-4">
				<i>{userData.about}</i>
			</p>
		</article>
	</div>
	<hr class="opacity-50" />
	<footer class="h-1/6 p-4 flex justify-center items-center space-x-4">
		<div class="flex justify-center space-x-2">
			{#if userData.labels}
				{#each userData.labels as label}
					<div class="chip variant-filled">{label}</div>
				{/each}
			{/if}
		</div>
	</footer>
</div>
