<script lang="ts">
	import { AppBar, ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
    import { LightSwitch } from '@skeletonlabs/skeleton';
    import { AppRail, AppRailTile } from '@skeletonlabs/skeleton';
    import { Drawer, drawerStore } from '@skeletonlabs/skeleton';
    import type { DrawerSettings } from '@skeletonlabs/skeleton';

    import { writable, type Writable } from 'svelte/store';

    import { popup } from '../../utilities/popup/popup';
    import type { PopupSettings } from '../../utilities/popup/types';

    import type { SupabaseClient, Session } from '@supabase/supabase-js';
    
    import Icon from 'svelte-awesome';
    import {caretDown, navicon, leanpub, heartbeat, handshakeO, pencil} from 'svelte-awesome/icons';

	export let data: {supabase: SupabaseClient, session: Session | null}

    /**
     * App Bar settings
     */
    let genreValue: string;
    let collaborateValue: string;
    let creatorValue: string;
    
    // Settings for popups on app bar shown for larger screens
    const popupSettings = (target: string) => { 
        let settings : PopupSettings = 
        {
            event: 'hover-popup',
            target: target,
            placement: 'bottom'
        }
        return settings
    };

    const readPopupBox : PopupSettings = popupSettings('readPopupBox')
    const collaboratePopupBox : PopupSettings = popupSettings('collaboratePopupBox')
    const creatorsPopupBox : PopupSettings = popupSettings('creatorsPopupBox')

    /**
     * App Rail settings
     */
    // for storing selected app rail item on smaller screens
    const storeValue: Writable<number> = writable(0);
    let selectedTile: number;

    storeValue.subscribe(value => {
        selectedTile = value;
    });

    const drawerSettings: DrawerSettings = {
        id: 'example-3',
        bgDrawer: 'bg-surface-100-800-token',
        bgBackdrop: 'bg-gradient-to-tr from-indigo-500/50 via-purple-500/50 to-pink-500/50',
        width: 'w-[280px] md:w-[480px]',
        padding: 'p-4',
        rounded: 'rounded-xl',
    };

    function openDrawer(){
        drawerStore.open(drawerSettings);
    }
    
    /**
     * Logout event handler
     */
	const onLogoutButtonClick = async () => {
		await data.supabase.auth.signOut();
	};
</script>

<AppBar gridColumns="grid-cols-3" slotDefault="flex justify-center" slotTrail="place-content-end">
    <svelte:fragment slot="lead">
        <button class="md:hidden" on:click={openDrawer}>
            <Icon data="{navicon}" scale="{1.5}"/>
        </button>
        <a href="/">
            <img alt="logo" class="hidden md:inline-block text-xl uppercase w-16 md:w-36" src="/images/logo_circle_transparent.png">
        </a>
    </svelte:fragment>
    <AppBar padding="p-2" class="hidden md:inline-block">
        <svelte:fragment slot="lead">
            <div>
                <button class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none" use:popup={readPopupBox}>
                    <span class="capitalize">Read</span>
                    <Icon data="{caretDown}" />
                </button>
                
                <div class="card p-4 w-fit " data-popup="readPopupBox">
                    <div class="grid grid-cols-2 gap-2">
                        <nav class="list-nav">
                            <ul class="list">
                                <li>
                                    <a href="/genres/sci-fi" class="w-full">Sci-Fi</a>
                                </li>
                                <li>
                                    <a href="/genres/fantasy" class="w-full">Fantasy</a>
                                </li>
                                <li>
                                    <a href="/genres/mystery" class="w-full">Mystery</a>
                                </li>
                                <li>
                                    <a href="/genres/action" class="w-full">Action</a>
                                </li>
                                <li>
                                    <a href="/genres/horror" class="w-full">Horror</a>
                                </li>
                            </ul>
                        </nav>
                        <nav class="list-nav">
                            <ul class="list">
                                <li>
                                    <a href="/genres/humor" class="w-full">Humor</a>
                                </li>
                                <li>
                                    <a href="/genres/erotica" class="w-full">Erotica</a>
                                </li>
                                <li>
                                    <a href="/genres/thriller" class="w-full">Thriller</a>
                                </li>
                                <li>
                                    <a href="/genres/romance" class="w-full">Romance</a>
                                </li>
                                <li>
                                    <a href="/genres/children" class="w-full">Children</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    <div class="arrow bg-surface-100-800-token" />
                </div>
                
            </div>

            <div>
                <button class="btn justify-between hover:variant-soft-primary">
                    <span class="capitalize">Trending</span>
                </button>
            </div>

            <div>
                <button class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none" use:popup={collaboratePopupBox}>
                    <span class="capitalize">Collaborate</span>
                    <Icon data="{caretDown}" />
                </button>

                <div id="card" class="card p-4 w-fit shadow-xl" data-popup="collaboratePopupBox">
                    <div class="grid grid-cols-1">
                        <nav class="list-nav">
                            <ul class="list">
                                <li>
                                    <a href="/open-calls" class="w-full">Open Calls</a>
                                </li>
                                <li>
                                    <a href="/campaigns" class="w-full">Campaigns</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    <div class="arrow bg-surface-100-800-token" />
                </div>
            </div>
            
            <div>
                <button class="btn outline-none hover:variant-soft-primary [&>*]:pointer-events-none" use:popup={creatorsPopupBox}>
                    <span class="capitalize">Creators</span>
                    <Icon data="{caretDown}" />
                </button>
                
                <div class="card p-4 w-fit shadow-xl" data-popup="creatorsPopupBox">
                    <div class="grid grid-cols-1">
                        <nav class="list-nav">
                            <ul class="list">
                                <li>
                                    <a href="/authors" class="w-full">Authors</a>
                                </li>
                                <li>
                                    <a href="/illustrators" class="w-full">Illustrators</a>
                                </li>
                                <li>
                                    <a href="/editors" class="w-full">Editors</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
                <div class="arrow bg-surface-100-800-token" />
            </div>
        </svelte:fragment>
    </AppBar>
    <svelte:fragment slot="trail">
        {#if data.session && data.session.user}
            <button class="btn variant-filled-primary" on:click={onLogoutButtonClick}>Logout</button>
        {:else}
            <div class="flex gap-2">
                <a class="btn variant-filled-primary" href="/login"> Login </a>
                <a class="hidden lg:inline-block btn variant-filled-primary" href="sign-up"> Sign up </a>
            </div>
        {/if}
        <LightSwitch/>
    </svelte:fragment>
</AppBar>

<Drawer>
    <div class="grid grid-cols-3 h-full">
        <AppRail class="col-span-1 w-full border-r border-surface-500/30" selected={storeValue}>
            <AppRailTile label="Read" value={0}> <Icon data="{leanpub}" scale="{1.5}"/> </AppRailTile>
            <AppRailTile label="Trending" value={1}><Icon data="{heartbeat}" scale="{1.5}"/></AppRailTile>
            <AppRailTile label="Collaborate" value={2}><Icon data="{handshakeO}" scale="{1.5}"/></AppRailTile>
            <AppRailTile label="Creators" value={3}><Icon data="{pencil}" scale="{1.5}"/></AppRailTile>
        </AppRail>
        <section hidden={selectedTile!=0} class="col-span-2 m-4">
            <div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">Genres</div>
            <hr class="!my-6 opacity-50">
            <nav class="list-nav">
                <ul class="list">
                    <li>
                        <a href="/genres/sci-fi" class="w-full">Sci-Fi</a>
                    </li>
                    <li>
                        <a href="/genres/fantasy" class="w-full">Fantasy</a>
                    </li>
                    <li>
                        <a href="/genres/mystery" class="w-full">Mystery</a>
                    </li>
                    <li>
                        <a href="/genres/action" class="w-full">Action</a>
                    </li>
                    <li>
                        <a href="/genres/horror" class="w-full">Horror</a>
                    </li>
                    <li>
                        <a href="/genres/humor" class="w-full">Humor</a>
                    </li>
                    <li>
                        <a href="/genres/erotica" class="w-full">Erotica</a>
                    </li>
                    <li>
                        <a href="/genres/thriller" class="w-full">Thriller</a>
                    </li>
                    <li>
                        <a href="/genres/romance" class="w-full">Romance</a>
                    </li>
                    <li>
                        <a href="/genres/children" class="w-full">Children</a>
                    </li>
                </ul>
            </nav>
        </section>
        <section hidden={selectedTile!=2} class="m-4 col-span-2">
            <div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">Collaborate</div>
            <hr class="!my-6 opacity-50">
            <nav class="list-nav">
                <ul class="list">
                    <li>
                        <a href="/open-calls" class="w-full">Open Calls</a>
                    </li>
                    <li>
                        <a href="/campaigns" class="w-full">Campaigns</a>
                    </li>
                </ul>
            </nav>
        </section>
        <section hidden={selectedTile!=3} class="m-4 col-span-2">
            <div id="elements" class="text-primary-700 dark:text-primary-500 font-bold uppercase px-4">Creators</div>
            <hr class="!my-6 opacity-50">
            <nav class="list-nav">
                <ul class="list">
                    <li>
                        <a href="/authors" class="w-full">Authors</a>
                    </li>
                    <li>
                        <a href="/illustrators" class="w-full">Illustrators</a>
                    </li>
                    <li>
                        <a href="/editors" class="w-full">Editors</a>
                    </li>
                </ul>
            </nav>
        </section>
    </div>
</Drawer>

