<script lang="ts">
	import { TableOfContents, tocCrawler } from '@skeletonlabs/skeleton';
	import { CodeBlock } from '@skeletonlabs/skeleton';
</script>

<div class="flex min-h-screen relative w-full">
	<div
		class="min-h-screen rounded-lg m-2 top-16 hidden sm:flex flex-col justify-between w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-4 gap-2"
	>
		<div class="fixed flex flex-col gap-2">
			<div use:tocCrawler={{ mode: 'generate' }} class="hidden">
				<h2>Introduction</h2>
				<p>...</p>
				<h2>Books</h2>
				<h3>Storylines</h3>
				<h3>Chapters</h3>
				<h2>Campaigns</h2>
				<h2>Permissions</h2>
				<h2>Copyrights</h2>
			</div>
			<TableOfContents>
				<h1>Axone Universe</h1>
			</TableOfContents>
		</div>
	</div>
	<div id="contents" class="flex flex-col pt-16 sm:pt-4 px-5 md:px-20 gap-5 w-full h-fit">
		<h2 class="h2" id="introduction">Introduction</h2>
		<div>
			<p>
				The Axone Universe is a collaborative writing platform for authors. Overcome the writer's
				block through collaboration and co-authorship. Put up your unfinished book on Axone, and let
				the community write the book with you! <br /><br />
				Contribute to existing books by creating new
				<a class="anchor" href="#storylines">storylines</a> or writing new
				<a class="anchor" href="#chapters">chapters</a> for a book storyline. Engage your creative side
				and create something amazing!
			</p>
		</div>
		<hr class="my-4 variant-fill-primary" />
		<h2 class="h2" id="books">Books</h2>
		<div class="flex flex-col gap-2">
			<p>
				On Axone a book is a story with a main character/s and a plot which the book creator has set
				in the book description. To quickly create a book:
			</p>

			<ol class="list">
				<li>
					<span class="badge-icon p-4 variant-soft-primary">1</span>
					<span class="flex-auto"> Navigate to the header of the page </span>
				</li>
				<li>
					<span class="badge-icon p-4 variant-soft-primary">2</span>
					<span class="flex-auto"> Click on the write button. </span>
				</li>
			</ol>

			<p>You can also create a book by:</p>
			<ol class="list">
				<li>
					<span class="badge-icon p-4 variant-soft-primary">1</span>
					<span class="flex-auto"
						>Navigating to your <a target="_blank" class="anchor" href="/studio">studio</a>
					</span>
				</li>
				<li>
					<span class="badge-icon p-4 variant-soft-primary">2</span>
					<span class="flex-auto"> Selecting books in the left navigation</span>
				</li>
				<li>
					<span class="badge-icon p-4 variant-soft-primary">3</span>
					<span class="flex-auto"> Click on the left green button to create a book.</span>
				</li>
			</ol>
			<div class="flex flex-col gap-2 mx-4">
				<hr class="my-4 variant-fill-primary" />
				<h3 class="h3" id="storylines">Storylines</h3>
				<p>
					A book can have multiple storylines. Each storyline is a trajectory of a book in a
					different unique direction. For example, in the book <i><b>Romeo and Juliet</b></i> in
					chapter 5 the message to that Juliet wasn't not dead failed to reach Romeo in time
					resulting in him taking poison and dying of sorrow, thinking that Juliet was dead. In an
					alternative storyline from chapter 5, Romeo receives the message and avoids taking the
					poison leading to reconciliation between their feuding families, the Montagues and
					Capulets.
					<br /><br />
					To create a new storyline for a book:
				</p>
				<ol class="list">
					<li>
						<span class="badge-icon p-4 variant-soft-primary">1</span>
						<span class="flex-auto">Navigate to the book's details view page </span>
					</li>
					<li>
						<span class="badge-icon p-4 variant-soft-primary">2</span>
						<span class="flex-auto">
							Click on the green button next to a chapter you want to branch from
						</span>
					</li>
				</ol>
				<p>
					NB: All the previous chapters including the current one will be part of the new storyline.
					The new chapters you create are the ones which will deviate from the parent storyline.
				</p>
			</div>
			<div class="flex flex-col gap-2 mx-4">
				<hr class="my-4 variant-fill-primary" />
				<h3 class="h3" id="chapters">Chapters</h3>
				<p>A storyline is made up of multiple chapters. To add a chapter to a storyline:</p>
				<ol class="list">
					<li>
						<span class="badge-icon p-4 variant-soft-primary">1</span>
						<span class="flex-auto">Navigate to the book's details view page </span>
					</li>
					<li>
						<span class="badge-icon p-4 variant-soft-primary">2</span>
						<span class="flex-auto"> Select the storyline from the top scrolling list </span>
					</li>
					<li>
						<span class="badge-icon p-4 variant-soft-primary">3</span>
						<span class="flex-auto">
							Scroll down to the chapters section and click on edit for the desired chapter</span
						>
					</li>
				</ol>
				<p>
					NB: If the edit selection is not available for a chapter you do not have permissions to
					edit the chapter. You can ask the author for permission to collaborate on the storyline.
				</p>
			</div>
		</div>
		<hr class="my-4 variant-fill-primary" />
		<h2 class="h2" id="campaigns">Campaigns</h2>
		<div class="flex flex-col gap-2">
			<p>
				An Axone campaign is a call for authors to write stories on a certain topic. For example a
				campaign titled <i>"Voices of Resilience: Chronicles of African Childhood"</i> could have
				the following description:
				<br /><br />
				<i>
					<b>
						"Voices of Resilience" is a compelling campaign aimed at inspiring authors to write
						books that shed light on the challenging yet resilient lives of African children. This
						initiative seeks to raise awareness about the diverse experiences faced by children
						across the continent, emphasizing their strength, dreams, and the obstacles they
						overcome.
					</b>
				</i>
				<br /><br />
				Authors will write books for the campaign until the campaign ending date. A campaign will usually
				have rewards for the best books based on a set criteria. To create a campaign:
			</p>

			<ol class="list">
				<li>
					<span class="badge-icon p-4 variant-soft-primary">1</span>
					<span class="flex-auto"
						>Navigate to your <a target="_blank" class="anchor" href="/studio">studio</a>
					</span>
				</li>
				<li>
					<span class="badge-icon p-4 variant-soft-primary">2</span>
					<span class="flex-auto"> Select books in the left navigation</span>
				</li>
				<li>
					<span class="badge-icon p-4 variant-soft-primary">3</span>
					<span class="flex-auto"> Click on the right green button to create a book campaign</span>
				</li>
			</ol>
		</div>
		<hr class="my-4 variant-fill-primary" />
		<h2 class="h2" id="permissions">Permissions</h2>
		<div class="flex flex-col gap-2">
			<p>
				Permissions restrict access to books, storylines and chapters. They are set and managed by
				the creator of the document. You can set individual permissions and public permissions.
				Public permissions applies to all users on the platform and individual permissions apply to
				the individuals chosen. The two types of permissions are <b>view</b> and <b>collaborate</b>.
			</p>

			<div class="flex flex-col gap-2 mx-4">
				<hr class="my-4 variant-fill-primary" />
				<h3 class="h3">Books</h3>
				<ol class="list">
					<li>
						<span class="badge-icon p-4 variant-soft-primary">1</span>
						<span class="flex-auto">
							View: Allows a user to view the details of the book such as description and
							storylines.
						</span>
					</li>
					<li>
						<span class="badge-icon p-4 variant-soft-primary">2</span>
						<span class="flex-auto">
							Collaborate: Allows a user to create storylines for the book.
						</span>
					</li>
				</ol>
			</div>
			<div class="flex flex-col gap-2 mx-4">
				<hr class="my-4 variant-fill-primary" />
				<h3 class="h3">Storylines</h3>
				<ol class="list">
					<li>
						<span class="badge-icon p-4 variant-soft-primary">1</span>
						<span class="flex-auto">
							View: Allows a user to view the details of the storyline such as description and the
							chapters it has.
						</span>
					</li>
					<li>
						<span class="badge-icon p-4 variant-soft-primary">2</span>
						<span class="flex-auto">
							Collaborate: Allows a user to add chapters to the storyline.
						</span>
					</li>
				</ol>
			</div>
			<div class="flex flex-col gap-2 mx-4">
				<hr class="my-4 variant-fill-primary" />
				<h3 class="h3">Chapters</h3>
				<ol class="list">
					<li>
						<span class="badge-icon p-4 variant-soft-primary">1</span>
						<span class="flex-auto"> View: Allows users to read the chapter.</span>
					</li>
					<li>
						<span class="badge-icon p-4 variant-soft-primary">2</span>
						<span class="flex-auto">
							Collaborate: Allows users to co-write the chapter and edit it's contents. Usually used
							by editors when editing your chapter.
						</span>
					</li>
				</ol>
			</div>
		</div>
		<h2 class="h2" id="copyrights">Copyrights</h2>
		<div>
			<p>
				Axone has adopted a policy toward copyright infringement on the Services in accordance with
				the United States Digital Millennium Copyright Act (the "DMCA"). While our policy is based
				on the US law we apply this same policy globally to all jurisdictions in which our Services
				are available. If you’d like to submit a claim of copyright infringement, please send us an
				email to admin@axone.network. Axone reserves the right to remove content alleged to be
				infringing without prior notice, at our sole discretion, and without liability to you or
				anyone else. In appropriate circumstances, we will also terminate a user’s account if the
				user is determined to be a repeat infringer. <br /><br />
				We sometimes come across websites that have illegally scraped content from Axone. When we find
				these sites we do our best to have them shutdown. In order to act on behalf of our users we need
				to have your legal permission to do that so we ask for it here when you sign up. You authorize
				us to act as your agent to issue take down notices under the DMCA and/or any other similar legislation
				that allows for the submission of requests to Internet service providers and any other person
				involved in the illegal posting for the removal of infringing or allegedly infringing copyright
				materials that are contained in or displayed on such service providers platforms and/or services.
			</p>
		</div>
	</div>
</div>
