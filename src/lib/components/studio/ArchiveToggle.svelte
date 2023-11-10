<script lang="ts">
	export let archiveMode: boolean;
</script>

<button
	class="chip {archiveMode ? 'variant-filled' : 'variant-soft'}"
	on:click={() => (archiveMode = !archiveMode)}
>
	<span>Archived</span>
</button>
