<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome';
	import { twitter, instagram } from 'svelte-awesome/icons';
</script>

<div class="z-40 relative">
	<AppBar
		gridColumns="grid-rows-1 md:grid-cols-2"
		slotDefault="flex space-x-4 justify-center md:justify-start"
		slotTrail="place-content-center md:place-content-end"
	>
		<svelte:fragment slot="default">
			<a href="/" class="btn variant-soft">
				<span><Icon data={twitter} scale={1.5} /></span>
				<span>Twitter</span>
			</a>
			<a href="/" class="btn variant-soft">
				<span><Icon data={instagram} scale={1.5} /></span>
				<span>Instagram</span>
			</a>
		</svelte:fragment>
		<svelte:fragment slot="trail">
			<a class="anchor" target="_blank" href="/">Terms</a>
			<a class="anchor" href="/">Privacy</a>
			<a class="anchor" href="/">Help</a>
			<a href="/">© 2023 Axone Universe</a>
		</svelte:fragment>
	</AppBar>
</div>
