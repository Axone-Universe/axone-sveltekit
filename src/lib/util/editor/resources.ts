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

const ResourceAttr = new Parchment.Attributor.Attribute('resource', 'ql-resource', {
	scope: Scope.INLINE
});

const ResourceAuthorAttr = new Parchment.Attributor.Attribute(
	'resourceAuthor',
	'ql-resource-author',
	{
		scope: Scope.INLINE
	}
);

const ResourceTimestampAttr = new Parchment.Attributor.Attribute(
	'resourceTimestamp',
	'ql-resource-timestamp',
	{
		scope: Scope.INLINE
	}
);

const ResourceId = new Parchment.Attributor.Attribute('resourceId', 'id', {
	scope: Scope.INLINE
});

const ResourceAddOnAttr = new Parchment.Attributor.Attribute('resourceAddOn', 'ql-resource-addon', {
	scope: Scope.INLINE
});

type Callback = ((resource: ResourceObject) => void) | (() => void);
export interface QuillResourceOptions {
	resourceAuthorId: string;
	color: string;
	enabled: boolean;
	resourceAddClick: (callback: Callback | null) => void;
	resourcesClick: () => void;
	resourceTimestamp: () => Promise<unknown>;
	resourceAddOn: string; // additional info
}

export interface ResourceObject {
	id: string;
	title: string;
	src: string;
	alt: string;
}

let range: RangeStatic | null;

export class QuillResource {
	quill: Quill;
	options: QuillResourceOptions;
	isEnabled: boolean;

	constructor(ql: Quill, opt: QuillResourceOptions) {
		this.quill = ql;
		this.options = opt;

		this.isEnabled = false;

		if (this.options.enabled) {
			this.enable();
			this.isEnabled = true;
		}
		if (!this.options.resourceAuthorId) {
			return;
		}

		Quill.register(ResourceId, true);
		Quill.register(ResourceAttr, true);
		Quill.register(ResourceAuthorAttr, true);
		Quill.register(ResourceTimestampAttr, true);
		Quill.register(ResourceAddOnAttr, true);

		this.addResourceStyle(this.options.color);

		const resourceAddClick = this.options.resourceAddClick;
		const resourcesClick = this.options.resourcesClick;
		const addResource = this.addResource;

		// for resource color on/off toolbar item
		const toolbar = this.quill.getModule('toolbar');
		if (toolbar) {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			toolbar.addHandler('resources-toggle', function () {});
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			toolbar.addHandler('resources-add', function () {});
			const resourceToggleBtn = document.querySelector('button.ql-resources-toggle');

			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const resourceObj = this;
			resourceToggleBtn?.addEventListener('click', function () {
				// toggle on/off authorship colors
				resourceObj.enable(!resourceObj.isEnabled);

				if (resourcesClick) {
					resourcesClick();
				}
			});

			const addResourceBtn = document.querySelector('button.ql-resources-add');
			addResourceBtn!.addEventListener('click', () => {
				range = this.quill.getSelection();

				// nothing is selected
				if (!range || range.length == 0) {
					resourceAddClick(null);
					return;
				}

				resourceAddClick(addResource);
			});
		} else {
			console.log('Error: quill-resource module needs quill toolbar');
		}

		// to prevent resources from being copied/pasted.
		this.quill.clipboard.addMatcher('span[ql-resource]', function (node, delta) {
			delta.ops.forEach(function (op) {
				op.attributes && op.attributes['resource'] && delete op.attributes['resource'];
				op.attributes && op.attributes['resourceAddOn'] && delete op.attributes['resourceAddOn'];
				op.attributes && op.attributes['resourceAuthor'] && delete op.attributes['resourceAuthor'];
				op.attributes && op.attributes['resourceId'] && delete op.attributes['resourceId'];
				op.attributes &&
					op.attributes['resourceTimestamp'] &&
					delete op.attributes['resourceTimestamp'];
				op.attributes && op.attributes['background'] && delete op.attributes['background'];
			});
			return delta;
		});
	}

	addResource(resource: ResourceObject): void {
		if (!resource) {
			return; // cannot work without resource
		}

		range = this.quill.getSelection();

		// selection could be removed when this callback gets called, so store it first
		if (range)
			this.quill.formatText(
				range.index,
				range.length,
				'resourceAuthor',
				this.options.resourceAuthorId,
				'user'
			);

		if (range && this.options.resourceAddOn) {
			this.quill.formatText(
				range.index,
				range.length,
				'resourceAddOn',
				this.options.resourceAddOn,
				'user'
			);
		}

		this.options.resourceTimestamp().then((utcSeconds) => {
			// UNIX epoch like 1234567890
			if (range) {
				this.quill.formatText(range.index, range.length, 'resourceTimestamp', utcSeconds, 'user');
				this.quill.formatText(range.index, range.length, 'resourceId', resource.id, 'user');

				this.quill.formatText(
					range.index,
					range.length,
					'resource',
					JSON.stringify(resource),
					'user'
				);
			}
		});
	}

	enable(enabled = true) {
		this.quill.root.classList.toggle('ql-resources', enabled);
		this.isEnabled = enabled;
	}

	disable() {
		this.enable(false);
		this.isEnabled = false;
	}

	addResourceStyle(color: string) {
		const css = '.ql-resources [ql-resource] { ' + 'background-color:' + color + '; }\n';
		this.addStyle(css);
	}

	styleElement: HTMLStyleElement | null = null;
	addStyle(css: string) {
		if (!this.styleElement) {
			this.styleElement = document.createElement('style');
			this.styleElement.type = 'text/css';
			this.styleElement.classList.add('ql-resources-style'); // in case for some manipulation
			this.styleElement.classList.add('ql-resources-style-' + this.options.resourceAuthorId); // in case for some manipulation
			document.documentElement.getElementsByTagName('head')[0].appendChild(this.styleElement);
		}

		this.styleElement.innerHTML = css; // bug fix
		this.styleElement.sheet!.insertRule(css, 0);
	}
}

export const DEFAULTS = {
	resourceAuthorId: null,
	color: 'transparent',
	enabled: false,
	resourceAddClick: null,
	resourcesClick: null,
	resourceTimestamp: null,
	resourceAddOn: null // additional info
};

Quill.register('modules/resource', QuillResource);
