<script lang="ts">
	import { Icon } from 'svelte-awesome';
	import { pencil } from 'svelte-awesome/icons';
	
	export let editCallback: () => void;
</script>

<td class="flex flex-col justify-center items-end gap-2">
	<button class="btn-icon btn-icon-sm variant-outline gap-2" on:click={editCallback}>
		<Icon data={pencil} />
	</button>
</td>
