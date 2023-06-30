<script lang="ts">
	import type { UserAuthoredBookResponse } from '$lib/nodes/user';
	import { modalStore, Avatar } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome';
	import { user, star } from 'svelte-awesome/icons';

	export let bookData: UserAuthoredBookResponse;

	let customClass = '';
	export { customClass as class };

	let closeModal = () => {
		modalStore.close();
	};
</script>

<div
	class={`bg-surface-100-800-token w-full md:w-3/4 lg:w-2/4 grid grid-cols-1 md:grid-cols-2 p-4 space-x-4 ${customClass}`}
>
	<div class="flex flex-col items-center">
		<img
			src={bookData.book.properties.imageURL}
			class="object-cover w-3/4 md:w-full aspect-[6/8]"
			alt="Post"
		/>
	</div>
	<div class="bg-initial overflow-hidden">
		<header class="p-2 space-y-4">
			<div class="flex flex-col p-2 items-center">
				<p class="text-lg font-bold line-clamp-1">{bookData.book.properties.title}</p>
			</div>
			<div class="flex flex-row space-x-2 items-center">
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
				<div class="overflow-hidden flex items-center">
					<Icon class="p-2" data={star} scale={2} />
					<p class="text-sm font-bold line-clamp-1">4.5</p>
				</div>
			</div>
			<div class="space-x-2 line-clamp-1">
				{#if bookData.book.properties.genres !== undefined}
					{#each bookData.book.properties.genres as genre}
						<div class="chip variant-filled">{genre}</div>
					{/each}
				{/if}
			</div>
		</header>
		<hr class="opacity-50" />
		<div>
			<div>
				<p class="text-lg font-thin line-clamp-3 md:line-clamp-5">
					{bookData.book.properties.description}
				</p>
			</div>
		</div>
		<hr class="opacity-50" />
		<footer class="p-4 flex flex-col items-center space-x-4">
			<div class="btn-group variant-filled">
				<a on:click={closeModal} class="button" href="book/{bookData.book.properties.id}">View</a>
				<a on:click={closeModal} class="button" href="#/">Read</a>
				<button>+</button>
			</div>
		</footer>
	</div>
</div>
