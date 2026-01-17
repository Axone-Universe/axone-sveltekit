<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { times, download } from 'svelte-awesome/icons';

	// Type definition for PWA install prompt
	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	let deferredPrompt: BeforeInstallPromptEvent | null = null;
	let showPrompt = false;
	let isMobile = false;

	// Check if device is mobile
	function checkMobile() {
		const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
		const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
			userAgent.toLowerCase()
		);
		const isSmallScreen = window.innerWidth <= 768;
		return isMobileDevice || isSmallScreen;
	}

	// Check if already dismissed in this session
	function isDismissed() {
		return sessionStorage.getItem('pwa-install-dismissed') === 'true';
	}

	// Check if app is already installed
	function isInstalled() {
		const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
		const isInWebAppiOS = (window.navigator as any).standalone === true;
		return false; // isStandalone || isInWebAppiOS;
	}

	onMount(() => {
		// Don't show if already installed
		if (isInstalled()) {
			return;
		}

		// Don't show if dismissed in this session
		if (isDismissed()) {
			return;
		}

		// Check if mobile
		isMobile = checkMobile();
		if (!isMobile) {
			return;
		}

		// Listen for the beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

		// // For browsers that support beforeinstallprompt (Android Chrome, etc.)
		// // The event will fire and show the prompt immediately
		// // For iOS Safari, we show a delayed prompt as a reminder
		// // (iOS doesn't fire beforeinstallprompt, but users can still install manually)
		// const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		// if (isIOS) {
		// 	// On iOS, show after a delay as a reminder (users install via Share > Add to Home Screen)
		// 	setTimeout(() => {
		// 		if (!isInstalled() && !isDismissed() && isMobile) {
		// 			showPrompt = true;
		// 		}
		// 	}, 3000);
		// }

		if (!isInstalled() && !isDismissed() && isMobile) {
			showPrompt = true;
		}

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		};
	});

	function handleBeforeInstallPrompt(e: Event) {
		// Prevent the default browser install prompt
		e.preventDefault();
		// Store the event for later use
		deferredPrompt = e as BeforeInstallPromptEvent;
		// Show our custom prompt
		showPrompt = true;
	}

	async function handleInstallClick() {
		if (!deferredPrompt) {
			// If deferredPrompt is not available (e.g., iOS Safari)
			// The button serves as a visual reminder
			// Users on iOS need to use Share > Add to Home Screen manually
			handleDismiss(); // Hide the prompt after clicking
			return;
		}

		// Show the install prompt
		deferredPrompt.prompt();

		// Wait for the user to respond
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			console.log('User accepted the install prompt');
		} else {
			console.log('User dismissed the install prompt');
		}

		// Clear the deferred prompt
		deferredPrompt = null;
		showPrompt = false;
	}

	function handleDismiss() {
		showPrompt = false;
		// Remember dismissal for this session
		sessionStorage.setItem('pwa-install-dismissed', 'true');
	}
</script>

{#if showPrompt && isMobile && !isInstalled()}
	<div
		class="fixed right-4 z-[60] flex items-center gap-2 bg-surface-900 text-white rounded-lg shadow-lg p-3 animate-fade-in"
		style="bottom: calc(80px + max(0.5rem, env(safe-area-inset-bottom)));"
		role="alert"
		aria-live="polite"
	>
		<button
			class="btn-icon btn-sm variant-soft-primary"
			on:click={handleInstallClick}
			aria-label="Install app"
		>
			<Icon data={download} />
		</button>
		<span class="text-sm font-medium pr-1">Install App</span>
		<button
			class="btn-icon btn-sm variant-ghost-surface text-white hover:bg-surface-800"
			on:click={handleDismiss}
			aria-label="Dismiss"
		>
			<Icon data={times} />
		</button>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>
