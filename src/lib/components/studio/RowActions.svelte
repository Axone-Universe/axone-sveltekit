<script lang="ts">
	import type { BookProperties } from '$lib/properties/book';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import { type TransactionProperties } from '$lib/properties/transaction';
	import type { RowAction } from '$lib/util/types';
	import { popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { ellipsisV } from 'svelte-awesome/icons';

	export let rowActions: RowAction[] = [];
	export let document:
		| HydratedDocument<TransactionProperties>
		| HydratedDocument<BookProperties>
		| HydratedDocument<ChapterProperties>
		| HydratedDocument<StorylineProperties>;

	const actionsPopupSettings = (target: string) => {
		return {
			event: 'click',
			target: target,
			placement: 'left'
		} as PopupSettings;
	};
</script>

<div class="flex flex-col justify-center items-end gap-2">
	<div class="flex-row btn-group variant-filled">
		<button id="row-actions-btn" class="btn-icon" use:popup={actionsPopupSettings(document._id)}>
			<Icon data={ellipsisV} />
		</button>
	</div>

	<div class="card p-1 shadow-xl" data-popup={document._id}>
		<div class="grid grid-cols-1">
			{#each rowActions as rowAction}
				<button
					on:click={() => rowAction.callback(document)}
					type="button"
					class={`flex justify-start btn space-x-6 hover:variant-soft-primary ${rowAction.class}`}
				>
					<Icon data={rowAction.icon} scale={1.5} />
					<span>{rowAction.label}</span>
				</button>
				<hr class="my-1 variant-fill-primary" />
			{/each}
		</div>
	</div>
</div>
