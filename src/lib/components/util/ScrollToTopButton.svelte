<script lang="ts">
	import Icon from 'svelte-awesome';
	import { arrowUp } from 'svelte-awesome/icons';

	function handleScrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<div class="flex justify-center my-12 italic font-bold">
	<button class="btn-icon variant-filled" on:click={handleScrollToTop}>
		<Icon data={arrowUp} />
	</button>
</div>
