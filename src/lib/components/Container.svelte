<script lang="ts">
	let customClass = '';
	export { customClass as class };
</script>

<div class={`max-w-screen-xl mx-auto ${customClass} p-4`}>
	<slot />
</div>
