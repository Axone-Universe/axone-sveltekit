<script lang="ts">
	import { Avatar, getModalStore } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { close, user, star } from 'svelte-awesome/icons';
	import type { HydratedDocument } from 'mongoose';
	import type { UserProperties } from '$lib/properties/user';
	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import type { BookProperties } from '$lib/properties/book';

	export let storylineData: HydratedDocument<StorylineProperties>;
	let customClass = '';
	export { customClass as class };
	export let showEdit: false;

	const modalStore = getModalStore();

	let book = storylineData.book as BookProperties;
	const bookUser = storylineData.user as HydratedDocument<UserProperties>;

	const closeModal = (bool: boolean) => {
		$modalStore[0].response!(bool);
		modalStore.close();
	};
</script>

<div
	class={`card w-modal grid grid-cols-1 md:grid-cols-2 p-4 gap-2 sm:gap-4 relative items-center ${customClass}`}
>
	<button
		class="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 btn-icon btn-icon-sm variant-filled"
		on:click={() => closeModal(false)}
	>
		<Icon class="w-5 h-5" data={close} />
	</button>
	<div class="aspect-square sm:aspect-[2/3] w-full md:h-full rounded-md overflow-hidden relative">
		<ImageWithFallback
			src={storylineData.imageURL ?? ''}
			alt={storylineData.title ?? 'Storyline Title'}
		/>
		{#if book.campaign && storylineData.main}
			<div
				class="overflow-hidden flex items-center absolute top-2 right-2 bg-white md:bg-orange-700 group-hover:bg-white py-1 px-2 space-x-1 rounded-full duration-300"
			>
				<p
					class="text-xs font-bold line-clamp-1 text-orange-700 md:text-white group-hover:text-orange-700 duration-300"
				>
					campaign
				</p>
			</div>
		{/if}
	</div>

	<div class="flex flex-col justify-between items-center gap-4 h-full">
		<header class="space-y-2">
			<p class="text-lg font-bold line-clamp-2">{storylineData.title}</p>
			{#if !storylineData.main}
				<p class="text-xs">A storyline of {book.title}</p>
			{/if}
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
				{#if storylineData.numRatings > 0}
					<div class="overflow-hidden flex items-center">
						<Icon class="p-2" data={star} scale={2} />
						<p class="text-sm font-bold line-clamp-1">
							{(storylineData.cumulativeRating / storylineData.numRatings).toFixed(1)}
						</p>
					</div>
				{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				{#if storylineData.genres}
					{#each storylineData.genres as genre}
						<div class="chip variant-filled py-0.5 px-1">{genre}</div>
					{/each}
				{/if}
			</div>
		</header>
		<div class="h-48">
			<hr class="opacity-50" />
			<p class="font-thin overflow-y-auto my-2 h-full">
				{storylineData.description}
			</p>
		</div>
		<div class="w-full flex flex-col gap-4 items-center px-4">
			<hr class="opacity-50 min-w-full" />
			<footer class="btn-group variant-filled py-1 max-w-fit">
				<a
					on:click={() => closeModal(false)}
					href="/book/{book._id}?storylineID={storylineData._id}">View</a
				>
				{#if storylineData.chapters && storylineData.chapters.length > 0}
					<a
						on:click={() => closeModal(false)}
						href="/editor/{book._id}?mode=reader&storylineID={storylineData._id}"
					>
						Read
					</a>
				{/if}
				{#if showEdit}
					<a
						on:click={() => closeModal(false)}
						href="/editor/{book._id}?mode=writer&storylineID={storylineData._id}"
					>
						Edit
					</a>
				{/if}
			</footer>
		</div>
	</div>
</div>
