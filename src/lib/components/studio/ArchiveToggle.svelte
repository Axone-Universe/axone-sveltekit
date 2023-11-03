<script lang="ts">
	import { SlideToggle } from '@skeletonlabs/skeleton';

	export let archiveMode: boolean;
</script>

<SlideToggle
	name="slide"
	size="sm"
	bind:checked={archiveMode}
	background=" bg-surface-400-500-token"
	active="bg-primary-500"
>
	Archived
</SlideToggle>
