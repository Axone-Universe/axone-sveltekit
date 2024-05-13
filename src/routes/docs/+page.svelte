<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import Container from '$lib/components/Container.svelte';
	import SwaggerUI from 'swagger-ui';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ spec } = data);

	onMount(() => {
		SwaggerUI({
			dom_id: '#api',
			spec: spec
		});
	});
</script>

<Section class="w-full min-h-screen flex bg-surface-100">
	<Container class="w-full">
		<div id="api" />
	</Container>
</Section>

<style>
	@import 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css';
</style>
