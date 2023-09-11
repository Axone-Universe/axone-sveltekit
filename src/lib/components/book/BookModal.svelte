<script lang="ts">
	import type { BookProperties } from '$lib/properties/book';
	import { modalStore, Avatar } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome';
	import { close, user, star } from 'svelte-awesome/icons';
	import type { HydratedDocument } from 'mongoose';
	import type { UserProperties } from '$lib/properties/user';
	import ImageWithFallback from '../util/ImageWithFallback.svelte';

	export let bookData: HydratedDocument<BookProperties>;

	let customClass = '';
	const bookUser = bookData.user as HydratedDocument<UserProperties>;

	export { customClass as class };

	let closeModal = () => {
		modalStore.close();
	};
</script>

<div
	class={`card w-full sm:w-3/4 lg:w-1/2 grid grid-cols-1 md:grid-cols-2 p-4 gap-2 sm:gap-4 relative items-center ${customClass}`}
>
	<button
		class="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 btn-icon btn-icon-sm variant-filled"
		on:click={closeModal}
	>
		<Icon class="w-5 h-5" data={close} />
	</button>
	<ImageWithFallback
		src={bookData.imageURL}
		alt={bookData.title}
		additionalClasses="aspect-square sm:aspect-[2/3] w-full md:h-full rounded-md overflow-hidden"
	/>
	<div class="flex flex-col justify-between items-center gap-4 h-full">
		<header class="space-y-2 w-full">
			<p class="text-lg font-bold line-clamp-2">{bookData.title}</p>
			<div class="flex space-x-2 items-center">
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
			<div class="flex flex-wrap gap-2">
				{#if bookData.genres}
					{#each bookData.genres as genre}
						<div class="chip variant-filled py-0.5 px-1">{genre}</div>
					{/each}
				{/if}
			</div>
		</header>
		<div class="h-full">
			<hr class="opacity-50" />
			<p class="font-thin overflow-scroll my-2">
				{bookData.description}
			</p>
		</div>
		<div class="w-full flex flex-col gap-4 items-center">
			<hr class="opacity-50 min-w-full" />
			<footer class="btn-group variant-filled py-1 max-w-fit">
				<a on:click={closeModal} class="button" href="book/{bookData._id}">View</a>
				<a on:click={closeModal} class="button" href="/reader/{bookData._id}">Read</a>
				<button>+</button>
			</footer>
		</div>
	</div>
</div>
