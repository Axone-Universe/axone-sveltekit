<script lang="ts">
	import { Autocomplete, popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings, AutocompleteOption } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { type UserProperties } from '$lib/properties/user';

	export let onUserSelect: (event: any) => void;
	export let users: { [key: string]: HydratedDocument<UserProperties> } = {};
	export let defaultUser: HydratedDocument<UserProperties> | undefined = undefined;

	let customClass = '';
	export { customClass as class };

	let inputElement: HTMLInputElement;
	let dropdownElement: HTMLDivElement;

	let autocompletePopupSettings: PopupSettings = {
		event: 'click',
		target: 'popupAutocomplete',
		placement: 'bottom'
	};

	// Match dropdown width to input width
	onMount(() => {
		if (inputElement && dropdownElement) {
			const updateWidth = () => {
				dropdownElement.style.width = `${inputElement.offsetWidth}px`;
			};
			updateWidth();
			window.addEventListener('resize', updateWidth);
			return () => window.removeEventListener('resize', updateWidth);
		}
	});

	// Also update width when the popup opens
	function updateDropdownWidth() {
		if (inputElement && dropdownElement) {
			dropdownElement.style.width = `${inputElement.offsetWidth}px`;
		}
	}

	let selectedUser: string = '';
	let autocompleteUsers: AutocompleteOption[] = [
		...(defaultUser
			? [
					{
						label: `<div>
					<p class="flex font-bold text-lg">${defaultUser.firstName}</p>
					<p class="text-base">${defaultUser.email}</p>
				</div>`,
						value: defaultUser._id
					}
			  ]
			: [])
	];
	let emptyState = 'Search by name or email...';
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
		let usersResponse = await trpc($page).users.get.query({
			detail: query
		});

		emptyState = 'No Results Found.';

		const newUsers = usersResponse.data as HydratedDocument<UserProperties>[];

		if (newUsers.length === 0) {
			return;
		}

		autocompleteUsers = [];

		for (const user of newUsers) {
			let label = `<div class="flex flex-col items-start">
							<p class="flex font-bold text-lg">${user.firstName}</p>
							<p class="text-base">${user.email}</p>
						</div>`;
			let value = user._id;
			autocompleteUsers.push({ label: label, value: value });
			users[user._id] = user as HydratedDocument<UserProperties>;
		}

		autocompleteUsers = autocompleteUsers;
	}
</script>

<div class={`card w-full ${customClass}`}>
	<input
		bind:this={inputElement}
		id="permission-users-input"
		class="input autocomplete"
		type="search"
		name="autocomplete-search"
		bind:value={selectedUser}
		placeholder="Add people"
		use:popup={autocompletePopupSettings}
		on:keyup={onKeyup}
		on:click={updateDropdownWidth}
		on:focus={updateDropdownWidth}
		autocomplete="off"
	/>
	<div
		bind:this={dropdownElement}
		class="card p-2 max-h-48 overflow-auto !z-10 !bg-surface-100-800-token"
		id={autoCompleteDiv}
		data-popup="popupAutocomplete"
	>
		<Autocomplete
			{emptyState}
			{regionEmpty}
			regionButton="btn-sm !rounded-md w-full"
			regionList="!list-none"
			duration={0}
			bind:input={selectedUser}
			bind:options={autocompleteUsers}
			on:selection={onUserSelect}
		/>
	</div>
</div>
