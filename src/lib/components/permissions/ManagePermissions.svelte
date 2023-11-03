<script lang="ts">
	import { Avatar, ListBox, ListBoxItem, Autocomplete, popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings, AutocompleteOption } from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import {
		PermissionsEnum,
		type PermissionProperties,
		PermissionPropertyBuilder,
		type PermissionedDocument
	} from '$lib/properties/permission';
	import { UserPropertyBuilder, type UserProperties } from '$lib/properties/user';
	import type { BookProperties } from '$lib/properties/book';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import { Icon } from 'svelte-awesome';
	import { caretDown, trash } from 'svelte-awesome/icons';
	import { afterUpdate, onMount } from 'svelte';
	import { ulid } from 'ulid';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import type { UserNotificationProperties } from '$lib/properties/notification';

	export let permissionedDocument:
		| HydratedDocument<BookProperties>
		| HydratedDocument<ChapterProperties>
		| HydratedDocument<StorylineProperties>;
	export let notifications: { [key: string]: UserNotificationProperties } = {};
	export let permissionedDocumentType: PermissionedDocument;
	let customClass = '';
	export { customClass as class };

	let permissions: Record<
		string,
		HydratedDocument<PermissionProperties>
	> = permissionedDocument.permissions;

	let documentOwner: HydratedDocument<UserProperties> =
		permissionedDocument.user as HydratedDocument<UserProperties>; // creator of the document

	let publicPermission: HydratedDocument<PermissionProperties> =
		permissions['public'] ??
		(new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>);

	onMount(() => {
		setDocumentOwner();
		setPermissionUsers();
	});

	afterUpdate(() => {
		permissions = permissions;
	});

	function documentURL(): string {
		let url = '';
		switch (permissionedDocumentType) {
			case 'Book': {
				let book = permissionedDocument as HydratedDocument<BookProperties>;

				url = `book/${book._id}`;
				break;
			}

			case 'Storyline': {
				let storyline = permissionedDocument as HydratedDocument<StorylineProperties>;
				let bookId = '';

				if (typeof storyline.book === 'string') bookId = storyline.book;
				if (typeof storyline.book !== 'string') bookId = storyline.book!._id;

				url = `/editor/${bookId}?mode=reader&storylineID=${storyline._id}`;
				break;
			}

			case 'Chapter': {
				let chapter = permissionedDocument as HydratedDocument<ChapterProperties>;

				let bookId = '';
				if (typeof chapter.book === 'string') bookId = chapter.book;
				if (typeof chapter.book !== 'string') bookId = chapter.book!._id;

				let storylineId = '';
				if (typeof chapter.storyline === 'string') storylineId = chapter.storyline;
				if (typeof chapter.storyline !== 'string') storylineId = chapter.storyline!._id;

				url = `/editor/${bookId}?mode=reader&storylineID=${storylineId}&chapterID=${chapter._id}`;
				break;
			}
		}

		return url;
	}

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
			documentOwner.firstName = $page.data.user.firstName;
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

	function setPermissionUsers() {
		for (const user of permissionedDocument.permissionsUsers ?? []) {
			permissions[user._id].user = user;
		}
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
			id: query
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
			notifications[userID] = {
				senderName: documentOwner.firstName!,
				receiverID: userID,
				receiverName: permission.user.firstName!,
				receiverEmail: permission.user.email!,
				url: documentURL(),
				notification: `${documentOwner.firstName!} has requested you to collaborate on the ${permissionedDocumentType} '${
					permissionedDocument.title
				}'!`
			};
		}
	}

	function removePermission(userID: string) {
		delete permissions[userID];
		delete notifications[userID];
		permissions = permissions;
	}

	/** An empty user means the permission is for the public */
	function onPublicAccessChange() {
		if (permissions['public']) {
			delete permissions['public'];
			permissions = permissions;
		} else {
			permissions['public'] = publicPermission;
		}
	}

	function onPermissionChanged(event: any) {
		const userID = event.target.getAttribute('name');
		const value = event.target.value;
		permissions[userID]!.permission = value;
	}
</script>

<div class={`card w-full ${customClass}`}>
	<div class="space-y-4 rounded-container-token p-2">
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
				class="card p-2 max-h-48 overflow-auto w-2/5 xl:w-3/8 !z-10 !bg-surface-100-800-token"
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
				<div class="flex justify-between items-center">
					<div class="flex items-center gap-2">
						<Avatar
							src="https://source.unsplash.com/YOErFW8AfkI/32x32"
							width="w-8 sm:w-10 aspect-square"
							rounded="rounded-full"
						/>
						<div class="flex flex-col">
							<h6 class="font-bold">{documentOwner.firstName}</h6>
							<small class="text-[10px] sm:text-sm">{documentOwner.email}</small>
						</div>
					</div>
					<button class="btn btn-sm variant-filled bg-surface-400-500-token">Owner</button>
				</div>
				{#each Object.entries(permissions) as [id, permission]}
					{#if permission.user && typeof permission.user !== 'string'}
						<div class="flex justify-between items-center">
							<div class="flex items-center gap-2">
								<Avatar
									src="https://source.unsplash.com/YOErFW8AfkI/32x32"
									width="w-8 sm:w-10 aspect-square"
									rounded="rounded-full"
								/>
								<div class="flex flex-col">
									<h6 class="font-bold">{permission.user.firstName}</h6>
									<small class="text-[10px] sm:text-sm">{permission.user.email}</small>
								</div>
							</div>
							<div class="flex-row btn-group variant-filled">
								<button use:popup={permissionsPopupSettings(id)}>
									<span class="capitalize text-xs">{permission.permission}</span>
									<Icon class="border-none" data={caretDown} scale={1} />
								</button>
								<button on:click={() => removePermission(id)} class="!py-2 !px-3">
									<Icon data={trash} scale={1} />
								</button>
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
					{/if}
				{/each}
			</div>
		</div>
		<hr class="!my-2 variant-fill-primary" />
		<div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2">
			<div class="flex-col w-full flex justify-between">
				<h6>Public access</h6>
				<small>Publish for public viewing or collaboration</small>
			</div>

			<div>
				<div class="flex-row btn-group variant-filled">
					<button
						use:popup={permissionsPopupSettings('permissionsPopup')}
						disabled={!('public' in permissions)}
					>
						<span class="capitalize text-xs">{publicPermission.permission}</span>
						<Icon class="border-none" data={caretDown} scale={1} />
					</button>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<span on:click={() => onPublicAccessChange()} class="!py-1 !px-3">
						<input
							class="radio"
							type="radio"
							checked={'public' in permissions}
							name="radio-direct"
							value="1"
						/>
					</span>
				</div>

				<div
					class="card shadow-xl py-2 !bg-surface-100-800-token z-10"
					data-popup={'permissionsPopup'}
				>
					<ListBox class="p-2 w-40 ">
						{#each PermissionsEnum as permissionType}
							<ListBoxItem
								bind:group={publicPermission.permission}
								name={'public'}
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
	</div>
</div>
