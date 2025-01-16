<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { twitter, instagram } from 'svelte-awesome/icons';
</script>

<div class="z-40 w-full relative">
	<AppBar
		gridColumns="grid-rows-1 md:grid-cols-2"
		slotDefault="flex space-x-4 justify-center md:justify-start"
		slotTrail="place-content-center md:place-content-end"
	>
		<svelte:fragment slot="default">
			<a href="https://www.instagram.com/axoneuniverse/" target="_blank" class="btn variant-soft">
				<span><Icon data={instagram} scale={1.5} /></span>
				<span>Instagram</span>
			</a>
			<a href="https://twitter.com/" target="_blank" class="btn variant-soft">
				<span><Icon data={twitter} scale={1.5} /></span>
				<span>Twitter</span>
			</a>
		</svelte:fragment>
		<svelte:fragment slot="trail">
			<a class="anchor" href="/terms">Terms</a>
			<a class="anchor" href="/privacy">Privacy</a>
			<a class="anchor" href="/">Help</a>
			<a href="/">© 2023 Axone Universe</a>
		</svelte:fragment>
	</AppBar>
</div>
