<script lang="ts">
	export let src: string;
	export let alt: string;
	export let additionalClasses: string = '';

	export let didError = false;

	function handleError(e: Event) {
		didError = true;
		const target = e.target as HTMLImageElement;
		target.src = '/image.svg';
	}
</script>

<img
	{src}
	on:error={handleError}
	{alt}
	class={`${didError ? '' : 'object-cover'} ${
		additionalClasses ? additionalClasses : 'w-full h-full'
	}`}
/>
