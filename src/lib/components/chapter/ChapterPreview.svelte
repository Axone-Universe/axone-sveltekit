<script lang="ts">
	import { getModalStore, type ModalComponent, type ModalSettings } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { star } from 'svelte-awesome/icons';

	import type { ChapterProperties } from '$lib/properties/chapter';
	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import type { UserProperties } from '$lib/properties/user';
	import { unknown } from 'zod';
	import type { StorylineProperties } from '$lib/properties/storyline';

	export let chapter: HydratedDocument<ChapterProperties>;

	const modalStore = getModalStore();

	let user = chapter.user as UserProperties;
	let storyline = chapter.storyline as StorylineProperties;
	let didError = false;
</script>

<a
	href="/editor/{chapter.book}?mode=reader&storylineID={storyline._id}&chapterID={chapter._id}"
	target="_blank"
	type="button"
	class={`card card-hover group rounded-md overflow-hidden w-full aspect-[2/3] relative cursor-pointer text-left text-white ${
		didError || !storyline.imageURL ? '' : 'bg-[url(/tail-spin.svg)] bg-no-repeat bg-center'
	}`}
>
	<ImageWithFallback
		src={storyline.imageURL ?? ''}
		alt={chapter.title ?? 'Chapter Title'}
		bind:didError
	/>
	<div
		class="bg-black/40 absolute top-0 w-full h-full md:bg-black/0 md:hover:bg-black/40 duration-300"
	>
		<div
			class="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex flex-col justify-between duration-300 p-2"
		>
			<p class="whitespace-normal text-sm sm:text-base font-bold line-clamp-2">{chapter.title}</p>
			<p class="whitespace-normal text-sm italic">{`by ${user.firstName} ${user.lastName}`}</p>
		</div>
	</div>
	{#if storyline.numRatings > 0}
		<div
			class="overflow-hidden flex items-center absolute bottom-1 right-1 bg-white md:bg-black group-hover:bg-white py-1 px-2 space-x-1 rounded-full duration-300"
		>
			<Icon
				class="w-3 h-3 text-black md:text-white group-hover:text-black duration-300"
				data={star}
			/>
			<p
				class="text-xs font-bold line-clamp-1 text-black md:text-white group-hover:text-black duration-300"
			>
				{(storyline.cumulativeRating / storyline.numRatings).toFixed(1)}
			</p>
		</div>
	{/if}
</a>
