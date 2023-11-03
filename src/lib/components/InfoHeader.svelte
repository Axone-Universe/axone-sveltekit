<script lang="ts">
	export let emoji = '';
	export let heading = '';
	export let description = '';
</script>

<div class="pb-32 px-2 flex flex-col gap-4 justify-center items-center w-full text-center m-auto">
	<div>
		<p class="text-6xl">{emoji}</p>
		<h2>{heading}</h2>
		<p class="pt-4">{description}</p>
	</div>
	<slot />
</div>
