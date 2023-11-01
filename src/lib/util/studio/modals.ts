import type { ModalSettings } from '@skeletonlabs/skeleton';

export function getArchiveModal(): ModalSettings {
	return {
		type: 'confirm',
		title: 'Confirm Archive',
	};
}

export function getUnarchiveModal(): ModalSettings {
	return {
		type: 'confirm',
		title: 'Confirm Unarchive',
	};
}
