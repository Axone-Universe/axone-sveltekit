import Shepherd from 'shepherd.js';

export const getTour = () => {
	return new Shepherd.Tour({
		useModalOverlay: true,
		defaultStepOptions: {
			classes: 'card shadow-md !bg-surface-300-600-token',
			scrollTo: { block: 'end' }
		}
	});
};

export const next = (tour: Shepherd.Tour) => {
	return {
		text: 'Next',
		action: tour.next,
		classes: '!btn !variant-filled'
	};
};

export const back = (tour: Shepherd.Tour) => {
	return {
		text: 'Back',
		action: tour.back,
		classes: '!btn !variant-filled'
	};
};

export const complete = (tour: Shepherd.Tour) => {
	return {
		text: 'Done',
		action: tour.complete,
		classes: '!btn !variant-filled'
	};
};

export const close = (tour: Shepherd.Tour) => {
	return {
		text: '❌',
		action: tour.complete,
		classes:
			'!btn-icon !btn-icon-sm absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 emoji-cross !bg-surface-900'
	};
};

export function getShepherdStep(
	tour: Shepherd.Tour,
	elementID: string | undefined,
	position: Shepherd.Step.PopperPlacement,
	text: string,
	buttons: Shepherd.Step.StepOptionsButton[]
): Shepherd.Step.StepOptions {
	buttons.push(close(tour));
	return {
		text: text,
		attachTo: {
			element: `#${elementID ?? ''}`,
			on: position
		},
		showOn: () => {
			return elementID ? (document.getElementById(elementID) ? true : false) : true;
		},
		classes: 'p-2 m-2 md:m-0 [&>.shepherd-arrow:before]:!rounded-t-sm',
		buttons: buttons
	};
}

export function getBaseURL(page: any) {
	let baseUrl = page.url.toString().replace(page.url.search, '');

	for (const param in page.params) {
		baseUrl = baseUrl.replace(page.params[param], '');
	}

	return baseUrl;
}

export function autoStartTour(tour: Shepherd.Tour, key: string) {
	const toured = localStorage.getItem(key) ?? undefined;
	if (!toured) {
		localStorage.setItem(key, 'true');
		tour.start();
	}
}
