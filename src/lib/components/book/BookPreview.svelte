<script lang="ts">
	import type { UserAuthoredBookResponse } from '$lib/nodes/user';
	import { Avatar } from '@skeletonlabs/skeleton';
	import BookModal from './BookModal.svelte';

	import { modalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome';
	import { user, star } from 'svelte-awesome/icons';

	export let bookData: UserAuthoredBookResponse;

	let customClass = '';
	export { customClass as class };

	const modalComponent: ModalComponent = {
		// Pass a reference to your custom component
		ref: BookModal,
		// Add the component properties as key/value pairs
		props: { bookData: bookData },
		// Provide a template literal for the default component slot
		slot: '<p>Skeleton</p>'
	};

	const modal: ModalSettings = {
		type: 'component',
		// Pass the component directly:
		component: modalComponent
	};

	let showModal = () => {
		modalStore.trigger(modal);
	};
</script>

<div
	class={`card aspect-[8/13] pb-2 card-hover overflow-hidden flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33%] xl:flex-[0_0_20%] ${customClass}`}
>
	<header>
		<div class="flex p-2 items-center">
			<p class="text-sm lg:text-lg font-bold line-clamp-1">{bookData.book.properties.title}</p>
		</div>
	</header>
	<div class="">
		<button on:click={showModal}>
			<img
				src={bookData.book.properties.imageURL}
				class="object-cover w-full aspect-[7/8]"
				alt="Post"
			/>
		</button>
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
