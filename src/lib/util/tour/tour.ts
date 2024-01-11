import Shepherd from 'shepherd.js';

export const tour = new Shepherd.Tour({
	useModalOverlay: true,
	defaultStepOptions: {
		classes: 'card shadow-md !bg-surface-300-600-token',
		scrollTo: { block: 'end' }
	}
});

export const next = {
	text: 'Next',
	action: tour.next,
	classes: '!btn !variant-filled'
};

export const back = {
	text: 'Back',
	action: tour.back,
	classes: '!btn !variant-filled'
};

export const complete = {
	text: 'Done',
	action: tour.complete,
	classes: '!btn !variant-filled'
};

export const close = {
	text: 'x',
	action: tour.complete,
	classes:
		'!btn-icon !btn-icon-sm absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 variant-filled hover:!variant-filled-primary'
};

export function getShepherdStep(
	elementID: string | undefined,
	position: Shepherd.Step.PopperPlacement,
	text: string,
	buttons: Shepherd.Step.StepOptionsButton[]
): Shepherd.Step.StepOptions {
	buttons.push(close);
	return {
		text: text,
		attachTo: {
			element: `#${elementID ?? ''}`,
			on: position
		},
		showOn: () => {
			return elementID ? (document.getElementById(elementID) ? true : false) : true;
		},
		classes: 'p-2',
		buttons: buttons
	};
}
