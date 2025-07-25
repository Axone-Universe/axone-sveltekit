<script lang="ts">
	import { type ModalComponent, type ModalSettings, getModalStore } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { check } from 'svelte-awesome/icons';

	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import type { UserProperties } from '$lib/properties/user';
	import type { HydratedResourceProperties, ResourceProperties } from '$lib/properties/resource';
	import ResourceModal from './ResourceModal.svelte';
	import { createEventDispatcher } from 'svelte';

	export let resource: HydratedDocument<HydratedResourceProperties>;
	export let dispatchEvent: boolean = false;
	export let selected: boolean = false;

	const modalStore = getModalStore();

	let resourceUser = resource.user as UserProperties;

	let didError = false;

	const modalComponent: ModalComponent = {
		ref: ResourceModal,
		props: { resource: resource }
	};

	const modal: ModalSettings = {
		type: 'component',
		component: modalComponent,
		response: (r) => {
			resource = r;
			modalComponent.props!.resource = r;
			dispatchUpdatedEvent();
		}
	};

	const dispatch = createEventDispatcher();
	function dispatchUpdatedEvent() {
		dispatch('updatedResource', resource);
	}

	function handleKeyDown(event: { key: string }) {
		if (event.key === 'Enter' || event.key === ' ') {
			modalStore.trigger(modal);
		}
	}
</script>

<div
	class={`card card-hover group rounded-md overflow-hidden w-full relative cursor-pointer text-left ${
		didError ? '' : 'bg-[url(/tail-spin.svg)] bg-no-repeat bg-center'
	} ${selected && 'p-1 !bg-primary-400'}`}
	on:click={dispatchEvent ? dispatchUpdatedEvent : () => modalStore.trigger(modal)}
	on:keydown={handleKeyDown}
>
	<div class="relative bg-surface-200-700-token">
		<ImageWithFallback
			class="w-full h-64 object-cover"
			src={resource.src ?? 'null'}
			alt={resource.title ?? 'Resource Title'}
			bind:didError
		/>
		<!-- Status badges -->
		<div class="absolute top-3 left-3 flex flex-col gap-2">
			{#if resource.isTokenized}
				<span class="bg-green-500 px-2 py-1 rounded-full text-xs font-medium"> Tokenized </span>
			{:else}
				<span class="bg-gray-500 px-2 py-1 rounded-full text-xs font-medium"> Not Tokenized </span>
			{/if}

			{#if resource.isListed}
				<span class="bg-blue-500 px-2 py-1 rounded-full text-xs font-medium"> Listed </span>
			{:else}
				<span class="bg-orange-500 px-2 py-1 rounded-full text-xs font-medium"> Not Listed </span>
			{/if}
		</div>

		<!-- Price badge -->
		{#if resource.price}
			<div class="absolute top-3 right-3">
				<span class="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
					{resource.price} XRP
				</span>
			</div>
		{/if}
	</div>

	<div class="p-4 bg-surface-300-600-token">
		<h3 class="text-lg font-semibold mb-2">{resource.title ?? '<Update Title>'}</h3>
		<p class="text-sm mb-3">
			{`by ${resourceUser.firstName} ${resourceUser.lastName}`}
		</p>
		<p class="text-sm line-clamp-2">
			{resource.description ?? '<Update Description>'}
		</p>
	</div>
</div>
