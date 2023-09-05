<script lang="ts">
	import type { HydratedDocument } from 'mongoose';

	import type { BookProperties } from '$lib/shared/book';

	export let book: HydratedDocument<BookProperties>;

	let didError = false;

	function handleError(e: Event) {
		didError = true;
		const target = e.target as HTMLImageElement;
		target.src = '/image.svg';
	}
</script>

<div
	class={`card card-hover rounded overflow-hidden w-full aspect-[2/3] relative cursor-pointer ${
		didError ? '' : 'bg-[url(/tail-spin.svg)] bg-no-repeat bg-center'
	}`}
>
	<img
		src={book.imageURL}
		on:error={handleError}
		alt={book.title}
		class={`w-full h-full ${didError ? '' : 'object-cover'}`}
	/>
	<div class="group hover:bg-black/50 absolute top-0 w-full h-full bg-black/0 duration-300">
		<div class="opacity-0 group-hover:opacity-100 flex flex-col justify-between duration-300 p-2">
			<p class="whitespace-normal text-sm sm:text-base font-bold">{book.title}</p>
			<p class="whitespace-normal text-sm italic">{book.user.firstName}</p>
		</div>
	</div>
</div>
