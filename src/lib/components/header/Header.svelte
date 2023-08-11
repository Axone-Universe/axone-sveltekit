<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { AppRail, AppRailTile } from '@skeletonlabs/skeleton';
	import { Drawer, drawerStore } from '@skeletonlabs/skeleton';
	import type { DrawerSettings } from '@skeletonlabs/skeleton';

	import { writable, type Writable } from 'svelte/store';
	import { onMount } from 'svelte';

	import Logo from '$lib/assets/logo.svelte';
	import { popup } from '../../util/popup/popup';
	import type { PopupSettings } from '../../util/popup/types';

	import type { SupabaseClient, Session } from '@supabase/supabase-js';

	import Icon from 'svelte-awesome';
	import {
		caretDown,
		navicon,
		leanpub,
		lineChart,
		handshakeO,
		pencil,
		user
	} from 'svelte-awesome/icons';

	export let data: { supabase: SupabaseClient; session: Session | null };

	/**
	 * parameters and methods for the nav header
	 * @param target
	 */
	const popupSettings = (target: string) => {
		let settings: PopupSettings = {
			event: 'hover-popup',
			target: target,
			placement: 'bottom'
		};
		return settings;
	};

	const readPopupBox: PopupSettings = popupSettings('readPopupBox');
	const collaboratePopupBox: PopupSettings = popupSettings('collaboratePopupBox');
	const creatorsPopupBox: PopupSettings = popupSettings('creatorsPopupBox');
	const profilePopupBox: PopupSettings = popupSettings('profilePopupBox');

	const readMenuList = [
		{ url: '/genres/sci-fi', label: 'Sci-Fi' },
		{ url: '/genres/fantasy', label: 'Fantasy' },
		{ url: '/genres/mystery', label: 'Mystery' },
		{ url: '/genres/action', label: 'Action' },
		{ url: '/genres/horror', label: 'Horror' },
		{ url: '/genres/humor', label: 'Humor' },
		{ url: '/genres/erotica', label: 'Erotica' },
		{ url: '/genres/thriller', label: 'Thriller' },
		{ url: '/genres/romance', label: 'Romance' },
		{ url: '/genres/children', label: 'Children' }
	];

	const collaborateMenuList = [
		{ url: '/open-calls', label: 'Open Calls' },
		{ url: '/campaigns', label: 'Campaigns' }
	];

	const creatorsMenuList = [
		{ url: '/authors', label: 'Authors' },
		{ url: '/illustrators', label: 'Illustrators' },
		{ url: '/editors', label: 'Editors' }
	];

	/**
	 * App Rail settings
	 */
	// for storing selected app rail item on smaller screens
	const storeValue: Writable<number> = writable(0);
	let selectedTile: number;

	storeValue.subscribe((value) => {
		selectedTile = value;
	});

	const drawerSettings: DrawerSettings = {
		id: 'example-3',
		bgDrawer: 'bg-surface-100-800-token',
		bgBackdrop: 'bg-gradient-to-tr from-indigo-500/50 via-purple-500/50 to-pink-500/50',
		width: 'w-4/6 md:w-1/4',
		padding: 'p-4',
		rounded: 'rounded-xl'
	};

	function openDrawer() {
		drawerStore.open(drawerSettings);
	}

	onMount(() => {
		drawerStore.close();
	});

	/**
	 * Logout event handler
	 */
	const onLogoutButtonClick = async () => {
		await data.supabase.auth.signOut();
	};
</script>

<AppBar
	gridColumns="grid-cols-3"
	slotDefault="flex justify-center"
	slotTrail="place-content-end"
	padding="px-4"
