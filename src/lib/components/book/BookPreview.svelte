<script lang="ts">
	import { modalStore, type ModalComponent, type ModalSettings } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';

	import BookModal from './BookModal.svelte';
	import type { BookProperties } from '$lib/shared/book';
	import ImageWithFallback from '../util/ImageWithFallback.svelte';

	export let book: HydratedDocument<BookProperties>;

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
	class={`card card-hover rounded-md overflow-hidden w-full aspect-[2/3] relative cursor-pointer text-left text-white ${
		didError ? '' : 'bg-[url(/tail-spin.svg)] bg-no-repeat bg-center'
	}`}
	on:click={showModal}
>
	<ImageWithFallback src={book.imageURL} alt={book.title} bind:didError />
	<div
		class="group bg-black/40 absolute top-0 w-full h-full md:bg-black/0 md:hover:bg-black/40 duration-300"
	>
		<div
			class="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex flex-col justify-between duration-300 p-2"
		>
			<p class="whitespace-normal text-sm sm:text-base font-bold line-clamp-2">{book.title}</p>
			<p class="whitespace-normal text-sm italic">{`by ${book.user.firstName}`}</p>
		</div>
	</div>
</button>
