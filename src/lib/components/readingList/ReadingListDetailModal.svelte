<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import StorylinePreview from '../storyline/StorylinePreview.svelte';
	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import type { UserProperties } from '$lib/properties/user';
	import type { BookProperties } from '$lib/properties/book';
	import LoadingSpinner from '../util/LoadingSpinner.svelte';

	export let readingListName: string;
	export let storylines: HydratedDocument<StorylineProperties>[];
	export let user: any = undefined;
	export let supabase: any = undefined;

	const modalStore = getModalStore();

	function closeModal() {
		modalStore.close();
	}
</script>

{#if $modalStore[0]}
	<div class="card p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
		<!-- Header -->
		<header class="mb-6">
			<h2 class="text-2xl md:text-3xl font-bold mb-2">{readingListName}</h2>
			<p class="text-sm text-surface-600-300-token">
				{storylines.length}
				{storylines.length === 1 ? 'storyline' : 'storylines'}
			</p>
		</header>

		<!-- Storylines List -->
		<div class="flex-1 overflow-y-auto pr-2">
			{#if storylines.length === 0}
				<div class="text-center py-8">
					<p class="text-surface-500">No storylines in this reading list</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
					{#each storylines as storyline (storyline._id)}
						{@const storylineUser = typeof storyline.user === 'object' ? storyline.user : null}
						{@const book = typeof storyline.book === 'object' ? storyline.book : null}
						{@const bookId =
							typeof storyline.book === 'object' ? storyline.book._id : storyline.book}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							class="flex gap-3 p-3 rounded-lg hover:variant-soft-surface transition-colors cursor-pointer w-full text-left"
							on:click={() => window.open(`/book/${bookId}?storylineID=${storyline._id}`, '_blank')}
						>
							<!-- Storyline Preview (Left) -->
							<div class="w-24 md:w-32 flex-shrink-0 pointer-events-none">
								<StorylinePreview
									{storyline}
									{user}
									{supabase}
									dispatchEvent={false}
									onUpdate={() => {}}
								/>
							</div>

							<!-- Details (Right) -->
							<div class="flex-1 min-w-0 flex flex-col gap-2">
								<!-- Author Info (Top) -->
								<div class="flex items-center gap-2">
									{#if storylineUser?.imageURL}
										<div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
											<ImageWithFallback
												src={storylineUser.imageURL}
												alt={`${storylineUser.firstName || ''} ${storylineUser.lastName || ''}`}
												class="w-full h-full object-cover"
											/>
										</div>
									{/if}
									<div class="min-w-0 flex-1">
										<p class="font-semibold text-sm truncate">
											{storyline.title}
										</p>
										<p class="text-xs text-surface-600-300-token">
											by {storylineUser?.firstName || 'Unknown'}
											{storylineUser?.lastName || ''}
										</p>
									</div>
								</div>

								<!-- Description (Bottom) -->
								<div>
									<p class="text-xs text-surface-700-200-token line-clamp-3">
										{storyline.description || 'No description available for this storyline.'}
									</p>
								</div>

								<!-- Book Title -->
								{#if book?.title}
									<p class="text-xs text-surface-500 italic truncate">From: {book.title}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<footer class="flex justify-end gap-4 mt-6 pt-4 border-t border-surface-300-600-token">
			<button class="btn variant-ghost-surface" on:click={closeModal}>Close</button>
		</footer>
	</div>
{/if}
