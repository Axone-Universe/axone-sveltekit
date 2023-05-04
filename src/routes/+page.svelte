<script lang="ts">
	import { toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import Container from '$lib/components/Container.svelte';
	import type { Book } from './api/books/+server';

	let author = '';
	let books: Book[] = [];

	async function onClick() {
		const response = await fetch(`/api/books?author=${author}`);
		books = (await response.json()).books;
		let searchedAuthor = author;
		if (books.length == 0) {
			const t: ToastSettings = {
				message: `Looks like we don\'t have any books from ${String(searchedAuthor)}.`,
				background: 'variant-filled-error'
			};
			toastStore.trigger(t);
		}
	}
</script>

<Container classes="flex flex-col items-center gap-8">
	<h1>Test AuraDB 👇</h1>
	<form class="card p-4 max-w-lg flex flex-col gap-4">
		<label class="label">
			<span>Author Name</span>
			<input
				class="input"
				type="text"
				placeholder="e.g. JK Rowling or leave blank for all"
				bind:value={author}
			/>
		</label>
		<button on:click={onClick} class="btn variant-filled-primary">Submit</button>
	</form>

	<!-- Responsive Container (recommended) -->
	<div class="table-container">
		<!-- Native Table Element -->
		<table class="table table-hover">
			<thead>
				<tr>
					<th />
					<th>Author</th>
					<th>Book Title</th>
				</tr>
			</thead>
			<tbody>
				{#each books as book, i}
					<tr>
						<td>{i + 1}</td>
						<td>{book.author.name}</td>
						<td>{book.title}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Container>
