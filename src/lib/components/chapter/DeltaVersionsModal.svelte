<script lang="ts">
	import {
		modalStore,
		toastStore,
		type ToastSettings,
		ListBox,
		ListBoxItem
	} from '@skeletonlabs/skeleton';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { edit, lock, plus, trash, search } from 'svelte-awesome/icons';
	import { Icon } from 'svelte-awesome';
	import {
		VersionPropertyBuilder,
		type DeltaProperties,
		type VersionProperties
	} from '$lib/properties/delta';

	export let delta: HydratedDocument<DeltaProperties>;

	let customClass = '';
	export { customClass as class };

	let version: VersionProperties = new VersionPropertyBuilder().getProperties();
	let selectedVersionID = '';
	let versions = delta.versions ? createVersionCopy(delta.versions).reverse() : [];

	let closeModal = () => {
		modalStore.close();
	};

	function createVersionCopy(versions: VersionProperties[]): VersionProperties[] {
		const versionsCopy = JSON.parse(JSON.stringify(versions)) as VersionProperties[];
		return versionsCopy;
	}

	async function createVersion() {
		let toastMessage = 'Creation Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.deltas.createVersion.mutate({
				title: version.title,
				chapterID: typeof delta.chapter === 'string' ? delta.chapter : delta.chapter!._id,
				id: delta._id
			})
			.then((deltaResponse) => {
				toastMessage = 'Creation Successful';
				toastBackground = 'bg-success-500';

				delta = deltaResponse as HydratedDocument<DeltaProperties>;
				versions = createVersionCopy(delta.versions!).reverse();

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(delta) : '';
				}
			})
			.finally(() => {
				let t: ToastSettings = {
					message: toastMessage,
					background: toastBackground,
					autohide: true
				};
				toastStore.trigger(t);
			});
	}

	function restoreVersion() {
		let toastMessage = 'Restore Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.deltas.restoreVersion.mutate({
				chapterID: typeof delta.chapter === 'string' ? delta.chapter : delta.chapter!._id,
				id: delta._id,
				versionID: version._id
			})
			.then((deltaResponse) => {
				toastMessage = 'Restoration Successful';
				toastBackground = 'bg-success-500';

				delta = deltaResponse as HydratedDocument<DeltaProperties>;
				versions = createVersionCopy(delta.versions!).reverse();

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(delta) : '';
				}
			})
			.finally(() => {
				let t: ToastSettings = {
					message: toastMessage,
					background: toastBackground,
					autohide: true
				};
				toastStore.trigger(t);
			});
	}

	function versionSelected(selectedVersion?: VersionProperties) {
		if (selectedVersion) {
			version = selectedVersion;
			version = version;
		} else {
			version = new VersionPropertyBuilder().getProperties();
		}
	}
</script>

<div class={`modal-example-form card p-4 w-modal shadow-xl space-y-4 ${customClass}`}>
	<form on:submit|preventDefault={createVersion}>
		<div class="modal-form p-4 space-y-4 rounded-container-token">
			<label>
				* Title

				<input
					class="input"
					type="text"
					placeholder="e.g. Version 1"
					bind:value={version.title}
					required
					disabled={!!selectedVersionID}
				/>
			</label>
			<label>
				* Date

				<input class="input" type="text" bind:value={version.date} disabled />
			</label>
		</div>

		<footer class="modal-footer flex justify-end space-x-2">
			<button on:click={closeModal} class="btn variant-ghost-surface" type="button">Cancel</button>
			{#if !selectedVersionID}
				<button class="btn variant-filled" type="submit">Create</button>
			{:else if selectedVersionID !== versions[0]._id}
				<button on:click={restoreVersion} class="btn variant-filled" type="button">Restore</button>
			{/if}
		</footer>
	</form>

	<hr class="opacity-100 mx-4" />

	<div class="p-4">
		<ListBox class="space-y-2 p-4">
			<ListBoxItem
				on:change={() => versionSelected()}
				bind:group={selectedVersionID}
				name="chapter"
				class="soft-listbox"
				value=""
			>
				<div class="flex justify-between items-center">
					<p class="line-clamp-1">New Version</p>
					<div class="space-x-4">
						<Icon data={plus} scale={1.2} />
					</div>
				</div>
			</ListBoxItem>
			<div class="max-h-48 space-y-2 overflow-y-auto">
				{#each versions as version}
					<ListBoxItem
						on:change={() => versionSelected(version)}
						bind:group={selectedVersionID}
						name="chapter"
						class="soft-listbox"
						value={version._id}
					>
						<div class="flex justify-between items-center">
							<p class="line-clamp-1">{version.title ?? version.date}</p>
						</div>
					</ListBoxItem>
				{/each}
			</div>
		</ListBox>
	</div>
</div>
