<script lang="ts">
	import { getModalStore, Avatar } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { whatsapp } from 'svelte-awesome/icons';

	import {
		Email,
		HackerNews,
		Reddit,
		LinkedIn,
		Pinterest,
		Telegram,
		Tumblr,
		Vk,
		Xing,
		Facebook,
		X,
		Line
		// @ts-expect-error there are no types to import for this library
	} from 'svelte-share-buttons-component';

	export let title: string;
	export let url: string;
	export let body: string = '';

	let customClass = '';
	export { customClass as class };

	const modalStore = getModalStore();
	let closeModal = () => {
		modalStore.close();
	};
</script>

<div class={`card w-modal p-4 flex gap-8 relative items-center flex-wrap ${customClass}`}>
	<a href="https://web.whatsapp.com/send?text={title} {url}" class="btn-icon bg-green-600">
		<Icon class="p-2 text-white" data={whatsapp} scale={2.5} />
	</a>
	<X
		class="btn-icon"
		text={title}
		{url}
		hashtags="github,svelte"
		via="username"
		related="other,users"
	/>
	<Facebook class="btn-icon" quote={title} {url} />
	<LinkedIn class="btn-icon" {url} />
	<Telegram class="btn-icon" text={title} {url} />
	<Email class="btn-icon" subject={title} body="{body} {url}" />
	<HackerNews class="btn-icon" {title} {url} />
	<Reddit class="btn-icon" {title} {url} />
	<Tumblr class="btn-icon" {title} {url} caption={title} />
	<Pinterest
		class="btn-icon"
		{url}
		media="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Svelte_Logo.svg/200px-Svelte_Logo.svg.png"
		description={title}
	/>
	<Vk class="btn-icon" {title} {url} />
	<Xing class="btn-icon" {title} {url} />
	<Line class="btn-icon" {url} />
</div>
