<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { StorylinePropertyBuilder, type StorylineProperties } from '$lib/properties/storyline';
	import { beforeUpdate, onMount } from 'svelte';
	import StorylineDetails from '$lib/components/storyline/StorylineDetails.svelte';
	import type { HydratedDocument } from 'mongoose';

	const storylinePropertyBuilder = new StorylinePropertyBuilder();
	const storyline =
		storylinePropertyBuilder.getProperties() as HydratedDocument<StorylineProperties>;

	export let data: PageData;
	$: ({ userAuthoredBookResponse: bookData, storylineResponse, chapterResponses } = data);

	beforeUpdate(() => {
		let chapterID = $page.url.searchParams.get('chapterID')!;

		storyline.book = bookData._id;
		storyline.parent = storylineResponse._id;
		storyline.parentChapter = chapterID;
		storyline.chapters = Object.values(chapterResponses);
		storyline.genres = bookData.genres;
	});
</script>

<StorylineDetails
	class="flex flex-col space-y-4 my-8 mx-4 items-center md:space-y-0 md:items-start md:flex-row lg:mx-32 xl:mx-60"
	{storyline}
	book={bookData}
/>