>
	<svelte:fragment slot="lead">
		<button class="lg:hidden" on:click={openDrawer}>
			<Icon data={navicon} scale={1.5} />
		</button>
		<a
			class="hidden lg:flex items-center text-l"
			href={data.session && data.session.user.id ? '/home' : '/'}
		>
			<Logo />
			<span class="logo-name">AXONE</span>
		</a>
	</svelte:fragment>
	<div class="hidden lg:flex">
		<div>
			<button
				class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
				use:popup={readPopupBox}
			>
				<span class="capitalize">Read</span>
				<Icon data={caretDown} />
			</button>

			<div class="card p-4 w-fit" data-popup="readPopupBox">
				<nav class="list-nav">
					<ul class="grid grid-cols-2 gap-2 list">
						{#each readMenuList as menuItem}
							<li>
								<a href={menuItem.url} class="w-full">{menuItem.label}</a>
							</li>
						{/each}
					</ul>
				</nav>
				<div class="arrow bg-surface-100-800-token" />
			</div>
		</div>

		<div>
			<button class="btn justify-between hover:variant-soft-primary">
				<span class="capitalize">Trending</span>
			</button>
		</div>

		<div>
			<button
				class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
				use:popup={collaboratePopupBox}
			>
				<span class="capitalize">Collaborate</span>
				<Icon data={caretDown} />
			</button>

			<div id="card" class="card p-4 w-fit shadow-xl" data-popup="collaboratePopupBox">
				<div class="grid grid-cols-1">
					<nav class="list-nav">
						<ul class="grid grid-cols-1 gap-2 list">
							{#each collaborateMenuList as menuItem}
								<li>
									<a href={menuItem.url} class="w-full">{menuItem.label}</a>
								</li>
							{/each}
						</ul>
					</nav>
				</div>
				<div class="arrow bg-surface-100-800-token" />
			</div>
		</div>

		<div>
			<button
				class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
				use:popup={creatorsPopupBox}
			>
				<span class="capitalize">Creators</span>
				<Icon data={caretDown} />
			</button>

			<div class="card p-4 w-fit shadow-xl" data-popup="creatorsPopupBox">
				<div class="grid grid-cols-1">
					<nav class="list-nav">
						<ul class="grid grid-cols-1 gap-2 list">
							{#each creatorsMenuList as menuItem}
								<li>
									<a href={menuItem.url} class="w-full">{menuItem.label}</a>
								</li>
							{/each}
						</ul>
					</nav>
				</div>
				<div class="arrow bg-surface-100-800-token" />
			</div>
		</div>
	</div>
	<a
		class="lg:hidden flex items-center text-l"
		href={data.session && data.session.user.id ? '/home' : '/'}
	>
		<Logo />
		<span class="logo-name">AXONE</span>
	</a>
	<svelte:fragment slot="trail">
		<div class="flex gap-2 items-center">
			<div class="lg:flex gap-2 hidden">
				{#if data.session && data.session.user}
					<a
						href="/book/create"
						class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
						><Icon data={pencil} />
						<span class="hidden md:inline-block">Write</span>
					</a>

					<div>
						<button
							class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
							use:popup={profilePopupBox}
						>
							<Icon data={user} />
							<p class="w-[100px] text-ellipsis line-clamp-1 md:inline-block">
								{data.session.user.email}
							</p>
							<Icon data={caretDown} />
						</button>

						<div class="card p-4 shadow-xl" data-popup="profilePopupBox">
							<div class="grid grid-cols-1">
								<a class="btn hover:variant-soft-primary" href={`/profile/${data.session.user.id}`}
									>Profile</a
								>
								<hr class="!my-2 variant-fill-primary" />
								<button class="btn hover:variant-soft-primary" on:click={onLogoutButtonClick}
									>Logout</button
								>
							</div>
							<div class="arrow bg-surface-100-800-token" />
						</div>
					</div>
				{:else}
					<a class="btn variant-filled-primary" href="/login"> Login </a>
				{/if}
			</div>
			<LightSwitch />
		</div>
	</svelte:fragment>
</AppBar>

<Drawer>
	<div class="grid grid-cols-3 h-full">
		<AppRail class="col-span-1 w-full border-r border-surface-500/30" selected={storeValue}>
			<div class="h-full flex flex-col justify-between">
				<div>
					<AppRailTile label="Read" value={0}><Icon data={leanpub} scale={1.5} /></AppRailTile>
					<AppRailTile label="Trending" value={1}><Icon data={lineChart} scale={1.5} /></AppRailTile
					>
					<AppRailTile label="Collaborate" value={2}
						><Icon data={handshakeO} scale={1.5} /></AppRailTile
					>
					<AppRailTile label="Creators" value={3}><Icon data={pencil} scale={1.5} /></AppRailTile>
				</div>
				<AppRailTile label="Profile" value={4}><Icon data={user} scale={1.5} /></AppRailTile>
			</div>
		</AppRail>
		<section hidden={selectedTile != 0} class="m-4 col-span-2">
			<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
				Read
			</div>
			<hr class="my-3 opacity-50" />
			<nav class="list-nav">
				<ul class="list">
					{#each readMenuList as menuItem}
						<li>
							<a href={menuItem.url} class="w-full">{menuItem.label}</a>
						</li>
					{/each}
				</ul>
			</nav>
		</section>
		<section hidden={selectedTile != 2} class="m-4 col-span-2">
			<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
				Collaborate
			</div>
			<hr class="my-3 opacity-50" />
			<nav class="list-nav">
				<ul class="list">
					{#each collaborateMenuList as menuItem}
						<li>
							<a href={menuItem.url} class="w-full">{menuItem.label}</a>
						</li>
					{/each}
				</ul>
			</nav>
		</section>
		<section hidden={selectedTile != 3} class="m-4 col-span-2">
			<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
				Creators
			</div>
			<hr class="my-3 opacity-50" />
			<nav class="list-nav">
				<ul class="list">
					{#each creatorsMenuList as menuItem}
						<li>
							<a href={menuItem.url} class="w-full">{menuItem.label}</a>
						</li>
					{/each}
				</ul>
			</nav>
		</section>
		<section hidden={selectedTile != 4} class="m-4 col-span-2">
			<div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">
				Profile
			</div>
			<hr class="my-3 opacity-50" />
			<nav class="list-nav">
				<ul class="list">
					{#if data.session && data.session.user}
						<li>
							<button class="w-full" on:click={onLogoutButtonClick}>okkk</button>
						</li>
						<li>
							<a class="w-full" href={`/profile/${data.session.user.id}`}>Profile</a>
						</li>
					{:else}
						<li>
							<a class="w-full" href="/login"> Login </a>
						</li>
					{/if}
				</ul>
			</nav>
		</section>
	</div>
</Drawer>

<style>
	@font-face {
		font-family: colortube;
		src: url('/fonts/color_tube.otf') format('opentype');
	}

	.logo-name {
		font-family: colortube;
		margin-bottom: -10px;
	}
</style>
