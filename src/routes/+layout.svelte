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
	import PWAInstallPrompt from '$lib/components/PWAInstallPrompt.svelte';

	import { invalidate } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { setSupabaseClient, setSupabaseSession } from '$lib/stores/supabase';

	export let data: LayoutData;

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
		setSupabaseClient(supabase);
		setSupabaseSession(session);

		// Register service worker for PWA with root scope
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/service-worker.js', { scope: '/' })
				.then((registration) => {
					console.log('Service Worker registered:', registration);
					// Check if app is running in standalone mode
					const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
					const isInWebAppiOS = (window.navigator as any).standalone === true;
					if (isStandalone || isInWebAppiOS) {
						console.log('App is running in standalone mode');
					} else {
						console.log('App is running in browser - install to get fullscreen experience');
					}
				})
				.catch((error) => {
					console.error('Service Worker registration failed:', error);
				});
		}

		return () => subscription.unsubscribe();
	});

	const modalComponentRegistry: Record<string, ModalComponent> = {
		readingListModal: {
			ref: ReadingListModal
		}
	};

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<QueryClientProvider client={data.queryClient}>
	<slot />
	<Modal components={modalComponentRegistry} />
	<Toast zIndex="z-[1000]" />
	<PWAInstallPrompt />
</QueryClientProvider>
