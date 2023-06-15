<script lang="ts">
	import { ListBox, ListBoxItem, popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome';
	import { arrowDown, plus, leanpub, star } from 'svelte-awesome/icons';

	import type { PageData } from './$types';
	import Container from '$lib/components/Container.svelte';

	export let data: PageData;
	let { userAuthoredBookResponse: bookData } = data;

	let comboboxValue: string;

	const popupCombobox: PopupSettings = {
		event: 'focus-click',
		target: 'popupCombobox',
		placement: 'bottom',
		closeQuery: '.listbox-item'
	};
</script>

<Container class="mx-2 md:mx-60 xl:mx-96">
	<div class="!bg-[url('{bookData.book.properties.imageURL}')] bg-center w-full">
		<div
			class="bg-gradient-to-b from-transparent from-10%
            [.dark_&]:via-[rgba(var(--color-surface-800))] via-[rgba(var(--color-surface-100))] via-50%
            [.dark_&]:to-[rgba(var(--color-surface-800))] to-[rgba(var(--color-surface-100))]
            w-full space-x-4"
		>
			<div class="px-4 md:px-10 pt-60 overflow-hidden space-y-4">
				<div class="p-2 space-y-4">
					<div class="flex flex-col p-2">
						<p class="book-title text-4xl font-bold line-clamp-1">
							{bookData.book.properties.title}
						</p>
					</div>
					<div class="flex flex-row space-x-2">
						<a href="/reader" class="btn variant-filled py-1">
							<Icon class="p-2" data={leanpub} scale={2.5} />
							Read
						</a>
						<button type="button" class="btn-icon variant-filled">
							<Icon class="p-2" data={plus} scale={2} />
						</button>
						<button type="button" class="btn-icon variant-filled">
							<Icon class="p-2" data={star} scale={2} />
						</button>
						<div class="overflow-hidden flex items-center">
							<Icon class="p-2" data={star} scale={2} />
							<p class="text-sm font-bold line-clamp-1">4.5</p>
						</div>
					</div>
					<div class="space-x-2 line-clamp-1">
						{#if bookData.book.properties.genres !== undefined}
							{#each bookData.book.properties.genres as genre}
								<div class="chip variant-filled">{genre}</div>
							{/each}
						{/if}
					</div>
				</div>
				<hr class="opacity-50" />
				<div>
					<p class="text-lg font-thin line-clamp-3 md:line-clamp-5">
						{bookData.book.properties.description}
					</p>
				</div>
				<hr class="opacity-50" />
				<div class="flex w-full p-4 space-x-4">
					<div class="flex items-center justify-start w-2/4">
						<p class="text-l md:text-3xl font-bold">Chapters</p>
					</div>
					<div class="flex justify-end w-2/4">
						<button class="btn variant-filled w-30 justify-between" use:popup={popupCombobox}>
							<span class="capitalize text-sm">{comboboxValue ?? 'Story Lines'}</span>
							<Icon class="p-2" data={arrowDown} scale={2} />
						</button>

						<div class="card w-48 shadow-xl py-2" data-popup="popupCombobox">
							<ListBox rounded="rounded-none">
								<ListBoxItem bind:group={comboboxValue} name="medium" value="books">
									Books
								</ListBoxItem>
								<ListBoxItem bind:group={comboboxValue} name="medium" value="movies">
									Movies
								</ListBoxItem>
								<ListBoxItem bind:group={comboboxValue} name="medium" value="television">
									TV
								</ListBoxItem>
							</ListBox>
							<div class="arrow bg-surface-100-800-token" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</Container>

<style>
	@font-face {
		font-family: righteous;
		src: url('/fonts/Righteous-Regular.ttf') format('opentype');
	}

	.book-title {
		font-family: righteous;
	}
</style>
