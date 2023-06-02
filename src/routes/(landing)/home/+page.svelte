<script lang="ts">
	import { toastStore, type ToastSettings } from '@skeletonlabs/skeleton';
	import { Integer } from 'neo4j-driver';

	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import type { UserAuthoredBookResponse } from '$lib/nodes/user';

	import type { PageData } from './$types';

	export let data: PageData;
	let { userAuthoredBookResponses } = data;

	let title = '';
	// let booksDetails: UserAuthoredBookResponse[] = [];

	// async function onClick() {
	// 	booksDetails = (await trpc($page).books.list.query({
	// 		searchTerm: title
	// 	})) as UserAuthoredBookResponse[];
	// 	let searchedTitle = title;
	// 	if (booksDetails.length === 0) {
	// 		const t: ToastSettings = {
	// 			message: `Looks like we don\'t have any books named ${String(searchedTitle)}.`,
	// 			background: 'variant-filled-error'
	// 		};
	// 		toastStore.trigger(t);
	// 	}
	// }
</script>

<Container class="flex flex-col items-center gap-8">
	<h1>Test AuraDB 👇</h1>
	<form class="card p-4 max-w-lg flex flex-col gap-4 mt-8">
		<label class="label">
			<span>Book Title</span>
			<input class="input" type="text" placeholder="e.g. The Name of the Wind" bind:value={title} />
		</label>
		<!-- <button on:click={onClick} class="btn variant-filled-primary">Submit</button> -->
	</form>

	<div class="table-container">
		<table class="table table-hover">
			<thead>
				<tr>
					<th />
					<th>Book ID</th>
					<th>Book Title</th>
					<th>Author</th>
				</tr>
			</thead>
			<tbody>
				{#each userAuthoredBookResponses as bookResponse, i}
					<tr>
						<td>{i + 1}</td>
						<td>{bookResponse.book.properties.id}</td>
						<td>{bookResponse.book.properties.title}</td>
						<td>{bookResponse.user.properties.firstName}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Container>
