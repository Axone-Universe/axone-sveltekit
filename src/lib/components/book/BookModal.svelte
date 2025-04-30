<script lang="ts">
	import type { BookProperties } from '$lib/properties/book';
	import { Avatar, Modal } from '@skeletonlabs/skeleton-svelte';

	import { close, user, star } from 'svelte-awesome/icons';
	import type { HydratedDocument } from 'mongoose';
	import type { UserProperties } from '$lib/properties/user';
	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import type { Session } from '@supabase/supabase-js';
	import Icon from 'svelte-awesome/components/Icon.svelte';

	/** props */
	let {
		book = $bindable(),
		session = $bindable(),
		openLabel,
		class: customClass
	}: {
		book: HydratedDocument<BookProperties>;
		session: Session | null;
		openLabel: string;
		class: string;
	} = $props();

	session = session ?? null;

	/** variables */
	let openState = $state(false);

	const bookUser = book.user as HydratedDocument<UserProperties>;

	let closeModal = () => {
		openState = false;
	};
</script>

<Modal
	open={openState}
	onOpenChange={(e) => (openState = e.open)}
	triggerBase="btn preset-tonal"
	contentBase="card grid grid-cols-1 md:grid-cols-2 p-4 bg-surface-100-900 {customClass}"
	backdropClasses="backdrop-blur-sm"
>	
	{#snippet trigger()}{openLabel}{/snippet}
	{#snippet content()}
	<button
		class="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 btn-icon btn-icon-sm preset-filled"
		onclick="{closeModal}"
	>
		<Icon class="w-5 h-5" data={close} />
	</button>
	<div class="aspect-square sm:aspect-2/3 w-full md:h-full rounded-md overflow-hidden relative">
		<ImageWithFallback src={book.imageURL} alt={book.title} />
		{#if book.campaign}
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
			<p class="text-lg font-bold line-clamp-2">{book.title}</p>
			<div class="flex space-x-2 items-center">
				{#if bookUser.imageURL !== undefined}
					<Avatar name="{bookUser._id}" src="{bookUser.imageURL}" size="md" />
				{:else}
					<div class="overflow-hidden rounded-full">
						<Icon class="bg-primary-500 p-2 w-10 h-10" data="{user}" />
					</div>
				{/if}
				<div class="overflow-hidden flex-auto flex items-center">
					<p class="text-sm line-clamp-1">
						{bookUser.firstName}
						{bookUser.lastName}
					</p>
				</div>
				{#if book.rating > 0}
					<div class="overflow-hidden flex items-center">
						<Icon class="p-2" data="{star}" scale="{2}" />
						<p class="text-sm font-bold line-clamp-1">{book.rating.toFixed(1)}</p>
					</div>
				{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				{#if book.genres}
					{#each book.genres as genre}
						<div class="chip preset-filled py-0.5 px-1">{genre}</div>
					{/each}
				{/if}
			</div>
		</header>
		<div class="h-full">
			<hr class="opacity-50" />
			<p class="font-thin overflow-y-auto my-2">
				{book.description}
			</p>
		</div>
		<div class="w-full flex flex-col gap-4 items-center">
			<hr class="opacity-50 min-w-full" />
			<footer class=" preset-filled py-1 max-w-fit">
				<a onclick="{closeModal}" class="button" href="/book/{book._id}">View</a>
				<a onclick="{closeModal}" class="button" href="/editor/{book._id}?mode=reader">Read</a>
				{#if session && session.user.id === bookUser._id}
					<a onclick="{closeModal}" class="button" href="/editor/{book._id}?mode=writer">Write</a>
				{/if}
			</footer>
		</div>
	</div>
	{/snippet}
</Modal>
