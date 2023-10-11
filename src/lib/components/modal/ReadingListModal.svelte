<script lang="ts">
	import { modalStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let user = $modalStore[0].meta.user;
	let readingLists = Object.keys(user.readingLists);
	let selected: boolean[] = [];
	export let parent: any;

	onMount(() => {
		for (const [key, value] of Object.entries(user.readingLists)) {
			if ((value as string[]).includes($modalStore[0].meta.storylineID)) {
				selected.push(true);
			} else {
				selected.push(false);
			}
		}
	});

	function onFormSubmit(): void {
		if ($modalStore[0].response) {
			$modalStore[0].response(readingLists.filter((o, i) => selected[i]));
		}
		modalStore.close();
	}

	function onSelectReadingList(e: Event, index: number) {
		selected[index] = (e.target as HTMLInputElement).checked;
	}

	function onCreateReadingList() {
		modalStore.close();
		goto('/library');
	}
</script>

{#if $modalStore[0]}
	<div class="card p-4 w-modal shadow-xl space-y-4">
		<header class="text-2xl font-bold">{$modalStore[0].title ?? '(title missing)'}</header>
		<article>{$modalStore[0].body ?? '(body missing)'}</article>
		<div class="space-y-2 h-32 overflow-y-auto">
			{#each readingLists as name, index}
				<label class="flex items-center space-x-2 px-2">
					<input
						class="checkbox"
						type="checkbox"
						value={name}
						checked={user.readingLists[name].includes($modalStore[0].meta.storylineID)}
						on:change={(e) => onSelectReadingList(e, index)}
					/>
					<p>{name}</p>
				</label>
			{/each}
			{#if readingLists.length === 0}
				It looks like you don't have any reading lists! You can create one in your library.
			{/if}
		</div>
		<footer class={parent.regionFooter}>
			<button class="btn {parent.buttonNeutral}" on:click={parent.onClose}>
				{parent.buttonTextCancel}
			</button>
			{#if readingLists.length === 0}
				<button class="btn variant-filled" on:click={onCreateReadingList}> Go to library</button>
			{:else}
				<button class="btn {parent.buttonPositive}" on:click={onFormSubmit}>Submit</button>
			{/if}
		</footer>
	</div>
{/if}
