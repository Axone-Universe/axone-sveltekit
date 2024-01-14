<script>
	import Icon from 'svelte-awesome';
	import { filter } from 'svelte-awesome/icons';
</script>

<div class="flex items-center gap-1">
	<Icon data={filter} class="mr-1" />
	<slot />
</div>
