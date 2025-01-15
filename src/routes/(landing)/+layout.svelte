<script lang="ts">
	import Header from '$lib/components/header/Header.svelte';
	import Footer from '$lib/components/footer/Footer.svelte';

	import type { PageData } from './$types';
	import Drawer from '$lib/components/drawer/Drawer.svelte';

	export let data: PageData;
</script>

<div class="flex flex-col items-center min-h-screen">
	<Header {data} />
	<Drawer {data} />
	<slot {data} />
	<Footer />
</div>
