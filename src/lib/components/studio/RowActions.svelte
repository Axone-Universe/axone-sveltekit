<script lang="ts">
	import { Icon } from 'svelte-awesome';
	import { archive, pencil, repeat } from 'svelte-awesome/icons';

	export let archiveMode: boolean;
	export let editCallback: () => void;
	export let archiveCallback: () => void;
	export let unarchiveCallback: () => void;
</script>

<td class="flex flex-col justify-center items-end gap-2">
	<button class="btn-icon btn-icon-sm variant-outline gap-2" on:click={editCallback}>
		<Icon data={pencil} />
	</button>
	<button
		class="btn-icon btn-icon-sm variant-outline gap-2"
		on:click={() => {
			if (archiveMode) {
				archiveCallback();
			} else {
				unarchiveCallback();
			}
		}}
	>
		<Icon data={archiveMode ? repeat : archive} />
	</button>
</td>
