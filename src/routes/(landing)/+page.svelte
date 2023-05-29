<script lang="ts">
	import { toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import type { BookResponse } from '$lib/nodes/digital-products/book';

	let title = '';
	let books: BookResponse[] = [];

	async function onClick() {
		books = (await trpc($page).books.list.query(title)) as BookResponse[];
		let searchedTitle = title;
		if (books.length === 0) {
			const t: ToastSettings = {
				message: `Looks like we don\'t have any books named ${String(searchedTitle)}.`,
				background: 'variant-filled-error'
			};
			toastStore.trigger(t);
		}
	}
</script>

<Container classes="flex flex-col items-center gap-8">
	<h1>Test AuraDB 👇</h1>
	<form class="card p-4 max-w-lg flex flex-col gap-4 mt-8">
		<label class="label">
			<span>Book Title</span>
			<input class="input" type="text" placeholder="e.g. The Name of the Wind" bind:value={title} />
		</label>
		<button on:click={onClick} class="btn variant-filled-primary">Submit</button>
	</form>

	<div class="table-container">
		<table class="table table-hover">
			<thead>
				<tr>
					<th />
					<th>Book ID</th>
					<th>Book Title</th>
				</tr>
			</thead>
			<tbody>
				{#each books as book, i}
					<tr>
						<td>{i + 1}</td>
						<td>{book.value.book.properties.id}</td>
						<td>{book.value.book.properties.title}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Container>
