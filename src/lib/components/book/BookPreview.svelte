<script lang="ts">
	import { modalStore, type ModalComponent, type ModalSettings } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import { Icon } from 'svelte-awesome';
	import { star } from 'svelte-awesome/icons';

	import BookModal from './BookModal.svelte';
	import type { BookProperties } from '$lib/shared/book';
	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import type { UserProperties } from '$lib/shared/user';

	export let book: HydratedDocument<BookProperties>;

	let user = book.user as UserProperties;

	let didError = false;

	const modalComponent: ModalComponent = {
		ref: BookModal,
		props: { bookData: book }
	};

	const modal: ModalSettings = {
		type: 'component',
		component: modalComponent
	};

	let showModal = () => {
		modalStore.trigger(modal);
	};
</script>

<button
	class={`card card-hover group rounded-md overflow-hidden w-full aspect-[2/3] relative cursor-pointer text-left text-white ${
		didError ? '' : 'bg-[url(/tail-spin.svg)] bg-no-repeat bg-center'
	}`}
	on:click={showModal}
>
	<ImageWithFallback src={book.imageURL} alt={book.title} bind:didError />
	<div
		class="bg-black/40 absolute top-0 w-full h-full md:bg-black/0 md:hover:bg-black/40 duration-300"
	>
		<div
			class="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex flex-col justify-between duration-300 p-2"
		>
			<p class="whitespace-normal text-sm sm:text-base font-bold line-clamp-2">{book.title}</p>
			<p class="whitespace-normal text-sm italic">{`by ${user.firstName}`}</p>
		</div>
	</div>
	<div class="overflow-hidden flex items-center absolute bottom-1 right-1 bg-white md:bg-black group-hover:bg-white py-1 px-2 space-x-1 rounded-full duration-300">
		<Icon class="w-3 h-3 text-black md:text-white group-hover:text-black duration-300" data={star} />
		<p class="text-xs font-bold line-clamp-1 text-black md:text-white group-hover:text-black duration-300">4.5</p>
	</div>
</button>
