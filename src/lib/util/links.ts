import type { BookProperties } from '$lib/properties/book';
import type { ChapterProperties } from '$lib/properties/chapter';
import type { PermissionedDocument } from '$lib/properties/permission';
import type { StorylineProperties } from '$lib/properties/storyline';
import type { HydratedDocument } from 'mongoose';

export const readMenuList = [
	{ url: '/genres/sci-fi', label: 'Sci-Fi' },
	{ url: '/genres/fantasy', label: 'Fantasy' },
	{ url: '/genres/mystery', label: 'Mystery' },
	{ url: '/genres/action', label: 'Action' },
	{ url: '/genres/horror', label: 'Horror' },
	{ url: '/genres/humor', label: 'Humor' },
	{ url: '/genres/erotica', label: 'Erotica' },
	{ url: '/genres/thriller', label: 'Thriller' },
	{ url: '/genres/romance', label: 'Romance' },
	{ url: '/genres/children', label: 'Children' }
];

export const collaborateMenuList = [{ url: '/open-calls', label: 'Open Calls' }];

export const creatorsMenuList = [
	{ url: '/authors', label: 'Authors' },
	{ url: '/illustrators', label: 'Illustrators' },
	{ url: '/editors', label: 'Editors' }
];

export function documentURL(
	permissionedDocumentType: PermissionedDocument,
	permissionedDocument:
		| HydratedDocument<BookProperties>
		| HydratedDocument<ChapterProperties>
		| HydratedDocument<StorylineProperties>
): string {
	let url = '';
	switch (permissionedDocumentType) {
		case 'Book': {
			const book = permissionedDocument as HydratedDocument<BookProperties>;

			url = `book/${book._id}`;
			break;
		}

		case 'Storyline': {
			const storyline = permissionedDocument as HydratedDocument<StorylineProperties>;
			let bookId = '';

			if (typeof storyline.book === 'string') bookId = storyline.book;
			if (typeof storyline.book !== 'string') bookId = storyline.book!._id;

			url = `/editor/${bookId}?mode=reader&storylineID=${storyline._id}`;
			break;
		}

		case 'Chapter': {
			const chapter = permissionedDocument as HydratedDocument<ChapterProperties>;

			let bookId = '';
			if (typeof chapter.book === 'string') bookId = chapter.book;
			if (typeof chapter.book !== 'string') bookId = chapter.book!._id;

			let storylineId = '';
			if (typeof chapter.storyline === 'string') storylineId = chapter.storyline;
			if (typeof chapter.storyline !== 'string') storylineId = chapter.storyline!._id;

			url = `/editor/${bookId}?mode=reader&storylineID=${storylineId}&chapterID=${chapter._id}`;
			break;
		}
	}

	return url;
}
