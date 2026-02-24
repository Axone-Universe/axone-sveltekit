<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { times, download, navicon, ellipsisV } from 'svelte-awesome/icons';

	// Type definition for PWA install prompt
	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	let deferredPrompt: BeforeInstallPromptEvent | null = null;
	let showPrompt = false;
	let isMobile = false;
	let isIOS = false;
	let isAndroid = false;
	let appInstalled = false;

	// Check if device is Android
	function checkAndroid(): boolean {
		return /Android/i.test(navigator.userAgent || navigator.vendor || (window as any).opera);
	}

	// Check if device is iOS (iPhone, iPad, iPod)
	function checkIOS(): boolean {
		const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
		const uaLower = ua.toLowerCase();
		return (
			/ipad|iphone|ipod/.test(uaLower) || (/macintosh/.test(uaLower) && 'ontouchend' in document)
		);
	}

	// Check if device is mobile, tablet, or iPad
	function checkMobile() {
		const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
		const userAgentLower = userAgent.toLowerCase();

		// Check for mobile devices
		const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
			userAgentLower
		);

		// Check for tablets (including iPad and Android tablets)
		const isTablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(userAgentLower);

		// Check for iPad specifically (iOS 13+ reports as Mac, so we need to check for touch support)
		const isIPad =
			/ipad/i.test(userAgentLower) ||
			(/macintosh/i.test(userAgentLower) && 'ontouchend' in document);

		// Check for small screen (mobile/tablet sized)
		const isSmallScreen = window.innerWidth <= 1024; // Increased to 1024 to include tablets

		return isMobileDevice || isTablet || isIPad || isSmallScreen;
	}

	// Check if already dismissed in this session
	function isDismissed() {
		return sessionStorage.getItem('pwa-install-dismissed') === 'true';
	}

	// Check if app is already installed (including when viewing in browser)
	async function isInstalled(): Promise<boolean> {
		// First check if app is running in standalone mode
		const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
		const isInWebAppiOS = (window.navigator as any).standalone === true;

		if (isStandalone || isInWebAppiOS) {
			return true;
		}

		// Check if app is installed on device but viewing in browser
		// Use getInstalledRelatedApps API (if available)
		if ('getInstalledRelatedApps' in navigator && (navigator as any).getInstalledRelatedApps) {
			try {
				const relatedApps = await (navigator as any).getInstalledRelatedApps();
				if (relatedApps && relatedApps.length > 0) {
					return true;
				}
			} catch (error) {
				console.log('Error checking installed apps:', error);
			}
		}

		return false;
	}

	onMount(async () => {
		// Check if app is installed
		appInstalled = await isInstalled();

		// Don't show if already installed
		if (appInstalled) {
			return;
		}

		// Don't show if dismissed in this session
		if (isDismissed()) {
			return;
		}

		// Check if mobile
		isMobile = checkMobile();
		isIOS = checkIOS();
		isAndroid = checkAndroid();
		if (!isMobile) {
			return;
		}

		if (!appInstalled && !isDismissed() && isMobile) {
			showPrompt = true;
		}
	});

	async function handleInstallClick() {
		// Check if app is already installed (including when viewing in browser)
		appInstalled = await isInstalled();
		if (appInstalled) {
			handleDismiss();
			return;
		}

		// If deferredPrompt is not available, handle platform-specific cases
		if (!deferredPrompt) {
			const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
			const isAndroid = /Android/.test(navigator.userAgent);

			// For iOS: Users need to use Share > Add to Home Screen manually
			if (isIOS) {
				handleDismiss();
				return;
			}
			// For Android: Try to reload (might trigger app mode)
			if (isAndroid) {
				window.location.href = window.location.origin + window.location.pathname;
				handleDismiss();
				return;
			}
			// For other platforms, just dismiss
			handleDismiss();
			return;
		}

		// Show the install prompt
		deferredPrompt.prompt();

		// Wait for the user to respond
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			console.log('User accepted the install prompt');
			// After installation, the app will be available
			// The user will need to open it from their home screen
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

{#if showPrompt && isMobile && !appInstalled}
	<div
		class="fixed right-4 z-[60] flex items-center gap-2 bg-surface-900 text-white rounded-lg shadow-lg p-3 animate-fade-in"
		style="bottom: calc(80px + max(0.5rem, env(safe-area-inset-bottom)));"
		role="alert"
		aria-live="polite"
	>
		{#if isIOS}
			<img
				src="/icons/ios-share.jpg"
				alt=""
				class="shrink-0 w-6 h-6 object-contain invert dark:invert-1"
				aria-hidden="true"
			/>
			<span class="text-sm font-medium pr-1 flex-1 min-w-0">
				Tap the <strong>Share</strong> button, then <strong>Add to Home Screen</strong>
			</span>
		{:else if isAndroid}
			<button
				class="btn-icon btn-sm variant-soft-primary shrink-0"
				on:click={handleInstallClick}
				aria-label="Install app"
			>
				<Icon data={ellipsisV} scale={1.2} />
			</button>
			<span class="text-sm font-medium pr-1 flex-1 min-w-0">
				Tap the <strong>menu</strong> button, then <strong>Add to Home Screen</strong>
			</span>
		{:else}
			<button
				class="btn-icon btn-sm variant-soft-primary shrink-0"
				on:click={handleInstallClick}
				aria-label="Install app"
			>
				<Icon data={download} />
			</button>
			<span class="text-sm font-medium pr-1">Install App</span>
		{/if}
		<button
			class="btn-icon btn-sm variant-ghost-surface text-white hover:bg-surface-800 shrink-0"
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
