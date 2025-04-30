<script lang="ts">
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { arrowUp } from 'svelte-awesome/icons';

	function handleScrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<div class="flex justify-center my-12 italic font-bold">
	<button class="btn-icon preset-filled" onclick="{handleScrollToTop}">
		<Icon data="{arrowUp}" />
	</button>
</div>
