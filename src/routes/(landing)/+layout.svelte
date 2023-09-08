<script lang="ts">
	import Header from '$lib/components/header/Header.svelte';
	import Footer from '$lib/components/footer/Footer.svelte';
	import { Modal } from '@skeletonlabs/skeleton';

	import type { PageData } from './$types';
	import Drawer from '$lib/components/drawer/Drawer.svelte';

	export let data: PageData;
</script>

<Modal />
<Header {data} />
<Drawer {data} />
<div class="pt-16 min-h-[calc(90vh)]">
	<slot />
</div>
<Footer />
