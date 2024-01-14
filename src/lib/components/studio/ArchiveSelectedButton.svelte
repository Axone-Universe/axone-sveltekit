<script lang="ts">
	import type { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome';
	import { archive, arrowLeft } from 'svelte-awesome/icons';

	export let selected: HydratedDocument<any>;
	export let archiveMode: boolean;
	export let openUnarchiveModal: (a: any) => void;
	export let openArchiveModal: (a: any) => void;
</script>

<button
	class="btn btn-sm variant-filled"
	disabled={selected.length === 0}
	on:click={() => (archiveMode ? openUnarchiveModal(selected) : openArchiveModal(selected))}
>
	<span class="-mr-1"><Icon data={archive} /></span>
	<span>
		<Icon
			data={arrowLeft}
			class="transition-all duration-300 {archiveMode ? 'rotate-180' : 'rotate-0'}"
		/>
	</span>
</button>
