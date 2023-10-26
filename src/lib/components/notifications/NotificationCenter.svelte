<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { HeadlessService, type IMessage } from '@novu/headless';
	import { ListBox, ListBoxItem, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import { Icon } from 'svelte-awesome';
	import { bell } from 'svelte-awesome/icons';
	import { PUBLIC_NOVU_APP_ID } from '$env/static/public';
	import TimeAgo from 'javascript-time-ago';
	import en from 'javascript-time-ago/locale/en';

	let pageNum = 0;
	let notifications: any[] = [];
	$: unreadNotifications = notifications.filter((notification) => {
		return !notification.read;
	});

	TimeAgo.addDefaultLocale(en);
	const timeAgo = new TimeAgo('en-US');

	const notificationsService = new HeadlessService({
		applicationIdentifier: PUBLIC_NOVU_APP_ID,
		subscriberId: $page.data.user._id
	});

	onMount(() => {
		initializeNotificationService();
	});

	function setNotifications(newNotifications: IMessage[]) {
		console.log('fetched notifs ' + newNotifications.length);
		console.log(newNotifications);
		notifications = newNotifications;
	}

	const popupSettings = (target: string) => {
		return {
			event: 'focus-click',
			target: target,
			placement: 'bottom'
		} as PopupSettings;
	};

	function initializeNotificationService() {
		notificationsService.initializeSession({
			listener: (res) => {
				console.log('Initialized Notifications Listener');
			},
			onSuccess: (session) => {
				console.log('Initialized Notifications');
				fetchNotifications();
			},
			onError: (error) => {
				console.log('headlessSice error:', error);
			}
		});
	}

	function fetchNotifications() {
		notificationsService.fetchNotifications({
			listener: ({ data, error, isError, isFetching, isLoading, status }) => {
				// Handle the state of the fetching process and errors here.
			},
			onSuccess: (response) => {
				// Handle the fetched notifications here.
				setNotifications(response.data); // Store notifications in the state
			},
			page: pageNum // page number to be fetched
		});
	}

	const markNotificationAsRead = (messageId: string) => {
		notificationsService.markNotificationsAsRead({
			messageId: messageId,
			onSuccess: function (message) {
				notifications = notifications.filter((notification) => {
					if (notification.id === messageId) {
						notification.read = true;
					}
					return notification;
				});
			},
			listener: (result) => {},
			onError: (error) => {
				console.error('Error marking notifications as read:', error);
			}
		});
	};

	const deleteNotification = (messageId: string) => {
		notificationsService.removeNotification({
			messageId: messageId,
			listener: function (result) {},
			onSuccess: function (message) {
				notifications = notifications.filter((notification) => {
					return notification.id !== messageId;
				});
			},
			onError: function (error) {
				console.error(error);
			}
		});
	};
</script>

<div class="flex w-fit justify-end">
	<div>
		<button use:popup={popupSettings('notifications')} type="button" class="m-2 btn-icon relative">
			<Icon data={bell} scale={1.2} />
			{#if unreadNotifications.length > 0}
				<span class="badge-icon z-10 variant-filled absolute -top-1 -right-1"
					>{unreadNotifications.length}</span
				>
			{/if}
		</button>
	</div>

	<div
		class="{notifications.length === 0
			? '!hidden'
			: ''} card w-8/12 md:w-5/12 lg:w-3/12 shadow-xl p-2 space-y-2 !bg-surface-100-800-token z-10"
		data-popup="notifications"
	>
		{#each notifications as notification}
			<aside class="flex alert flex-col variant-soft-surface space-y-2">
				<a class="w-full" href={notification.payload.url} target="_blank">
					<div class="alert-message">
						<h6>{notification.content}</h6>
						<p class="text-sm">{timeAgo.format(Date.parse(notification.createdAt))}</p>
					</div></a
				>
				<footer class="btn-group variant-filled">
					<button
						on:click={() => markNotificationAsRead(notification.id)}
						class="button"
						disabled={notification.read}>Read</button
					>
					<button on:click={() => deleteNotification(notification.id)} class="button">Delete</button
					>
				</footer>
			</aside>
		{/each}
	</div>
</div>
