import type { ModalSettings } from '@skeletonlabs/skeleton';

export function getArchiveModal(): ModalSettings {
	return {
		type: 'confirm',
		title: 'Confirm Archive',
		response: (r: boolean) => console.log('response:', r)
	};
}

export function getUnarchiveModal(): ModalSettings {
	return {
		type: 'confirm',
		title: 'Confirm Unarchive',
		response: (r: boolean) => console.log('response:', r)
	};
}
