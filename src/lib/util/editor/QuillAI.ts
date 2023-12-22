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
import { type ToastSettings, toastStore } from '@skeletonlabs/skeleton';
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
	data: any;
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
	textGenerationCancelled = false;

	constructor(ql: Quill, opt: QuillAiOptions) {
		this.quill = ql;
		this.options = opt;
		this.isEnabled = false;
		this.textGenerationCancelled = false;

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

	insertTextWordByWord(
		text: string,
		delay: number,
		range: RangeStatic,
		formatAi: (range: RangeStatic, text: string, quill: Quill, options: QuillAiOptions) => void,
		stopGeneratingToast: string
	): NodeJS.Timer {
		// Split the text into words
		const words = text.split(' ');

		// Get the current selection
		let index = 0;
		if (range) index = range.index + range.length;

		// Insert each word one by one
		let i = 0;
		words[0] = ' ' + words[0];
		let processed = '';
		const insertWords = () => {
			if (i < words.length && !this.textGenerationCancelled) {
				const randomNum = Math.floor(Math.random() * 10) + 1;
				// Ensure not going out of bounds
				const toInsertNum = Math.min(randomNum, words.length - i) || 1;

				for (let j = 0; j < toInsertNum; ++j) {
					// Insert the word and a space after it
					this.quill.insertText(index, words[i] + ' ', 'api');
					// Move the index to the end of the inserted word
					index += words[i].length + 1;
					// Accumulate the words
					processed += words[i] + ' ';
					i++;
				}
			} else {
				// All words have been inserted or generation cancelled, clear the interval
				clearInterval(intervalId);
				this.quill.enable(true);
				formatAi(range, processed, this.quill, this.options);
				this.textGenerationCancelled = false;
				toastStore.close(stopGeneratingToast);
				
			}
		};
		const intervalId = setInterval(insertWords, delay);
		return intervalId;
	}

	stopGenerating() {
		this.textGenerationCancelled = true;
	}

	addAi(
		ai: AiResponse,
		selectedRange: RangeStatic,
		stopGeneratingToast: string
	): NodeJS.Timer | undefined {
		if (
			!selectedRange ||
			!ai ||
			!ai.data.choices ||
			!ai.data.choices[0] ||
			!ai.data.choices[0].message
		) {
			return; // cannot work without selected text or ai response
		}

		const originalRange = structuredClone(selectedRange);
		this.quill.focus();
		const textToInsert = ai.data.choices[0].message.content;

		this.quill.setSelection(originalRange.index + originalRange.length, 0);

		//const inserted = this.quill.insertText(range.index + range.length, ' ' + textToInsert, 'api');

		return this.insertTextWordByWord(
			textToInsert,
			80,
			originalRange,
			this.formatAi,
			stopGeneratingToast
		);
	}

	formatAi(
		originalRange: RangeStatic,
		textToInsert: string,
		quill: Quill,
		options: QuillAiOptions
	) {

		const textLength = textToInsert.length;


		//formatText(index: Number, length: Number, format: String, value: any, source: String = 'api')

		if (originalRange) {
			quill.formatText(
				originalRange.index + originalRange.length + 1,
				textLength - 2,
				'aiAuthor',
				options.aiAuthorId,
				'user'
			);
		}

		if (originalRange && options.aiAddOn) {
			quill.formatText(
				originalRange.index + originalRange.length + 1,
				textLength - 2,
				'aiAddOn',
				options.aiAddOn,
				'user'
			);
		}

		options.aiTimestamp().then((utcSeconds) => {
			// UNIX epoch like 1234567890
			if (originalRange) {
				quill.formatText(
					originalRange.index + originalRange.length + 1,
					textLength - 2,
					'aiTimestamp',
					utcSeconds,
					'user'
				);
				quill.formatText(
					originalRange.index + originalRange.length + 1,
					textLength - 2,
					'aiId',
					'ql-ai-' + options.aiAuthorId + '-' + utcSeconds,
					'user'
				);

				quill.formatText(
					originalRange.index + originalRange.length + 1,
					textLength - 2,
					'ai',
					textToInsert,
					'user'
				);
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
