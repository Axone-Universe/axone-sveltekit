<script lang="ts">
	import Header from '$lib/components/header/Header.svelte';
	import Footer from '$lib/components/footer/Footer.svelte';

	import type { PageData } from './$types';
	import Drawer from '$lib/components/drawer/Drawer.svelte';

	export let data: PageData;
</script>

<Header {data} />
<Drawer {data} />
<slot />
<Footer />
