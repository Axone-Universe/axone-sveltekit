<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { StorylinePropertyBuilder, type StorylineProperties } from '$lib/properties/storyline';
	import { beforeUpdate, tick } from 'svelte';
	import StorylineDetails from '$lib/components/storyline/StorylineDetails.svelte';
	import type { HydratedDocument } from 'mongoose';
	import BookNav from '$lib/components/book/BookNav.svelte';
	import Tutorial from './tutorial.svelte';

	const storylinePropertyBuilder = new StorylinePropertyBuilder();
	const storyline =
		storylinePropertyBuilder.getProperties() as HydratedDocument<StorylineProperties>;

	export let data: PageData;
	$: ({ userAuthoredBookResponse: bookData, storylineResponse, chapterResponses } = data);
	let leftDrawerSelectedItem: string;
	let title = '';
	beforeUpdate(() => {
		let chapterID = $page.url.searchParams.get('chapterID')!;

		storyline.book = bookData._id;
		storyline.parent = storylineResponse?._id;
		storyline.parentChapter = chapterID;
		storyline.chapters = chapterResponses ? Object.values(chapterResponses) : [];
		storyline.genres = bookData.genres;
	});
</script>

<Tutorial />
<div
	class="flex flex-col space-y-4 my-8 mx-4 items-center md:space-y-0 md:items-start md:flex-row lg:mx-32 xl:mx-60 h-screen"
>
	<BookNav
		class="card mx-2 w-5/6 md:w-2/6 h-full p-2"
		storylines={[storyline]}
		bind:selectedChapter={leftDrawerSelectedItem}
		disabled={true}
	/>
	<StorylineDetails
		bind:title
		{storyline}
		book={bookData}
		supabase={data.supabase}
		class="h-full"
	/>
</div>
