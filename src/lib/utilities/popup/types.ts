import type { PopupSettings as SuperPopupSettings} from '@skeletonlabs/skeleton';

export interface PopupSettings extends Omit<SuperPopupSettings, 'event'>{
	event: 'click' | 'hover' | 'hover-click' | 'focus' | 'focus-click' | 'hover-popup';
}