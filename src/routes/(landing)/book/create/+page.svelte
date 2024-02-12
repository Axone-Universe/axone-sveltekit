<script lang="ts">
	import { BookPropertyBuilder } from '$lib/properties/book';
	import type { PageData } from './$types';
	import type { BookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import BookDetails from '$lib/components/book/BookDetails.svelte';
	import Container from '$lib/components/Container.svelte';
	import Tutorial from './tutorial.svelte';

	const bookPropertyBuilder = new BookPropertyBuilder();
	const book = bookPropertyBuilder.getProperties() as HydratedDocument<BookProperties>;

	export let data: PageData;
	const { supabase } = data;
</script>

<Tutorial />
<Container>
	<BookDetails
		class="flex flex-col space-y-4 items-center md:space-y-0 md:items-start md:flex-row"
		{supabase}
		{book}
	/>
</Container>
