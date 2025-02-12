<script lang="ts">
	export let src: string;
	export let alt: string;
	export let didError = false;
	let customClass = '';
	export { customClass as class };

	function handleError(e: Event) {
		didError = true;
		const target = e.target as HTMLImageElement;
		target.src = '/image.svg';
	}
</script>

<img
	{src}
	on:error={handleError}
	alt={didError ? alt : ''}
	class="{customClass} {didError ? '' : 'object-cover'} w-full h-full"
/>
