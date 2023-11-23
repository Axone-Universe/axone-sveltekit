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

const AiAttr = new Parchment.Attributor.Attribute('ai', 'ql-ai', {
	scope: Scope.INLINE
});

const AiTimestampAttr = new Parchment.Attributor.Attribute('aiTimestamp', 'ql-ai-timestamp', {
	scope: Scope.INLINE
});

const AiId = new Parchment.Attributor.Attribute('aiId', 'id', {
	scope: Scope.INLINE
});

const AiAddOnAttr = new Parchment.Attributor.Attribute('aiAddOn', 'ql-ai-addon', {
	scope: Scope.INLINE
});

type Callback = ((ai: AiResponse) => void) | (() => void);
export interface QuillAiOptions {
	aiAuthorId: string;
	color: string;
	enabled: boolean;
	aiAddClick: (callback: Callback | null) => void;
	aiClick: () => void;
	aiTimestamp: () => Promise<unknown>;
	aiAddOn: string; // additional info
}

export interface AiResponse {
	choices: Choice[];
	created: number;
	id: string;
	model: string;
	object: string;
	usage: Usage;
}

export interface Choice {
	finish_reason: string;
	index: number;
	message: Message;
}

export interface Message {
	content: string;
	role: string;
}

export interface Usage {
	completion_tokens: number;
	prompt_tokens: number;
	total_tokens: number;
}

let range: RangeStatic | null;

export class QuillAI {
	quill: Quill;
	options: QuillAiOptions;
	isEnabled: boolean;

	constructor(ql: Quill, opt: QuillAiOptions) {
		this.quill = ql;
		this.options = opt;

		this.isEnabled = false;

		if (this.options.enabled) {
			this.enable();
			this.isEnabled = true;
		}

		if (!this.options.aiAuthorId) {
			return;
		}

		Quill.register(AiId, true);
		Quill.register(AiAttr, true);
		Quill.register(AiTimestampAttr, true);
		Quill.register(AiAddOnAttr, true);

		this.addIllustrationStyle(this.options.color);

		const aiAddClick = this.options.aiAddClick;
		const aiClick = this.options.aiClick;
		const addAi = this.addAi;

		// for illustration color on/off toolbar item
		const toolbar = this.quill.getModule('toolbar');
		if (toolbar) {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			toolbar.addHandler('ai-toggle', function () {});
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			toolbar.addHandler('ai-add', function () {});
			const aiToggleBtn = document.querySelector('button.ql-ai-toggle');

			// eslint-disable-next-line @typescript-eslint/no-this-alias
			aiToggleBtn?.addEventListener('click', function () {
				if (aiClick) {
					aiClick();
				}
			});

			const addAiBtn = document.querySelector('button.ql-ai-add');
			addAiBtn!.addEventListener('click', () => {
				range = this.quill.getSelection();

				// nothing is selected
				if (!range || range.length == 0) {
					aiAddClick(null);
					return;
				}

				aiAddClick(addAi);
			});
		} else {
			console.log('Error: quill-ai module needs quill toolbar');
		}
	}

	addAi(ai: AiResponse | undefined): void {
		if (!range) {
			return; // cannot work without selected text
		}

		console.log('Text chosen for ai prompt: ' + this.quill.getText(range.index, range.length));

		// selection could be removed when this callback gets called, so store it first
		if (range)
			this.quill.formatText(range.index, range.length, 'aiAuthor', this.options.aiAuthorId, 'user');

		if (range && this.options.aiAddOn) {
			this.quill.formatText(range.index, range.length, 'aiAddOn', this.options.aiAddOn, 'user');
		}

		this.options.aiTimestamp().then((utcSeconds) => {
			// UNIX epoch like 1234567890
			if (range) {
				this.quill.formatText(range.index, range.length, 'aiTimestamp', utcSeconds, 'user');
				this.quill.formatText(
					range.index,
					range.length,
					'aiId',
					'ql-ai-' + this.options.aiAuthorId + '-' + utcSeconds,
					'user'
				);

				this.quill.formatText(range.index, range.length, 'ai', JSON.stringify(ai), 'user');
			}
		});
	}

	enable(enabled = true) {
		this.quill.root.classList.toggle('ql-ai', enabled);
		this.isEnabled = enabled;
	}

	disable() {
		this.enable(false);
		this.isEnabled = false;
	}

	addIllustrationStyle(color: string) {
		const css = '.ql-ai [ql-ai] { ' + 'background-color:' + color + '; }\n';
		this.addStyle(css);
	}

	styleElement: HTMLStyleElement | null = null;
	addStyle(css: string) {
		if (!this.styleElement) {
			this.styleElement = document.createElement('style');
			this.styleElement.type = 'text/css';
			this.styleElement.classList.add('ql-ai-style'); // in case for some manipulation
			this.styleElement.classList.add('ql-ai-style-' + this.options.aiAuthorId); // in case for some manipulation
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

Quill.register('modules/ai', QuillAI);
