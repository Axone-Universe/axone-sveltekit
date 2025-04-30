<script lang="ts">
	import { type ToastSettings } from '@skeletonlabs/skeleton-svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { edit, lock, plus, trash, search } from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import QuillDelta from 'quill-delta';
	import type Op from 'quill-delta/dist/Op';
	import {
		VersionPropertyBuilder,
		type DeltaProperties,
		type VersionProperties
	} from '$lib/properties/delta';
	import { toaster } from '$lib/util/toaster/toaster-svelte';

	export let delta: HydratedDocument<DeltaProperties>;
	export let selectedVersionID: string | undefined;
	export let disabled: false;

	let customClass = '';
	export { customClass as class };

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	let version: VersionProperties = new VersionPropertyBuilder().getProperties();
	let versions = delta.versions ? createVersionCopy(delta.versions).reverse() : [];

	let closeModal = () => {
		if ($modalStore[0]) {
			$modalStore[0].response ? $modalStore[0].response(delta) : '';
		}
		modalStore.close();
	};

	function createVersionCopy(versions: VersionProperties[]): VersionProperties[] {
		let versionsCopy = JSON.parse(JSON.stringify(versions)) as VersionProperties[];
		versionsCopy.pop();
		return versionsCopy;
	}

	async function createVersion() {
		let toastMessage = 'Version creation failed';
		let type = 'warning';

		trpc($page)
			.deltas.createVersion.mutate({
				title: version.title,
				chapterID: typeof delta.chapter === 'string' ? delta.chapter : delta.chapter!._id,
				id: delta._id
			})
			.then((response) => {
				toastMessage = 'Creation Successful';
				type = 'success';

				delta = response.data as HydratedDocument<DeltaProperties>;
				versions = createVersionCopy(delta.versions!).reverse();

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(delta) : '';
				}
			})
			.catch((response) => {
				toastMessage = response.message;
			})
			.finally(() => {
				toaster.info({
					title: toastMessage,
					type: type
				});
				modalStore.close();
			});
	}

	/**
	 * Creates a delta up and until the specified version
	 */
	function previewVersion() {
		let quillDelta = new QuillDelta();

		// create a copy of the delta
		const deltaCopy = JSON.parse(JSON.stringify(delta)) as DeltaProperties;
		deltaCopy._id = '';

		const versionsCopy = [];
		for (const version of delta.versions!) {
			versionsCopy.push(version);
			const revisionDelta = new QuillDelta(version.ops as Op[]);
			quillDelta = quillDelta.compose(revisionDelta);
			if (version._id === selectedVersionID) {
				break;
			}
		}

		deltaCopy.versions = versionsCopy;
		deltaCopy.ops = quillDelta.ops;

		if ($modalStore[0]) {
			$modalStore[0].response ? $modalStore[0].response(deltaCopy) : '';
		}
		modalStore.close();
	}

	function restoreVersion() {
		let toastMessage = 'Restore Failed';
		let type = 'warning';

		trpc($page)
			.deltas.restoreVersion.mutate({
				chapterID: typeof delta.chapter === 'string' ? delta.chapter : delta.chapter!._id,
				id: delta._id,
				versionID: version._id
			})
			.then((response) => {
				toastMessage = 'Restoration Successful';
				type = 'success';

				delta = response.data as HydratedDocument<DeltaProperties>;
				versions = createVersionCopy(delta.versions!).reverse();

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(delta) : '';
				}
			})
			.finally(() => {
				toaster.info({
					title: toastMessage,
					type: type
				});
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

<div class="{`modal-example-form card p-4 w-modal shadow-xl space-y-4 ${customClass}`}">
	<form on:submit|preventDefault="{createVersion}">
		<fieldset disabled="{disabled}">
			<div class="modal-form p-4 space-y-4 rounded-container">
				<label>
					Title

					<input
						class="input"
						type="text"
						placeholder="e.g. Version 1"
						bind:value="{version.title}"
						disabled="{!!selectedVersionID}"
					/>
				</label>
				<label>
					Date

					<input class="input" type="text" bind:value="{version.date}" disabled />
				</label>
			</div>

			<footer class="modal-footer flex justify-end space-x-2">
				<button
					onclick="{closeModal}"
					class="btn preset-tonal-surface border border-surface-500"
					type="button">Cancel</button
				>
				{#if !selectedVersionID}
					<button class="btn preset-filled" type="submit">Create</button>
				{:else}
					<button onclick="{previewVersion}" class="btn preset-filled" type="button">Preview</button
					>
					<button onclick="{restoreVersion}" class="btn preset-filled" type="button">Restore</button
					>
				{/if}
			</footer>
		</fieldset>
	</form>

	<hr class="opacity-100 mx-4" />

	<div class="p-4">
		<ListBox class="space-y-2 p-4">
			<ListBoxItem
				on:change="{() => versionSelected()}"
				bind:group="{selectedVersionID}"
				name="chapter"
				class="soft-listbox"
				value="{undefined}"
			>
				<div class="flex justify-between items-center">
					<p class="line-clamp-1">New Version</p>
					<div class="space-x-4">
						<Icon data="{plus}" scale="{1.2}" />
					</div>
				</div>
			</ListBoxItem>
			<div class="max-h-48 space-y-2 overflow-y-auto">
				{#each versions as version}
					<ListBoxItem
						on:change="{() => versionSelected(version)}"
						bind:group="{selectedVersionID}"
						name="chapter"
						class="soft-listbox"
						value="{version._id}"
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
