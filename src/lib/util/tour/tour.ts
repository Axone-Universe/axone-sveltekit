import Shepherd from 'shepherd.js';

export const tour = new Shepherd.Tour({
	useModalOverlay: true,
	defaultStepOptions: {
		classes: 'card shadow-md !bg-surface-300-600-token',
		scrollTo: true
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

export function step(
	elementID: string | undefined,
	position: Shepherd.Step.PopperPlacement,
	text: string,
	buttons: ReadonlyArray<Shepherd.Step.StepOptionsButton>
): Shepherd.Step.StepOptions {
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
