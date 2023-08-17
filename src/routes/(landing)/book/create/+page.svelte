<script lang="ts">
	import { BookPropertyBuilder } from '$lib/shared/book';
	import type { PageData } from './$types';
	import type { BookProperties } from '$lib/shared/book';
	import type { HydratedDocument } from 'mongoose';
	import BookDetails from '$lib/components/book/BookDetails.svelte';

	const bookPropertyBuilder = new BookPropertyBuilder();
	const book = bookPropertyBuilder.getProperties() as HydratedDocument<BookProperties>;

	export let data: PageData;
	const { supabase } = data;
</script>

<BookDetails
	class="flex flex-col space-y-4 my-8 mx-4 items-center md:space-y-0 md:items-start md:flex-row lg:mx-32 xl:mx-60"
	{supabase}
	{book}
/>
