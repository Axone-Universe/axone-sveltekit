import { popup as super_pop } from '@skeletonlabs/skeleton';
import type { PopupSettings as SuperPopupSettings } from '@skeletonlabs/skeleton';
import type { PopupSettings } from './types';

export function popup(node: HTMLElement, args: PopupSettings) {
	const superArgs: SuperPopupSettings = {
		event: args.event === 'hover-popup' ? 'focus-click' : args.event,
		target: args.target,
		placement: args.placement,
		closeQuery: args.placement
	};

	super_pop(node, superArgs);

	if (args.event !== 'hover-popup' || !args.event || !args.target) {
		return;
	}

	// get the popup and add a mouseout event listener
	const elemPopup: HTMLElement =
		document.querySelector(`[data-popup="${args.target}"]`) ?? document.createElement('div');

	let closePopup = true;

	setClosePopup(node);
	setClosePopup(elemPopup);

	function setClosePopup(node: HTMLElement) {
		node.addEventListener('mouseover', open, false);
		node.addEventListener('mouseleave', close, false);
	}

	function open(event: Event) {
		const node = event.currentTarget as HTMLElement;
		node.focus();

		closePopup = false;
	}

	function close(event: Event) {
		if (event.currentTarget !== event.target) {
			return;
		}

		const node = event.currentTarget as HTMLElement;
		node.blur();

		closePopup = true;

		// if we move to either the button or the popup then do not close
		setTimeout(() => {
			if (closePopup) {
				elemPopup.style.opacity = '0';
				elemPopup.style.display = 'none';
			}
		}, 100);
	}
}
