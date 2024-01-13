<script lang="ts">
	import { AppRail, AppRailTile, getDrawerStore } from '@skeletonlabs/skeleton';
	import { Drawer } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome';
	import { leanpub, lineChart, handshakeO, pencil, user, trash } from 'svelte-awesome/icons';
	import { collaborateMenuList, creatorsMenuList, readMenuList } from '$lib/util/links';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';
	import { page } from '$app/stores';

	export let data: { supabase: SupabaseClient; session: Session | null };

	let selectedTile: number = 0;

	const drawerStore = getDrawerStore();
	const onLogoutButtonClick = async () => {
		await data.supabase.auth.signOut();
	};
</script>

<Drawer zIndex="z-[1000]">
	{#if $drawerStore.id === 'landing'}
		<div class="grid grid-cols-3 h-full z-50">
			<AppRail class="col-span-1 w-full border-r border-surface-500/30">
				<div class="h-full flex flex-col justify-between">
					<div>
						<AppRailTile bind:group={selectedTile} name="read" title="Read" value={0}>
							<Icon data={leanpub} scale={1.5} />
						</AppRailTile>
						<AppRailTile bind:group={selectedTile} name="trending" title="Trending" value={1}>
							<Icon data={lineChart} scale={1.5} />
						</AppRailTile>
						<AppRailTile bind:group={selectedTile} name="collaborate" title="Collaborate" value={2}>
							<Icon data={handshakeO} scale={1.5} />
						</AppRailTile>
						<AppRailTile bind:group={selectedTile} name="creators" title="Creators" value={3}>
							<Icon data={pencil} scale={1.5} />
						</AppRailTile>
					</div>
					<AppRailTile bind:group={selectedTile} name="profile" title="Profile" value={4}>
						<Icon data={user} scale={1.5} />
					</AppRailTile>
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
								<a
									class="w-full"
									href={`/profile/${data.session.user.id}`}
									on:click={drawerStore.close}
								>
									Profile
								</a>
							</li>
							<li>
								<a class="w-full" href={`/library`} on:click={drawerStore.close}> Library </a>
							</li>
							<li>
								<a class="w-full" href={`/studio`} on:click={drawerStore.close}>Studio</a>
							</li>
							<li>
								<button
									class="w-full"
									on:click={() => {
										onLogoutButtonClick();
										drawerStore.close();
									}}
								>
									Logout
								</button>
							</li>
						{:else}
							<li>
								<a class="w-full" href="/login" on:click={drawerStore.close}>Login</a>
							</li>
						{/if}
					</ul>
				</nav>
			</section>
		</div>
	{:else if $drawerStore.id === 'library'}
		<div
			class="h-full sticky flex flex-col justify-between bg-surface-100-800-token pt-4 p-2 gap-2"
		>
			<div class="flex flex-col gap-2">
				{#each $drawerStore.meta.readingLists as list}
					<button
						class="flex justify-between items-center btn btn-sm {$drawerStore.meta.selectedList ===
						list
							? 'variant-filled-primary'
							: 'variant-filled'} py-1"
						on:click={() => {
							$drawerStore.meta.selectedList = list;
							$drawerStore.meta.selectList(list);
							drawerStore.close();
						}}
					>
						<p class="truncate w-full text-left">
							{list}
						</p>
						<div class="flex">
							<button
								class="btn-icon btn-icon-sm"
								on:click={() => {
									drawerStore.close();
									$drawerStore.meta.handleRenameReadingList(list);
								}}
							>
								<Icon data={pencil} scale={1.2} />
							</button>
							<button
								class="btn-icon btn-icon-sm"
								on:click={() => {
									drawerStore.close();
									$drawerStore.meta.handleDeleteReadingList(list);
								}}
							>
								<Icon data={trash} scale={1.2} />
							</button>
						</div>
					</button>
				{/each}
			</div>
			<button
				class="btn variant-filled-secondary"
				on:click={() => {
					drawerStore.close();
					$drawerStore.meta.handleCreateReadingList();
				}}
			>
				+
			</button>
		</div>
	{:else if $drawerStore.id === 'studio'}
		<div
			class="h-screen sticky top-16 flex flex-col w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-2 gap-2"
		>
			<a
				class="btn {$page.url.pathname === '/studio/books'
					? 'variant-filled-primary'
					: 'variant-filled'}"
				href="/studio/books"
				on:click={drawerStore.close}
			>
				Books
			</a>
			<a
				class="btn {$page.url.pathname === '/studio/storylines'
					? 'variant-filled-primary'
					: 'variant-filled'}"
				href="/studio/storylines"
				on:click={drawerStore.close}
			>
				Storylines
			</a>
			<a
				class="btn {$page.url.pathname === '/studio/chapters'
					? 'variant-filled-primary'
					: 'variant-filled'}"
				href="/studio/chapters"
				on:click={drawerStore.close}
			>
				Chapters
			</a>
		</div>
	{/if}
</Drawer>
