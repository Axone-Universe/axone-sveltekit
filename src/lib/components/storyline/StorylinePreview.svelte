<script lang="ts">
	import { type ModalComponent, type ModalSettings, getModalStore } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import { Icon } from 'svelte-awesome';
	import { star } from 'svelte-awesome/icons';

	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import type { UserProperties } from '$lib/properties/user';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import StorylineModal from './StorylineModal.svelte';
	import { createEventDispatcher } from 'svelte';

	export let storyline: HydratedDocument<StorylineProperties>;
	export let dispatchEvent: boolean = false;

	export let addToReadingList:
		| undefined
		| ((names: string[], storylineID: string) => Promise<void>) = undefined;
	export let user: HydratedDocument<UserProperties> | undefined;

	const modalStore = getModalStore();

	let storylineUser = storyline.user as UserProperties;

	let didError = false;

	const modalComponent: ModalComponent = {
		ref: StorylineModal,
		props: { storylineData: storyline, isStudio: addToReadingList ? false : true }
	};

	const readingListModal: ModalSettings = {
		type: 'component',
		component: 'readingListModal',
		title: 'Add to Reading List',
		response: (r) => {
			if (r && addToReadingList) addToReadingList(r, storyline._id);
		}
	};

	const modal: ModalSettings = {
		type: 'component',
		component: modalComponent,
		response: (r) => {
			if (r) {
				readingListModal.meta = {
					user: user,
					storylineID: storyline._id
				};
				readingListModal.body = `Select the reading lists to add "${storyline.title}" to.`;
				modalStore.trigger(readingListModal);
			}
		}
	};

	const dispatch = createEventDispatcher();
	function selected() {
		dispatch('selectedStoryline', storyline._id);
	}
</script>

<button
	class={`card card-hover group rounded-md overflow-hidden w-full aspect-[2/3] relative cursor-pointer text-left text-white ${
		didError ? '' : 'bg-[url(/tail-spin.svg)] bg-no-repeat bg-center'
	}`}
	on:click={dispatchEvent ? selected : () => modalStore.trigger(modal)}
>
	<ImageWithFallback
		src={storyline.imageURL ?? ''}
		alt={storyline.title ?? 'Storyline Title'}
		bind:didError
	/>
	<div
		class="bg-black/40 absolute top-0 w-full h-full md:bg-black/0 md:hover:bg-black/40 duration-300"
	>
		<div
			class="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex flex-col justify-between duration-300 p-2"
		>
			<p class="whitespace-normal text-sm sm:text-base font-bold line-clamp-2">{storyline.title}</p>
			<p class="whitespace-normal text-sm italic">
				{`by ${storylineUser.firstName} ${storylineUser.lastName}`}
			</p>
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
</button>
