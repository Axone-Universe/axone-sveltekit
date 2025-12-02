<script lang="ts">
	import { onMount } from 'svelte';

	export let component: any;
	export let props: any;

	let containerElement: HTMLDivElement;

	onMount(() => {
		// Force all sections and divs to display vertically by removing inline flex styles
		if (containerElement) {
			const allElements = containerElement.querySelectorAll('*');
			
			allElements.forEach((element) => {
				const htmlElement = element as HTMLElement;
				const style = htmlElement.getAttribute('style') || '';
				
				// If element has flex or grid display, convert to block
				if (style.includes('display') && (style.includes('flex') || style.includes('grid'))) {
					// Remove the display property from inline style
					const newStyle = style
						.replace(/display\s*:\s*[^;]+;?/gi, '')
						.replace(/flex-direction\s*:\s*[^;]+;?/gi, '')
						.replace(/align-items\s*:\s*[^;]+;?/gi, '')
						.replace(/justify-content\s*:\s*[^;]+;?/gi, '')
						.trim();
					
					if (newStyle) {
						htmlElement.setAttribute('style', newStyle);
					} else {
						htmlElement.removeAttribute('style');
					}
				}
			});
		}
	});
</script>

<div class="email-preview-wrapper">
	<div class="email-preview-container" bind:this={containerElement}>
		<svelte:component this={component} {...props} />
	</div>
</div>

<style>
	.email-preview-wrapper {
		width: 100%;
		background-color: #f5f5f5;
		padding: 2rem;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		min-height: 100%;
	}

	.email-preview-container {
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
		background-color: #ffffff;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
		display: block;
	}

	/* Force all email template elements to be block-level and stack vertically */
	:global(.email-preview-container > *) {
		display: block !important;
		width: 100% !important;
		max-width: 100% !important;
		box-sizing: border-box !important;
	}

	/* Force all sections and divs to be block-level by default */
	:global(.email-preview-container section),
	:global(.email-preview-container div) {
		display: block !important;
		width: 100% !important;
		box-sizing: border-box !important;
	}

	/* Make sure all text and content elements are block-level */
	:global(.email-preview-container p),
	:global(.email-preview-container div),
	:global(.email-preview-container span),
	:global(.email-preview-container h1),
	:global(.email-preview-container h2),
	:global(.email-preview-container h3) {
		display: block !important;
		width: 100% !important;
		box-sizing: border-box !important;
	}

	/* Ensure images don't break layout */
	:global(.email-preview-container img) {
		max-width: 100% !important;
		height: auto !important;
		display: block !important;
	}
</style>

