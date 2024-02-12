<script>
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
</script>

<Container class="h-screen flex flex-col justify-center items-center">
	<div class="text-6xl">{$page.status}</div>
	<div>{$page.error?.message}</div>
</Container>
