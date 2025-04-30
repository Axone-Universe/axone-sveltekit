<script lang="ts">
	export let archiveMode: boolean;
</script>

<button
	id="archive-toggle"
	class="chip {archiveMode ? 'preset-filled' : 'preset-tonal'}"
	onclick="{() => (archiveMode = !archiveMode)}"
>
	<span>Archived</span>
</button>
