<script lang="ts">
	import ImageWithFallback from '../util/ImageWithFallback.svelte';

	export let src: string;
	export let alt: string;
	let additionalClasses = '';
	export { additionalClasses as class };
	export let buttonCallback: () => void = () => undefined;
	export let didError = false;
</script>

<button
	class={`card rounded-md overflow-hidden aspect-[2/3] h-20 ${additionalClasses} ${
		didError || !src ? '' : 'bg-[url(/tail-spin.svg)] bg-no-repeat bg-center'
	}`}
	on:click={buttonCallback}
>
	<ImageWithFallback {src} {alt} bind:didError />
	<slot />
</button>
