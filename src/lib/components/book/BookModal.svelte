<script lang="ts">
	import type { BookProperties } from '$lib/shared/book';
	import { modalStore, Avatar } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome';
	import { close, user, star } from 'svelte-awesome/icons';
	import type { HydratedDocument } from 'mongoose';
	import type { UserProperties } from '$lib/shared/user';
	import ImageWithFallback from '../util/ImageWithFallback.svelte';

	export let bookData: HydratedDocument<BookProperties>;

	let customClass = '';
	const bookUser = bookData.user as HydratedDocument<UserProperties>;
	const bookGenres = bookData.genres as unknown as Record<string, boolean>;

	export { customClass as class };

	let closeModal = () => {
		modalStore.close();
	};
</script>

<div
	class={`card w-full md:w-3/4 lg:w-2/4 grid grid-cols-1 md:grid-cols-2 p-4 gap-2 sm:gap-4 relative ${customClass}`}
>
	<button class="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 btn-icon btn-icon-sm variant-filled" on:click={closeModal}>
		<Icon class="w-5 h-5" data={close} />
	</button>
	<div class="rounded-md overflow-hidden">
		<ImageWithFallback
			src={bookData.imageURL}
			alt={bookData.title}
			additionalClasses="aspect-square w-full"
		/>
	</div>
	<div class="bg-initial overflow-hidden">
		<header class="p-2 space-y-4">
			<p class="text-lg font-bold line-clamp-2">{bookData.title}</p>
			<div class="flex flex-row space-x-2 items-center">
				{#if bookUser.imageURL !== undefined}
					<Avatar src={bookUser.imageURL} width="w-10" rounded="rounded-full" />
				{:else}
					<div class="overflow-hidden rounded-full">
						<Icon class="bg-primary-500 p-2 w-10 h-10" data={user} />
					</div>
				{/if}
				<div class="overflow-hidden flex-auto flex items-center">
					<p class="text-sm line-clamp-1">
						{bookUser.firstName}
						{bookUser.lastName}
					</p>
				</div>
				<div class="overflow-hidden flex items-center">
					<Icon class="p-2" data={star} scale={2} />
					<p class="text-sm font-bold line-clamp-1">4.5</p>
				</div>
			</div>
			<div class="space-x-2 line-clamp-1">
				{#if bookData.genres !== undefined}
					{#each Object.keys(bookGenres) as genre}
						{#if bookGenres[genre]}
							<div class="chip variant-filled">{genre}</div>
						{/if}
					{/each}
				{/if}
			</div>
		</header>
		<hr class="opacity-50" />
		<div>
			<div>
				<p class="text-lg font-thin line-clamp-3 md:line-clamp-5">
					{bookData.description}
				</p>
			</div>
		</div>
		<hr class="opacity-50" />
		<footer class="p-4 flex flex-col items-center space-x-4">
			<div class="btn-group variant-filled">
				<a on:click={closeModal} class="button" href="book/{bookData._id}">View</a>
				<a on:click={closeModal} class="button" href="/reader/{bookData._id}">Read</a>
				<button>+</button>
			</div>
		</footer>
	</div>
</div>
