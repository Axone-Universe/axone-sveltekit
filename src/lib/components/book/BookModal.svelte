<script lang="ts">
	import type { UserAuthoredBookResponse } from '$lib/nodes/user';
	import { Avatar } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome';
	import { user, star } from 'svelte-awesome/icons';

	export let bookData: UserAuthoredBookResponse;

	let customClass = '';
	export { customClass as class };
</script>

<div class={`bg-surface-100-800-token flex w-2/4 grid grid-cols-2 p-4 space-x-4 ${customClass}`}>
	<div class="">
		<img
			src={bookData.book.properties.imageURL}
			class="object-cover w-full aspect-[6/8]"
			alt="Post"
		/>
	</div>
	<div class="bg-initial overflow-hidden">
		<header>
			<div class="flex flex-col p-2 items-center">
				<p class="text-lg font-bold line-clamp-1">{bookData.book.properties.title}</p>
				<a href="/profile/{bookData.user.properties.id}" class="text-sm font-normal line-clamp-1">
					By {bookData.user.properties.firstName}
					{bookData.user.properties.lastName}
				</a>
			</div>
		</header>
		<div class="">
			<div class="space-x-2">
				{#if bookData.book.properties.genres !== undefined}
					{#each bookData.book.properties.genres as genre}
						<div class="chip variant-filled">{genre}</div>
					{/each}
				{/if}
			</div>
			<p class="text-lg font-thin line-clamp-1">{bookData.book.properties.description}</p>
		</div>
		<hr class="opacity-50" />
		<footer class="p-4 flex justify-start items-center space-x-4">
			{#if bookData.user.properties.imageURL !== undefined}
				<Avatar src={bookData.user.properties.imageURL} width="w-10" rounded="rounded-full" />
			{:else}
				<div class="overflow-hidden rounded-full">
					<Icon class="bg-primary-500 p-2 w-10 h-10" data={user} />
				</div>
			{/if}
			<div class="overflow-hidden flex-auto flex items-center">
				<p class="text-sm line-clamp-1">
					{bookData.user.properties.firstName}
					{bookData.user.properties.lastName}
				</p>
			</div>
			<div class="overflow-hidden flex-auto flex items-center">
				<Icon class="p-2" data={star} scale={2} />
				<p class="text-sm font-bold line-clamp-1">4.5</p>
			</div>
		</footer>
	</div>
</div>
