<script lang="ts">
	import type { CreateUser } from '$lib/util/types';
	import { Avatar } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome';
	import { user } from 'svelte-awesome/icons';

	export let userData: CreateUser;

	let customClass = '';
	export { customClass as class };
</script>

<div class={`card p-4 shadow-xl overflow-hidden max-w-[300px] text-token ${customClass}`}>
	<header class="flex flex-col items-center">
		{#if userData.imageUrl !== undefined}
			<Avatar src={userData.imageUrl} width="w-32" rounded="rounded-full" />
		{:else}
			<div class="w-32 overflow-hidden rounded-full">
				<Icon class="bg-primary-500 p-4 w-32 h-32" data={user} scale={8} />
			</div>
		{/if}
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
			<span class="chip bg-primary-500 hover:variant-filled"
				><i class="fa-solid fa-heart" /> <span>Author</span></span
			>
			<span class="chip bg-error-300 hover:error-filled"
				><i class="fa-solid fa-paperclip" /> <span>Editor</span></span
			>
			<span class="chip variant-soft hover:variant-filled"
				><i class="fa-solid fa-share" /> <span>Writer</span></span
			>
		</div>
	</footer>
</div>
