import { back, next, complete, getTour, getShepherdStep } from '$lib/util/tour/tour';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export const tour = getTour();

export function startTour(tour: Shepherd.Tour) {
	tour.start();
}

export function setupTour(tour: Shepherd.Tour) {
	tour.addStep(
		getShepherdStep(
			tour,
			'storylines-list',
			'bottom',
			'Select a storyline. The chapters of the storyline will be populated in the chapters list below.',
			[next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'chapters-list',
			'bottom',
			'Select a chapter. The editor will show the chapter content so that you can read and or edit it.',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'editor',
			'bottom',
			'Write your story! Highlight the text to show the text editing options.',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'view-storylines',
			'left',
			'Discover more storylines for this book/campaign!',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(tour, 'toggle-mode', 'left', 'Preview your chapter in Reading Mode.', [
			back(tour),
			next(tour)
		])
	);

	tour.addStep(
		getShepherdStep(tour, 'chapter-info', 'left', 'View or edit the chapter details.', [
			back(tour),
			next(tour)
		])
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'rate-storyline',
			'left',
			'Please do provide a rating after reading the story!',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'view-comments',
			'left',
			'View or edit inline comments for your chapter. Comments help you collaborate with editors and keep track of changes to make.',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'view-illustrations',
			'left',
			'View or edit inline illustrations for your chapter.',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'chapter-notes',
			'left',
			'View and edit your chapter notes. Notes help you keep track of your ideas about characters, places, props etc.',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'reading-lists',
			'left',
			'Manage your reading lists. Add storylines you want to read in the future to a reading list.',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'view-permissions',
			'left',
			'View the permissions you have for this chapter.',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'create-chapter',
			'left',
			'Add a new chapter for this storyline and be a co-author!',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'delete-chapter',
			'left',
			'Delete a chapter. Be careful, this action cannot be undone!',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'manage-history',
			'left',
			'Preview and restore previous versions of your chapter.',
			[back(tour), next(tour)]
		)
	);

	tour.addStep(
		getShepherdStep(
			tour,
			'auto-save',
			'left',
			'Shows if all changes to the chapter are saved. When it is green all changes have been saved.',
			[back(tour), complete(tour)]
		)
	);
}
