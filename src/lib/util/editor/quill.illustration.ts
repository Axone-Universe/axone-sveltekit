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
import Quill, {RangeStatic} from "quill";
import Delta from "quill-delta";
import Attributor from "parchment/src/attributor/attributor";
import Scope from "parchment/src/scope"

const IllustrationAttr: Attributor = new Attributor('illustration', 'ql-illustration', {
    scope: Scope.INLINE
});

const IllustrationAuthorAttr: Attributor = new Attributor('illustrationAuthor', 'ql-illustration-author', {
    scope: Scope.INLINE
});

const IllustrationTimestampAttr: Attributor = new Attributor('illustrationTimestamp', 'ql-illustration-timestamp', {
    scope: Scope.INLINE
});

const IllustrationId: Attributor = new Attributor('illustrationId', 'id', {
    scope: Scope.INLINE
});

const IllustrationAddOnAttr: Attributor = new Attributor('illustrationAddOn', 'ql-illustration-addon', {
    scope: Scope.INLINE
});

type Callback = ((illustration: Illustration) => void) | (() => void)
interface QuillIllustrationOptions {
    illustrationAuthorId: string,
    color: string,
    enabled: boolean,
    illustrationAddClick: ((callback: Callback | null) => void),
    illustrationsClick: () => void,
    illustrationTimestamp: () => Promise<unknown>,
    illustrationAddOn: string, // additional info
}

interface Illustration {
    src: string,
    alt: string,
    caption: string,
}

let quill: Quill;
let options: QuillIllustrationOptions;
let range: RangeStatic | null;
let currentTimestamp: number;
class QuillIllustration {

    isEnabled: boolean;
    

    constructor(ql: Quill, opt: QuillIllustrationOptions) {
        quill = ql;
        options = opt;

        this.isEnabled = false;

        if(options.enabled) {
            this.enable();
            this.isEnabled = true;
        }
        if(!options.illustrationAuthorId) {
            return;
        }

        Quill.register(IllustrationId, true);
        Quill.register(IllustrationAttr, true);
        Quill.register(IllustrationAuthorAttr, true);
        Quill.register(IllustrationTimestampAttr, true);
        Quill.register(IllustrationAddOnAttr, true);

        // this.addIllustrationStyle(options.color);

        const illustrationAddClick = options.illustrationAddClick;
        const illustrationsClick = options.illustrationsClick;
        const addIllustration = this.addIllustration;

        // for illustration color on/off toolbar item
        const toolbar = quill.getModule('toolbar');
        if(toolbar) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            toolbar.addHandler('illustrations-toggle', function() {

            });
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            toolbar.addHandler('illustrations-add', function() {

            });
            const illustrationToggleBtn = document.querySelector('button.ql-illustrations-toggle');

            /*// eslint-disable-next-line @typescript-eslint/no-this-alias
            const illustrationObj = this;
            illustrationToggleBtn.addEventListener('click', function() {
                // toggle on/off authorship colors
                illustrationObj.enable(!illustrationObj.isEnabled);

                if (illustrationsClick) {
                    illustrationsClick();
                }
            });*/

            const addIllustrationBtn = document.querySelector('button.ql-illustrations-add');
            addIllustrationBtn!.addEventListener('click', () => {

                range = quill.getSelection();

                // nothing is selected
                if (!range || range.length ==0) {
                    illustrationAddClick(null);
                    return;
                }

                illustrationAddClick(addIllustration);

            })
        } else {
            console.log('Error: quill-illustration module needs quill toolbar');
        }

        // to prevent illustrations from being copied/pasted.
        quill.clipboard.addMatcher('span[ql-illustration]', function(node, delta) {

            delta.ops.forEach(function(op) {
                op.attributes && op.attributes["illustration"] && delete op.attributes["illustration"];
                op.attributes && op.attributes["illustrationAddOn"] && delete op.attributes["illustrationAddOn"];
                op.attributes && op.attributes["illustrationAuthor"] && delete op.attributes["illustrationAuthor"];
                op.attributes && op.attributes["illustrationId"] && delete op.attributes["illustrationId"];
                op.attributes && op.attributes["illustrationTimestamp"] && delete op.attributes["illustrationTimestamp"];
                op.attributes && op.attributes["background"] && delete op.attributes["background"];

            });
            return delta;
        });

    }

    addIllustration(illustration: Illustration): void{

        if (!illustration) {
            return; // cannot work without illustration
        }

        // selection could be removed when this callback gets called, so store it first
        if (range) quill.formatText(range.index, range.length, 'illustrationAuthor', options.illustrationAuthorId, 'user');

        if (range && options.illustrationAddOn) {
            quill.formatText(range.index, range.length, 'illustrationAddOn', options.illustrationAddOn, 'user');
        }

        options.illustrationTimestamp().then((utcSeconds) => {
            // UNIX epoch like 1234567890
            if (range) {
                quill.formatText(range.index, range.length, 'illustrationTimestamp', utcSeconds, 'user');
                quill.formatText(range.index, range.length, 'illustrationId', 'ql-illustration-' + options.illustrationAuthorId + '-' + utcSeconds, 'user');

                quill.formatText(range.index, range.length, 'illustration', illustration, 'user');
            }
        });
    }

    enable(enabled = true) {
        quill.root.classList.toggle('ql-illustrations', enabled);
        this.isEnabled = enabled;
    }

    disable() {
        this.enable(false);
        this.isEnabled = false;
    }

/*    addIllustrationStyle(color: string) {
        const css = ".ql-illustrations [ql-illustration] { " + "background-color:" + color + "; }\n";
        this.addStyle(css);
    }

    addStyle(css: string) {
        if(!this.styleElement) {
            this.styleElement = document.createElement('style');
            this.styleElement.type = 'text/css';
            this.styleElement.classList.add('ql-illustrations-style'); // in case for some manipulation
            this.styleElement.classList.add('ql-illustrations-style-'+options.authorId); // in case for some manipulation
            document.documentElement.getElementsByTagName('head')[0].appendChild(this.styleElement);
        }

        this.styleElement.innerHTML = css; // bug fix
        // this.styleElement.sheet.insertRule(css, 0);
    }*/

}

export const DEFAULTS = {
    illustrationAuthorId: null,
    color: 'transparent',
    enabled: false,
    illustrationAddClick: null,
    illustrationsClick: null,
    illustrationTimestamp: null,
    illustrationAddOn: null, // additional info
};

Quill.register('modules/quillIllustration', QuillIllustration);