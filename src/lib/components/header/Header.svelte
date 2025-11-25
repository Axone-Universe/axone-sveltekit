<script lang="ts">
	import { AppBar, getDrawerStore, modeCurrent, setModeCurrent } from '@skeletonlabs/skeleton';
	import type { DrawerSettings } from '@skeletonlabs/skeleton';

	import { onMount } from 'svelte';

	import Logo from '$lib/assets/logo.svelte';
	import { popup } from '../../util/popup/popup';
	import type { PopupSettings } from '../../util/popup/types';

	import type { SupabaseClient, Session } from '@supabase/supabase-js';
	import type { UserProperties } from '$lib/properties/user';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import {
		caretDown,
		dollar,
		listUl,
		navicon,
		pencil,
		powerOff,
		user,
		sunO,
		moonO,
		star
	} from 'svelte-awesome/icons';
	import { collaborateMenuList, creatorsMenuList, readMenuList } from '$lib/util/links';
	import NotificationCenter from '../notifications/NotificationCenter.svelte';
	import { goto } from '$app/navigation';
	import { StoreIcon } from 'lucide-svelte';

	export let data: {
		supabase: SupabaseClient;
		session: Session | null;
		user?: UserProperties | null;
	};

	$: isAmbassador = data.user?.ambassador ?? false;

	const drawerStore = getDrawerStore();

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

	const profilePopupBox: PopupSettings = popupSettings('profilePopupBox');

	const drawerSettings: DrawerSettings = {
		id: 'landing',
		bgDrawer: 'bg-surface-100-800-token',
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
		goto('');
	};

	/**
	 * Toggle theme handler
	 */
	const toggleTheme = () => {
		const newMode = !$modeCurrent;
		setModeCurrent(newMode);

		// Save to localStorage
		if (newMode) {
			localStorage.setItem('theme-mode', 'light');
		} else {
			localStorage.setItem('theme-mode', 'dark');
		}

		// The reactive statement above will handle the DOM update
	};
</script>

<div class="sticky top-0 z-50 w-full">
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
			<a class="hidden lg:!flex text-l" href={data.session && data.session.user.id ? '/home' : '/'}>
				<span class="flex flex-row h-20 items-center logo-name"><Logo />XONE</span>
			</a>
		</svelte:fragment>
		<div class="hidden lg:!flex">
			<div>
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
				<a
					href="/community"
					class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
				>
					<span class="capitalize">Community</span>
				</a>

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

			<div>
				<a
					href="/learn"
					class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
				>
					<span class="capitalize">Learn More</span>
				</a>
			</div>
			<div>
				<a
					href="/market"
					class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none variant-ghost-secondary p-2"
				>
					<StoreIcon size={20} />
					<span class="capitalize">NFT Market</span>
				</a>
			</div>
		</div>
		<a
			class="lg:hidden flex items-center text-l"
			href={data.session && data.session.user.id ? '/home' : '/'}
		>
			<span class="flex flex-row h-20 items-center logo-name"><Logo />XONE</span>
		</a>
		<svelte:fragment slot="trail">
			<div class="flex gap-2 items-center">
				<div class="lg:!flex gap-2 hidden">
					{#if data.session && data.session.user}
						<a
							id="write-btn"
							href="/book/create"
							class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none"
						>
							<Icon data={pencil} />
							<span class="hidden md:!inline-block">Write</span>
						</a>

						<div>
							<button
								id="email-btn"
								class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none variant-soft-secondary"
								use:popup={profilePopupBox}
							>
								<Icon data={user} />
								<p class="w-[100px] text-ellipsis line-clamp-1 md:inline-block">
									{data.session.user.email}
								</p>
								<Icon data={caretDown} />
							</button>

							<div class="card p-2 shadow-xl" data-popup="profilePopupBox">
								<div class="grid grid-cols-1">
									<a
										id="profile-btn"
										class="btn space-x-6 hover:variant-soft-primary justify-between"
										href={`/profile/${data.session.user.id}`}
									>
										<Icon data={user} />
										<span>Profile</span>
									</a>
									<hr class="!my-2 variant-fill-primary" />
									<a
										class="btn space-x-6 hover:variant-soft-primary justify-between"
										href={`/library`}
									>
										<Icon data={listUl} /><span>Library</span>
									</a>
									<hr class="!my-2 variant-fill-primary" />
									<a
										class="btn space-x-6 hover:variant-soft-primary justify-between"
										href={`/studio/books?campaigns=true`}
									>
										<Icon data={pencil} />
										<span>Studio</span>
									</a>
									<hr class="!my-2 variant-fill-primary" />
									<a
										class="btn space-x-6 hover:variant-soft-primary justify-between"
										href={`/monetize/earnings`}
									>
										<Icon data={dollar} />
										<span>Monetize</span>
									</a>
									<hr class="!my-2 variant-fill-primary" />
									{#if isAmbassador}
										<a
											class="btn space-x-6 hover:variant-soft-primary justify-between variant-soft-warning"
											href={`/ambassadors/referrals`}
										>
											<Icon data={star} />
											<span>Ambassadors</span>
										</a>
										<hr class="!my-2 variant-fill-primary" />
									{/if}
									<button
										class="btn space-x-6 hover:variant-soft-primary justify-between"
										on:click={onLogoutButtonClick}
										><Icon data={powerOff} />
										<span>Logout</span>
									</button>
								</div>
								<div class="arrow bg-surface-100-800-token" />
							</div>
						</div>
						<NotificationCenter />
					{:else}
						<a class="btn variant-filled-primary" href="/login"> Login </a>
					{/if}
				</div>

				<button
					id="theme-toggle"
					class="btn-icon variant-ghost-surface"
					on:click={toggleTheme}
					aria-label="Toggle theme"
					title={$modeCurrent ? 'Switch to dark mode' : 'Switch to light mode'}
				>
					<Icon data={$modeCurrent ? moonO : sunO} scale={1.2} />
				</button>
			</div>
		</svelte:fragment>
	</AppBar>
</div>
