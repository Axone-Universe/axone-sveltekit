<script lang="ts">
	import type { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { archive, arrowLeft } from 'svelte-awesome/icons';

	export let selected: HydratedDocument<any>;
	export let archiveMode: boolean;
	export let openUnarchiveModal: (a: any) => void;
	export let openArchiveModal: (a: any) => void;
</script>

<button
	id="archive-btn"
	class="btn btn-sm variant-filled"
	disabled={selected.length === 0}
	on:click={() => (archiveMode ? openUnarchiveModal(selected) : openArchiveModal(selected))}
>
	<span class="px-2"><Icon data={archive} /></span>
</button>
