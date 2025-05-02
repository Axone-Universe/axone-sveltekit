<script lang="ts">
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import '../app.postcss';

	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import {
		initializeStores,
		storePopup,
		Toast,
		Modal,
		type ModalComponent
	} from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	import ReadingListModal from '$lib/components/modal/ReadingListModal.svelte';

	import { invalidate } from '$app/navigation';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	let Tawk_API = {};
	let Tawk_LoadStart = new Date();

	initializeStores();

	$: ({ supabase, session, user } = data);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		// setupTawkto();
		return () => subscription.unsubscribe();
	});

	const modalComponentRegistry: Record<string, ModalComponent> = {
		readingListModal: {
			ref: ReadingListModal
		}
	};

	function setupTawkto() {
		var s1 = document.createElement('script'),
			s0 = document.getElementsByTagName('script')[0];
		s1.async = true;
		s1.src = 'https://embed.tawk.to/65b6ad518d261e1b5f58e698/1hl8pa1rm';
		s1.charset = 'UTF-8';
		s1.setAttribute('crossorigin', '*');
		s0?.parentNode?.insertBefore(s1, s0);
	}

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<QueryClientProvider client={data.queryClient}>
	<slot />
	<Modal components={modalComponentRegistry} />
	<Toast zIndex="z-[1000]" />
</QueryClientProvider>
