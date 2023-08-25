<script lang="ts">
	import {
		Avatar,
		ListBox,
		ListBoxItem,
		Autocomplete,
		popup,
		SlideToggle
	} from '@skeletonlabs/skeleton';
	import type { PopupSettings, AutocompleteOption } from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import {
		PermissionsEnum,
		type PermissionProperties,
		PermissionPropertyBuilder
	} from '$lib/shared/permission';
	import { UserPropertyBuilder, type UserProperties } from '$lib/shared/user';
	import type { BookProperties } from '$lib/shared/book';
	import type { ChapterProperties } from '$lib/shared/chapter';
	import { caretDown, trash } from 'svelte-awesome/icons';
	import { Icon } from 'svelte-awesome';
	import { onMount } from 'svelte';
	import { ulid } from 'ulid';

	export let permissionedDocument:
		| HydratedDocument<BookProperties>
		| HydratedDocument<ChapterProperties>;
	export let permissions: Record<string, HydratedDocument<PermissionProperties>>;

	export let customClass = '';
	export { customClass as class };

	let documentOwner: HydratedDocument<UserProperties> =
		permissionedDocument.user as HydratedDocument<UserProperties>; // creator of the document

	onMount(() => {
		setDocumentOwner();
		createPermissionsDict();
	});

	let autocompletePopupSettings: PopupSettings = {
		event: 'focus-click',
		target: 'popupAutocomplete',
		placement: 'bottom'
	};

	const permissionsPopupSettings = (target: string) => {
		return {
			event: 'focus-click',
			target: target,
			placement: 'bottom'
		} as PopupSettings;
	};

	let selectedUser: string = '';

	async function setDocumentOwner() {
		if (!documentOwner) {
			documentOwner = new UserPropertyBuilder().getProperties() as HydratedDocument<UserProperties>;
			documentOwner._id = $page.data.session!.user.id;
			documentOwner.email = $page.data.session!.user.email;
		}

		autocompleteUsers = [
			{
				label: `<div>
					<p class="flex font-bold text-lg">${documentOwner.firstName}</p>
					<p class="text-base">${documentOwner.email}</p>
				</div>`,
				value: documentOwner._id
			}
		];
	}

	let users: { [key: string]: HydratedDocument<UserProperties> } = {};
	let autocompleteUsers: AutocompleteOption[] = [];
	let emptyState = 'Loading...';
	let regionEmpty = 'empty-autocomplete-list flex flex-col items-center'; // styling when autocomplete has no results
	let autoCompleteEmptyID = 'empty-autocomplete-list'; // use for checking if autocomplete has no results
	let autoCompleteDiv = 'auto-complete-div';

	let timer: NodeJS.Timeout; // timer to wait for user to stop inputing before loading users
	const waitTime = 500;

	/** Check if the Autocomplete component is empty. If empty load from the server */
	function onKeyup(event: any) {
		let container = document.getElementById(autoCompleteDiv);
		if (container?.querySelector('.' + autoCompleteEmptyID)) {
			clearTimeout(timer);
			timer = setTimeout(() => {
				loadUsers(event.target.value);
			}, waitTime);
		}
	}

	/** Loads from the server what the user has filled as input */
	async function loadUsers(query: string) {
		emptyState = 'Loading...';
		let usersResponse = (await trpc($page).users.getByDetails.query({
			searchTerm: query
		})) as HydratedDocument<UserProperties>[];

		if (usersResponse.length === 0) {
			emptyState = 'No Results Found.';
			return;
		}

		autocompleteUsers = [];

		for (const user of usersResponse) {
			let label = `<div>
							<p class="flex font-bold text-lg">${user.firstName}</p>
							<p class="text-base">${user.email}</p>
						</div>`;
			let value = user._id;
			autocompleteUsers.push({ label: label, value: value });
			users[user._id] = user as HydratedDocument<UserProperties>;
		}

		autocompleteUsers = autocompleteUsers;
	}

	/** Called when permission user is selected */
	function onUserSelect(event: any) {
		let userID = event.detail.value;

		let permission =
			new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>;
		permission._id = ulid();
		permission.user = users[userID];

		if (userID !== documentOwner._id) {
			permissions[userID] = permission;
			permissions = permissions;
		}
	}

	function removePermission(userID: string) {
		delete permissions[userID];
		permissions = permissions;
	}

	function createPermissionsDict() {
		if (permissionedDocument.permissions) {
			console.log('** perms docs');
			console.log(permissionedDocument.permissions);
			// Convert to map again because it comes to UI deserialized into JS object
			for (let [key, permission] of new Map(Object.entries(permissionedDocument.permissions))) {
				let userID = 'public';
				if (permission.user) {
					userID = typeof permission.user === 'string' ? permission.user : permission.user._id;
				}
				permissions[userID] = permission;
			}
		}

		// fill the users in from permissionsUsers
		for (const user of permissionedDocument.permissionsUsers ?? []) {
			permissions[user._id].user = user;
		}

		permissions = permissions;
	}

	/** An empty user means the permission is for the public */
	function onPublicAccessChange() {
		if ('' in permissions) {
			delete permissions[''];
			return;
		}

		let permission =
			new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>;
		permission._id = ulid();
		permission.public = true;
		permissions['public'] = permission;
	}

	function onPermissionChanged(event: any) {
		const userID = event.target.getAttribute('name');
		const value = event.target.value;
		console.log('** perm ' + userID + ' ' + value);
		permissions[userID]!.permission = value;
	}
