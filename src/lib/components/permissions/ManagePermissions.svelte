<script lang="ts">
	import {
		modalStore,
		toastStore,
		Avatar,
		ListBox,
		ListBoxItem,
		Autocomplete,
		popup
	} from '@skeletonlabs/skeleton';
	import type { ToastSettings, PopupSettings, AutocompleteOption } from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { PermissionsEnum, type PermissionProperties } from '$lib/shared/permission';
	import type { UserProperties } from '$lib/shared/user';
	import type { BookProperties } from '$lib/shared/book';
	import type { ChapterProperties } from '$lib/shared/chapter';
	import { caretDown } from 'svelte-awesome/icons';
	import { Icon } from 'svelte-awesome';

	export let permissionedDocument:
		| HydratedDocument<BookProperties>
		| HydratedDocument<ChapterProperties>;
	export let documentType: string;

	let customClass = '';
	export { customClass as class };

	let autocompletePopupSettings: PopupSettings = {
		event: 'focus-click',
		target: 'popupAutocomplete',
		placement: 'bottom'
	};

	const permissionsPopupSettings: PopupSettings = {
		event: 'focus-click',
		target: 'popupPermissions',
		placement: 'bottom'
	};

	let selectedUser: string = '';

	async function submit() {
		return false;
	}

	let autocompleteUsers: AutocompleteOption[] = [];

	let emptyState = 'Loading...';
	let autoCompleteEmptyDiv = 'empty-autocomplete-list';
	let autoCompleteDiv = 'auto-complete-div';

	let timer: NodeJS.Timeout;
	const waitTime = 1000;

	/** Check if the Autocomplete component is empty. If empty load from the server */
	function onKeyup(event: any) {
		let container = document.getElementById(autoCompleteDiv);
		if (container?.querySelector('.' + autoCompleteEmptyDiv)) {
			clearTimeout(timer);
			timer = setTimeout(() => {
				loadUsers(event.target.value);
			}, waitTime);
		}
	}

	/** Loads from the server what the user has filled as input */
	async function loadUsers(query: string) {
		let users = (await trpc($page).users.getByDetails.query({
			searchTerm: query
		})) as HydratedDocument<UserProperties>[];

		if (users.length === 0) {
			emptyState = 'No Results Found.';
			return;
		}

		// autocompleteUsers = [];

		for (const user of users) {
			let label = `<div class="flex-col flex justify-start">
							<h6 class="font-bold">${user.firstName}</h6>
							<small>${user.email}</small>
						</div>`;
			let value = user._id;
			autocompleteUsers.push({ label: label, value: value });
		}

		autocompleteUsers = autocompleteUsers;
	}

	/** Called when permission user is selected */
	function onUserSelect() {}
</script>

<form
	on:submit|preventDefault={submit}
	class={`modal-example-form card p-4 w-modal space-y-4 ${customClass}`}
>
	<div class="modal-form p-4 space-y-4 rounded-container-token">
		<label>
			Share {permissionedDocument.title}

			<input
				class="input autocomplete"
				type="search"
				name="autocomplete-search"
				bind:value={selectedUser}
				placeholder="Add people"
				use:popup={autocompletePopupSettings}
				on:keyup={onKeyup}
				autocomplete="off"
			/>
			<div id={autoCompleteDiv} data-popup="popupAutocomplete">
				<Autocomplete
					{emptyState}
					regionEmpty={autoCompleteEmptyDiv}
					bind:input={selectedUser}
					bind:options={autocompleteUsers}
					on:selection={onUserSelect}
				/>
			</div>
		</label>
		<div>
			People with access
			<div class="flex flex-col">
				<div class="flex flex-row p-2 space-x-2 hover:variant-soft-primary">
					<Avatar src="https://source.unsplash.com/YOErFW8AfkI/32x32" rounded="rounded-full" />
					<div class="flex-col flex justify-between">
						{#if permissionedDocument.user && typeof permissionedDocument.user !== 'string'}
							<h6 class="font-bold">{permissionedDocument.user.firstName}</h6>
							<small>{permissionedDocument.user.email}</small>
						{/if}
					</div>

					<div class="flex w-full justify-end">
						<button class="btn variant-filled space-x-12 line-clamp-1 w-fit justify-between">
							<span class="capitalize text-sm">Owner</span>
						</button>
					</div>
				</div>
				{#if permissionedDocument.permissions}
					{#each permissionedDocument.permissions as permission}
						{#if permission.user && typeof permission.user !== 'string'}
							<div class="flex justify-start items-center space-x-2">
								<Avatar
									src="https://source.unsplash.com/YOErFW8AfkI/32x32"
									rounded="rounded-full"
								/>
								<div class="flex-col flex justify-between">
									<h6 class="font-bold">{permission.user.firstName}</h6>
									<small>{permission.user.email}</small>
								</div>

								<div class="flex w-full justify-end">
									<button
										class="btn variant-filled space-x-12 line-clamp-1 w-fit justify-between"
										use:popup={permissionsPopupSettings}
									>
										<span class="capitalize text-sm">Owner</span>
										<Icon data={caretDown} scale={1} />
									</button>
									<div class="card w-48 shadow-xl py-2" data-popup="popupPermissions">
										<ListBox rounded="rounded-none" disabled>
											{#each PermissionsEnum as permissionType}
												<ListBoxItem
													bind:group={permission.permission}
													name=""
													value={permissionType}
												>
													{permissionType}
												</ListBoxItem>
											{/each}
										</ListBox>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	</div>
</form>
