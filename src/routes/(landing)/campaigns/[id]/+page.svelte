<script lang="ts">
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
</script>

<Container>
	<div class="card p-4 my-8">
		<h1>{$page.url.pathname}</h1>
	</div>
</Container>
