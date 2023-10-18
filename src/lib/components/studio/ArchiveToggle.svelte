<script lang="ts">
	import { SlideToggle } from '@skeletonlabs/skeleton';

	export let archiveMode: boolean;
</script>

<SlideToggle
	name="slide"
	size="sm"
	bind:checked={archiveMode}
	background="bg-surface-100-800-token"
	active="bg-primary-500"
>
	Archived
</SlideToggle>