</script>

<form
	on:submit|preventDefault
	class={`modal-example-form card p-4 w-modal w-full space-y-4 ${customClass}`}
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
			<div
				class="card p-2 w-2/5 xl:w-2/6 !z-10 !bg-surface-100-800-token"
				id={autoCompleteDiv}
				data-popup="popupAutocomplete"
			>
				<Autocomplete
					{emptyState}
					{regionEmpty}
					regionButton="btn-sm !rounded-md w-full"
					duration={0}
					bind:input={selectedUser}
					bind:options={autocompleteUsers}
					on:selection={onUserSelect}
				/>
			</div>
		</label>
		<div>
			People with access
			<div class="flex flex-col max-h-36 overflow-y-auto">
				<div class="flex p-2 justify-start items-center space-x-2">
					<Avatar
						class="z-0"
						src="https://source.unsplash.com/YOErFW8AfkI/32x32"
						rounded="rounded-full"
					/>
					<div class="flex-col flex justify-between">
						<h6 class="font-bold">{documentOwner.firstName}</h6>
						<small>{documentOwner.email}</small>
					</div>

					<div class="flex w-full justify-end">
						<button
							class="btn w-40 variant-filled space-x-12 line-clamp-1 justify-between bg-surface-400-500-token"
						>
							<span class="capitalize text-sm">Owner</span>
						</button>
					</div>
				</div>
				{#each Object.entries(permissions) as [id, permission]}
					{#if permission.user && typeof permission.user !== 'string'}
						<div class="flex p-2 justify-start items-center space-x-2">
							<Avatar src="https://source.unsplash.com/YOErFW8AfkI/32x32" rounded="rounded-full" />
							<div class="flex-col flex justify-between">
								<h6 class="font-bold">{permission.user.firstName}</h6>
								<small>{permission.user.email}</small>
							</div>

							<div class="flex w-full justify-end">
								<div class="flex-row btn-group variant-filled w-40">
									<button class="w-9/12" use:popup={permissionsPopupSettings(id)}>
										<span class="flex capitalize text-sm w-full">{permission.permission}</span>
										<Icon class="border-none" data={caretDown} scale={1} />
									</button>
									<!-- svelte-ignore a11y-click-events-have-key-events -->
									<span on:click={() => removePermission(id)} class="p-2 cursor-pointer w-3/12"
										><Icon data={trash} scale={1} /></span
									>
								</div>

								<div class="card shadow-xl py-2 !bg-surface-100-800-token z-10" data-popup={id}>
									<ListBox class="p-2 w-40 ">
										{#each PermissionsEnum as permissionType}
											<ListBoxItem
												bind:group={permission.permission}
												name={id}
												value={permissionType}
												on:change={onPermissionChanged}
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
			</div>
		</div>
		<hr class="!my-2 variant-fill-primary" />
		<div>
			Public access

			<div class="flex p-2 justify-start items-center space-x-2">
				<Avatar src="https://source.unsplash.com/YOErFW8AfkI/32x32" rounded="rounded-full" />
				<div class="flex-col w-full flex justify-between">
					<h6 class="font-bold">Public access</h6>
					<small>Publish for public viewing</small>
				</div>

				<div class="flex justify-end">
					<SlideToggle
						name="slider-large"
						background="bg-primary-800"
						checked={permissions['public']?.public}
						active="bg-primary-500"
						size="md"
						on:change={onPublicAccessChange}
					>
						{permissions['public'] ? 'On' : 'Off'}
					</SlideToggle>
				</div>
			</div>
		</div>
	</div>
</form>
