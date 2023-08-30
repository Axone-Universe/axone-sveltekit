<script lang="ts">
	import RequestPermissionModal from '$lib/components/permissions/RequestPermissionModal.svelte';
	import type { PageData } from './$types';
	import Container from '$lib/components/Container.svelte';

	export let data: PageData;
	const { supabase } = data;
	$: ({ document } = data);
</script>

<Container class="flex align-middle h-full justify-center items-center">
	<RequestPermissionModal {document} />
</Container>
