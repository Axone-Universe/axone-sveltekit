<script>
	let customClass = '';
	export { customClass as class };
</script>

<div class={`min-h-fit ${customClass}`}>
	<slot />
</div>
