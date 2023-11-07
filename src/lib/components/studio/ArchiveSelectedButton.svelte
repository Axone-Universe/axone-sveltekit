<script lang="ts">
	import type { HydratedDocument } from 'mongoose';

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
	{archiveMode ? 'Unarchive' : 'Archive'} Selected
</button>
