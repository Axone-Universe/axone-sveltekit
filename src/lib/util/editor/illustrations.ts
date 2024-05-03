// An altered copy of quill-comment by nhaouari - https://github.com/nhaouari/quill-comment
/* In accordance wit nhaouari orignal MIT Licence:

Copyright (c) 2017 by Win Min Tun

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import Quill, { RangeStatic } from 'quill';
import Scope from 'parchment/src/scope';
const Parchment = Quill.import('parchment');

const IllustrationAttr = new Parchment.Attributor.Attribute('illustration', 'ql-illustration', {
	scope: Scope.INLINE
});

const IllustrationAuthorAttr = new Parchment.Attributor.Attribute(
	'illustrationAuthor',
	'ql-illustration-author',
	{
		scope: Scope.INLINE
	}
);

const IllustrationTimestampAttr = new Parchment.Attributor.Attribute(
	'illustrationTimestamp',
	'ql-illustration-timestamp',
	{
		scope: Scope.INLINE
	}
);

const IllustrationId = new Parchment.Attributor.Attribute('illustrationId', 'id', {
	scope: Scope.INLINE
});

const IllustrationAddOnAttr = new Parchment.Attributor.Attribute(
	'illustrationAddOn',
	'ql-illustration-addon',
	{
		scope: Scope.INLINE
	}
);

type Callback = ((illustration: IllustrationObject) => void) | (() => void);
export interface QuillIllustrationOptions {
	illustrationAuthorId: string;
	color: string;
	enabled: boolean;
	illustrationAddClick: (callback: Callback | null) => void;
	illustrationsClick: () => void;
	illustrationTimestamp: () => Promise<unknown>;
	illustrationAddOn: string; // additional info
}

export interface IllustrationObject {
	src: string;
	alt: string;
	caption: string;
}

let range: RangeStatic | null;

export class QuillIllustration {
	quill: Quill;
	options: QuillIllustrationOptions;
	isEnabled: boolean;

	constructor(ql: Quill, opt: QuillIllustrationOptions) {
		this.quill = ql;
		this.options = opt;

		this.isEnabled = false;

		if (this.options.enabled) {
			this.enable();
			this.isEnabled = true;
		}
		if (!this.options.illustrationAuthorId) {
			return;
		}

		Quill.register(IllustrationId, true);
		Quill.register(IllustrationAttr, true);
		Quill.register(IllustrationAuthorAttr, true);
		Quill.register(IllustrationTimestampAttr, true);
		Quill.register(IllustrationAddOnAttr, true);

		this.addIllustrationStyle(this.options.color);

		const illustrationAddClick = this.options.illustrationAddClick;
		const illustrationsClick = this.options.illustrationsClick;
		const addIllustration = this.addIllustration;

		// for illustration color on/off toolbar item
		const toolbar = this.quill.getModule('toolbar');
		if (toolbar) {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			toolbar.addHandler('illustrations-toggle', function () {});
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			toolbar.addHandler('illustrations-add', function () {});
			const illustrationToggleBtn = document.querySelector('button.ql-illustrations-toggle');

			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const illustrationObj = this;
			illustrationToggleBtn?.addEventListener('click', function () {
				// toggle on/off authorship colors
				illustrationObj.enable(!illustrationObj.isEnabled);

				if (illustrationsClick) {
					illustrationsClick();
				}
			});

			const addIllustrationBtn = document.querySelector('button.ql-illustrations-add');
			addIllustrationBtn!.addEventListener('click', () => {
				range = this.quill.getSelection();

				// nothing is selected
				if (!range || range.length == 0) {
					illustrationAddClick(null);
					return;
				}

				illustrationAddClick(addIllustration);
			});
		} else {
			console.log('Error: quill-illustration module needs quill toolbar');
		}

		// to prevent illustrations from being copied/pasted.
		this.quill.clipboard.addMatcher('span[ql-illustration]', function (node, delta) {
			delta.ops.forEach(function (op) {
				op.attributes && op.attributes['illustration'] && delete op.attributes['illustration'];
				op.attributes &&
					op.attributes['illustrationAddOn'] &&
					delete op.attributes['illustrationAddOn'];
				op.attributes &&
					op.attributes['illustrationAuthor'] &&
					delete op.attributes['illustrationAuthor'];
				op.attributes && op.attributes['illustrationId'] && delete op.attributes['illustrationId'];
				op.attributes &&
					op.attributes['illustrationTimestamp'] &&
					delete op.attributes['illustrationTimestamp'];
				op.attributes && op.attributes['background'] && delete op.attributes['background'];
			});
			return delta;
		});
	}

	addIllustration(illustration: IllustrationObject): void {
		if (!illustration) {
			return; // cannot work without illustration
		}

		range = this.quill.getSelection();

		// selection could be removed when this callback gets called, so store it first
		if (range)
			this.quill.formatText(
				range.index,
				range.length,
				'illustrationAuthor',
				this.options.illustrationAuthorId,
				'user'
			);

		if (range && this.options.illustrationAddOn) {
			this.quill.formatText(
				range.index,
				range.length,
				'illustrationAddOn',
				this.options.illustrationAddOn,
				'user'
			);
		}

		this.options.illustrationTimestamp().then((utcSeconds) => {
			// UNIX epoch like 1234567890
			if (range) {
				this.quill.formatText(
					range.index,
					range.length,
					'illustrationTimestamp',
					utcSeconds,
					'user'
				);
				this.quill.formatText(
					range.index,
					range.length,
					'illustrationId',
					'ql-illustration-' + this.options.illustrationAuthorId + '-' + utcSeconds,
					'user'
				);

				this.quill.formatText(
					range.index,
					range.length,
					'illustration',
					JSON.stringify(illustration),
					'user'
				);
			}
		});
	}

	enable(enabled = true) {
		this.quill.root.classList.toggle('ql-illustrations', enabled);
		this.isEnabled = enabled;
	}

	disable() {
		this.enable(false);
		this.isEnabled = false;
	}

	addIllustrationStyle(color: string) {
		const css = '.ql-illustrations [ql-illustration] { ' + 'background-color:' + color + '; }\n';
		this.addStyle(css);
	}

	styleElement: HTMLStyleElement | null = null;
	addStyle(css: string) {
		if (!this.styleElement) {
			this.styleElement = document.createElement('style');
			this.styleElement.type = 'text/css';
			this.styleElement.classList.add('ql-illustrations-style'); // in case for some manipulation
			this.styleElement.classList.add(
				'ql-illustrations-style-' + this.options.illustrationAuthorId
			); // in case for some manipulation
			document.documentElement.getElementsByTagName('head')[0].appendChild(this.styleElement);
		}

		this.styleElement.innerHTML = css; // bug fix
		this.styleElement.sheet!.insertRule(css, 0);
	}
}

export const DEFAULTS = {
	illustrationAuthorId: null,
	color: 'transparent',
	enabled: false,
	illustrationAddClick: null,
	illustrationsClick: null,
	illustrationTimestamp: null,
	illustrationAddOn: null // additional info
};

Quill.register('modules/illustration', QuillIllustration);
