<script lang="ts">
	import Header from '$lib/components/header/Header.svelte';
	import Footer from '$lib/components/footer/Footer.svelte';
	import { Modal } from '@skeletonlabs/skeleton';

	import { AppShell } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<Modal />

<!-- App Shell -->
<AppShell slotPageContent="w-full">
	<svelte:fragment slot="header">
		<Header {data} />
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
	<svelte:fragment slot="pageFooter">
		<Footer />
	</svelte:fragment>
</AppShell>
