<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/all.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	// Most of your app wide CSS should be put in this file
	import '../app.postcss';

	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup, Toast, Modal, type ModalComponent } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	import { invalidate } from '$app/navigation';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: ({ supabase, session } = data);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});

	const modalComponentRegistry: Record<string, ModalComponent> = {};

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<QueryClientProvider client={data.queryClient}>
	<slot />
	<Modal components={modalComponentRegistry} />
	<Toast />
</QueryClientProvider>
