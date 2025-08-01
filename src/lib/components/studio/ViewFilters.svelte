<script>
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { filter } from 'svelte-awesome/icons';
</script>

<div class="flex items-center gap-1">
	<Icon data={filter} class="px-2" />
	<slot />
</div>
