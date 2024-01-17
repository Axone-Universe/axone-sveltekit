<script lang="ts">
	let customClass = '';
	export { customClass as class };
	export let id: string = '';
</script>

<div {id} class={`min-h-fit ${customClass}`}>
	<slot />
</div>
