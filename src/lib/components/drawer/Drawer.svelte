<script lang="ts">
	import { AppRail, AppRailTile, drawerStore } from '@skeletonlabs/skeleton';
	import { Drawer } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome';
	import { leanpub, lineChart, handshakeO, pencil, user } from 'svelte-awesome/icons';
	import { collaborateMenuList, creatorsMenuList, readMenuList } from '$lib/util/links';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';

	export let data: { supabase: SupabaseClient; session: Session | null };

	let selectedTile: number;

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
								<a class="w-full" href={`/profile/${data.session.user.id}`}>Profile</a>
							</li>
							<li>
								<a class="w-full" href={`/library`}>Library</a>
							</li>
							<li>
								<button class="w-full" on:click={onLogoutButtonClick}>Logout</button>
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
	{:else if $drawerStore.id === 'library'}
		<div />
	{/if}
</Drawer>
