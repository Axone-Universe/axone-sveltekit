<script lang="ts">
	import QLComments from '$lib/assets/ql-comment.svelte';
	import QLIllustrations from '$lib/assets/ql-illustrations.svelte';

	let customClass = '';
	export { customClass as class };
</script>

<div
	id="ql-toolbar"
	class="{customClass} flex rounded-full bg-surface-300-600-token ql-toolbar ql-snow"
>
	<span class="ql-formats">
		<button type="button" class="ql-bold"
			><svg viewBox="0 0 18 18">
				<path
					class="ql-stroke"
					d="M5,4H9.5A2.5,2.5,0,0,1,12,6.5v0A2.5,2.5,0,0,1,9.5,9H5A0,0,0,0,1,5,9V4A0,0,0,0,1,5,4Z"
				/>
				<path
					class="ql-stroke"
					d="M5,9h5.5A2.5,2.5,0,0,1,13,11.5v0A2.5,2.5,0,0,1,10.5,14H5a0,0,0,0,1,0,0V9A0,0,0,0,1,5,9Z"
				/>
			</svg>
		</button>
		<button type="button" class="ql-italic"
			><svg viewBox="0 0 18 18">
				<line class="ql-stroke" x1="7" x2="13" y1="4" y2="4" />
				<line class="ql-stroke" x1="5" x2="11" y1="14" y2="14" />
				<line class="ql-stroke" x1="8" x2="10" y1="14" y2="4" />
			</svg>
		</button>
		<button type="button" class="ql-underline"
			><svg viewBox="0 0 18 18">
				<path class="ql-stroke" d="M5,3V9a4.012,4.012,0,0,0,4,4H9a4.012,4.012,0,0,0,4-4V3" />
				<rect class="ql-fill" height="1" rx="0.5" ry="0.5" width="12" x="3" y="15" />
			</svg>
		</button>
		<button type="button" class="ql-strike"
			><svg viewBox="0 0 18 18">
				<line class="ql-stroke ql-thin" x1="15.5" x2="2.5" y1="8.5" y2="9.5" />
				<path
					class="ql-fill"
					d="M9.007,8C6.542,7.791,6,7.519,6,6.5,6,5.792,7.283,5,9,5c1.571,0,2.765.679,2.969,1.309a1,1,0,0,0,1.9-.617C13.356,4.106,11.354,3,9,3,6.2,3,4,4.538,4,6.5a3.2,3.2,0,0,0,.5,1.843Z"
				/>
				<path
					class="ql-fill"
					d="M8.984,10C11.457,10.208,12,10.479,12,11.5c0,0.708-1.283,1.5-3,1.5-1.571,0-2.765-.679-2.969-1.309a1,1,0,1,0-1.9.617C4.644,13.894,6.646,15,9,15c2.8,0,5-1.538,5-3.5a3.2,3.2,0,0,0-.5-1.843Z"
				/>
			</svg>
		</button>
	</span>
	<span class="ql-formats">
		<button type="button" class="ql-blockquote"
			><svg viewBox="0 0 18 18">
				<rect class="ql-fill ql-stroke" height="3" width="3" x="4" y="5" />
				<rect class="ql-fill ql-stroke" height="3" width="3" x="11" y="5" />
				<path class="ql-even ql-fill ql-stroke" d="M7,8c0,4.031-3,5-3,5" />
				<path class="ql-even ql-fill ql-stroke" d="M14,8c0,4.031-3,5-3,5" />
			</svg>
		</button>
		<button type="button" class="ql-indent" value="+1"
			><svg viewBox="0 0 18 18">
				<line class="ql-stroke" x1="3" x2="15" y1="14" y2="14" />
				<line class="ql-stroke" x1="3" x2="15" y1="4" y2="4" />
				<line class="ql-stroke" x1="9" x2="15" y1="9" y2="9" />
				<polyline class="ql-fill ql-stroke" points="3 7 3 11 5 9 3 7" />
			</svg>
		</button>
	</span><span class="ql-formats">
		<button type="button" class="ql-align" value=""
			><svg viewBox="0 0 18 18">
				<line class="ql-stroke" x1="3" x2="15" y1="9" y2="9" />
				<line class="ql-stroke" x1="3" x2="13" y1="14" y2="14" />
				<line class="ql-stroke" x1="3" x2="9" y1="4" y2="4" />
			</svg>
		</button>
		<button type="button" class="ql-align" value="center"
			><svg viewBox="0 0 18 18">
				<line class="ql-stroke" x1="15" x2="3" y1="9" y2="9" />
				<line class="ql-stroke" x1="14" x2="4" y1="14" y2="14" />
				<line class="ql-stroke" x1="12" x2="6" y1="4" y2="4" />
			</svg>
		</button>
		<button type="button" class="ql-align" value="right">
			<svg viewBox="0 0 18 18">
				<line class="ql-stroke" x1="15" x2="3" y1="9" y2="9" />
				<line class="ql-stroke" x1="15" x2="5" y1="14" y2="14" />
				<line class="ql-stroke" x1="15" x2="9" y1="4" y2="4" />
			</svg>
		</button>
		<button type="button" class="ql-align" value="justify">
			<svg viewBox="0 0 18 18">
				<line class="ql-stroke" x1="15" x2="3" y1="9" y2="9" />
				<line class="ql-stroke" x1="15" x2="3" y1="14" y2="14" />
				<line class="ql-stroke" x1="15" x2="3" y1="4" y2="4" />
			</svg>
		</button>
		<button type="button" class="ql-comments-add">
			<QLComments />
		</button>
		<button type="button" class="ql-comments-toggle" />
		<button type="button" class="ql-resources-add">
			<QLIllustrations />
		</button>
	</span>
</div>
