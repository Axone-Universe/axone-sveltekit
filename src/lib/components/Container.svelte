<script lang="ts">
	let customClass = '';
	export { customClass as class };
</script>

<div class={`max-w-(--breakpoint-xl) mx-auto ${customClass} p-4 w-full`}>
	<slot />
</div>
