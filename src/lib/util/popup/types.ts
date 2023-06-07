import type { PopupSettings as SuperPopupSettings } from '@skeletonlabs/skeleton';

export interface PopupSettings extends Omit<SuperPopupSettings, 'event'> {
	event: 'click' | 'hover' | 'focus-blur' | 'focus-click' | 'hover-popup';
}
