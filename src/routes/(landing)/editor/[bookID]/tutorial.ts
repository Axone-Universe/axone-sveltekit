import { back, next, complete, tour, getShepherdStep } from '$lib/util/tour/tour';
import 'shepherd.js/dist/css/shepherd.css';

export function startTour() {
	tour.start();
}

export function setupTour() {
	tour.addStep(
		getShepherdStep(
			'storylines-list',
			'bottom',
			'Select a storyline. The chapters of the storyline will be populated in the chapters list below.',
			[next]
		)
	);

	tour.addStep(
		getShepherdStep(
			'chapters-list',
			'bottom',
			'Select a chapter. The editor will show the chapter content so that you can read and or edit it.',
			[back, next]
		)
	);

	tour.addStep(
		getShepherdStep(
			'editor',
			'bottom',
			'Write your story! Highlight the text to show the text editing options.',
			[back, next]
		)
	);

	tour.addStep(
		getShepherdStep('chapter-info', 'left', 'View or edit the chapter details.', [back, next])
	);

	tour.addStep(
		getShepherdStep(
			'rate-storyline',
			'left',
			'Please do provide a rating after reading the story!',
			[back, next]
		)
	);

	tour.addStep(
		getShepherdStep(
			'view-comments',
			'left',
			'View or edit inline comments for your chapter. Comments help you collaborate with editors and keep track of changes to make.',
			[back, next]
		)
	);

	tour.addStep(
		getShepherdStep(
			'view-illustrations',
			'left',
			'View or edit inline illustrations for your chapter.',
			[back, next]
		)
	);

	tour.addStep(
		getShepherdStep(
			'chapter-notes',
			'left',
			'View and edit your chapter notes. Notes help you keep track of your ideas about characters, places, props etc.',
			[back, next]
		)
	);

	tour.addStep(
		getShepherdStep(
			'reading-lists',
			'left',
			'Manage your reading lists. Add storylines you want to read in the future to a reading list.',
			[back, next]
		)
	);

	tour.addStep(
		getShepherdStep('view-permissions', 'left', 'View the permissions you have for this chapter.', [
			back,
			next
		])
	);

	tour.addStep(
		getShepherdStep(
			'create-chapter',
			'left',
			'Add a new chapter for this storyline and be a co-author!',
			[back, next]
		)
	);

	tour.addStep(
		getShepherdStep(
			'delete-chapter',
			'left',
			'Delete a chapter. Be careful, this action cannot be undone!',
			[back, next]
		)
	);

	tour.addStep(
		getShepherdStep(
			'manage-history',
			'left',
			'Preview and restore previous versions of your chapter.',
			[back, next]
		)
	);

	tour.addStep(
		getShepherdStep(
			'auto-save',
			'left',
			'Shows if all changes to the chapter are saved. When it is green all changes have been saved.',
			[back, complete]
		)
	);
}
