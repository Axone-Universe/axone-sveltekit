

<script lang="ts">
	import { tableMapperValues } from '@skeletonlabs/skeleton';
	import { Table } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { onMount } from 'svelte';
	import { beforeUpdate } from 'svelte';
	import { decodeTime, ulid } from 'ulid';




	
	let currentPlace = $page.params
	
	
	let numBooks = 0;

	export let data: PageData;
	$: ({ session, UserBooks} = data);



	</script>

<div class="container p-10 space-y-4">
	<h1>BOOKS</h1>
	<body>
		<div class="container">
			<div class="row">

				<div  class="relative overflow-x-auto">
					
					<table class="table">
						<thead class="uppercase text-xl">
							<tr>
								<th>Book</th>

								<th>Description</th>
								<th>Date</th>
								<th>Storylines</th>
								
							
							</tr>
						</thead>

						<tbody>
							{#each UserBooks as book}
								<tr>
									<td class="w-1/4">
									<div class="flex items-center">
										<img src={book.imageURL} alt="Book Cover" class="w-20 h-20 mr-2  p-1" />
										{book.title}
									</div>
								</td>
									<td class="w-1/4">{book.description}</td>
									<td class="w-1/4">{new Date(decodeTime(book._id))}</td>
									<td class="w-1/4">{book.storylines}</td>
								</tr>
							{/each}

						</tbody>
					</table>
				</div>

			</div>

		</div>
		
	</body>
</div>