<script lang="ts">
	import type { UserProperties } from '$lib/properties/user';
	import { Avatar } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome';
	import { user, book, edit, pencil } from 'svelte-awesome/icons';

	export let userData: UserProperties;

	let customClass = '';
	export { customClass as class };

	const userLabels = userData.labels as unknown as Record<string, boolean>;
</script>

<div
	class={`card p-4 shadow-xl overflow-hidden max-w-[300px] text-token flex-[0_0_100%]  sm:flex-[0_0_50%] xl:flex-[0_0_33%] ${customClass}`}
>
	<header class="flex flex-col items-center">
		<a href="/profile/ee8f6cf3-9fac-4eaf-8a40-da68da8083c5">
			{#if userData.imageURL !== undefined}
				<Avatar src={userData.imageURL} width="w-32" rounded="rounded-full" />
			{:else}
				<div class="w-32 overflow-hidden rounded-full">
					<Icon class="bg-primary-500 p-4 w-32 h-32" data={user} scale={8} />
				</div>
			{/if}
		</a>
	</header>
	<div class="p-4 space-y-4 flex flex-col items-center">
		<h3 class="">{userData.firstName} {userData.lastName}</h3>
		<article>
			<p class="opacity-75 line-clamp-3">
				<i>{userData.about}</i>
			</p>
		</article>
	</div>
	<hr class="opacity-50" />
	<footer class="p-4 flex justify-center items-center space-x-4">
		<div class="flex justify-center space-x-2">
			{#if userData.labels}
				{#each userData.labels as label}
					<div class="chip variant-filled">{label}</div>
				{/each}
			{/if}
		</div>
	</footer>
</div>
