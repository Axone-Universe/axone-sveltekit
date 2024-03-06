<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { expand, plus } from 'svelte-awesome/icons';
	import { afterUpdate } from 'svelte';

	import type { PageData } from './$types';
	import Container from '$lib/components/Container.svelte';
	import BookHeader from '$lib/components/book/BookHeader.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import RequestPermissionModal from '$lib/components/permissions/RequestPermissionModal.svelte';
	import { formattedDate } from '$lib/util/studio/strings';
	import { decodeTime } from 'ulid';
	import Tutorial from './tutorial.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';

	export let data: PageData;
	$: ({ bookData, storylines, activeStoryline } = data);

	afterUpdate(() => {
		loadChapters({ detail: activeStoryline._id });
		storylinesList = activeStoryline?._id;
	});

	let storylinesList: string;
	const popupCombobox: PopupSettings = {
		event: 'focus-click',
		target: 'popupCombobox',
		placement: 'bottom',
		closeQuery: '.listbox-item'
	};

	async function loadChapters(event: { detail: any }) {
		let storylineID = event.detail;
		let activateStoryline = storylines[storylineID];

		if (!activateStoryline.chapters) {
			activeStoryline = activateStoryline;
			return;
		}

		if (activateStoryline.chapters.length === 0) {
			activeStoryline = activateStoryline;
			return;
		}

		if (typeof activateStoryline.chapters[0] !== 'string') {
			activeStoryline = activateStoryline;
			return;
		}

		trpc($page)
			.chapters.getByStoryline.query({
				storylineID: activateStoryline._id,
				storylineChapterIDs: activateStoryline.chapters as string[]
			})
			.then((response) => {
				activateStoryline.chapters = response.data as HydratedDocument<ChapterProperties>[];
				activeStoryline = activateStoryline;
			});
	}
</script>

<Tutorial />
<Container class="mx-2 md:mx-40 xl:mx-96 min-h-screen">
	<BookHeader
		session={data.session}
		{bookData}
		storylineData={activeStoryline}
		{storylines}
		on:selectedStoryline={loadChapters}
	/>

	<div class="px-4 md:px-10 overflow-hidden space-y-4 bg-surface-50-900-token">
		{#if activeStoryline._id && !activeStoryline.userPermissions?.view}
			<RequestPermissionModal class="mt-4" document={activeStoryline} />
		{:else}
			{#if activeStoryline.chapters && activeStoryline.chapters.length > 0}
				<div class="flex w-full p-1 space-x-4">
					<div class="flex items-center justify-start w-3/5">
						<p class="text-l md:text-3xl font-bold">Chapters</p>
					</div>
				</div>
			{/if}
			<div class="flex flex-col w-full space-y-4">
				{#if activeStoryline.chapters}
					{#each activeStoryline.chapters as chapter}
						{#if typeof chapter !== 'string'}
							<div class="space-y-2 text-center lg:text-left">
								<p class="text-xl font-bold">{chapter.title}</p>
								<div class="flex justify-start items-center space-x-2">
									{#if typeof chapter.user !== 'string'}
										<Avatar src={chapter.user?.imageURL} width="w-8" rounded="rounded-full" />
									{/if}
									<div class="flex-auto flex justify-between items-center">
										{#if typeof chapter.user !== 'string'}
											<h6 class="font-bold">By {chapter.user?.firstName}</h6>
										{/if}
										<small>On {formattedDate(new Date(decodeTime(chapter._id)))}</small>
									</div>
								</div>
								<div class="flex flex-col justify-between items-center">
									<p class="w-full font-thin line-clamp-2">
										{chapter.description}
									</p>
									<div class="btn-group variant-filled">
										<a
											class="button"
											href="/editor/{bookData._id}?mode=reader&storylineID={activeStoryline._id}&chapterID={chapter._id}"
										>
											Read
										</a>

										{#if chapter.userPermissions?.collaborate}
											<a
												class="button"
												href="/editor/{bookData._id}?mode=writer&storylineID={activeStoryline._id}&chapterID={chapter._id}"
											>
												Edit
											</a>
										{/if}
										{#if bookData.userPermissions?.collaborate}
											<Tooltip
												on:click={() => {
													window.open(
														`/storyline/create?bookID=${bookData._id}&parentStorylineID=${
															activeStoryline._id
														}&chapterID=${typeof chapter === 'string' ? chapter : chapter._id}`,
														'_blank'
													);
												}}
												content="Create new storyline branch"
												placement="top"
												target="{chapter._id}-create-storyline"
											>
												<button
													id="create-storyline-btn"
													class="btn-icon btn-icon-sm variant-filled-primary"
												>
													<span><Icon data={plus} scale={1.2} /></span>
												</button>
											</Tooltip>
										{/if}
									</div>
								</div>

								<hr class="opacity-100" />
							</div>
						{/if}
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</Container>
