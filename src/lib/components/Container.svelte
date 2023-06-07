<script>
	let customClass = '';
	export { customClass as class };
</script>

<div class={`max-w-screen-xl mx-auto overflow-hidden ${customClass}`}>
	<slot />
</div>
