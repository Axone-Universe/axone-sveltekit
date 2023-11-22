import { z } from 'zod';
import { update as ChapterDetails } from './chapters';
import { update as Deltas } from './deltas';
import { update as BookDetails } from './books';

/**
 * @typedef {Object} UserMessage
 * @property {string} chapterID - The ID of the chapter
 * @property {string} bookID - The ID of the book
 * @property {string} content - The content of the message (i.e. the highlighted text in the editor)
 * @property {Object} options - The options for the message
 * @property {string} options.style - The style of the generated text
 * @property {string[]} options.keywords - The keywords for the generated text
 * @property {string} options.plotDirection - The plot direction for the generated text
 * @property {string} options.tone - The tone for the generated text
 * @property {string} options.targetAudience - The target audience for the generated text
 * @property {string} options.targetLanguageProficiency - The target language proficiency for the generated text
 * @property {string} options.customPrompt - Any additional custom prompt for the generated text
 * @property {Deltas} deltas - The deltas of the current chapter
 */
export const userMessage = z.object({
	chapterID: z.string(),
	bookID: z.string(),
	content: z.string(),
	requestedLength: z.enum(['short sentence', 'long sentence', 'short paragraph', 'long paragraph', 'short chapter', 'long chapter']),
	options: z.object({
		style: z.string().optional(),
		keywords: z.array(z.string()).optional(),
		plotDirection: z.string().optional(),
		tone: z.string().optional(),
		targetAudience: z.string().optional(),
		targetLanguageProficiency: z.string().optional(),
		customPrompt: z.string().optional(),
	}).optional(),
	deltas: Deltas
});
export type UserMessage = z.infer<typeof userMessage>;

/**
 * @typedef {Object} AssistantMessage
 * @property {string} chunkId - A unique identifier for the chat completion. Each chunk has the same ID.
 * @property {Object} chunkBody - The chunk body
 * @property {Object} chunkBody.delta - A chat completion delta generated by streamed model responses.
 * @property {string} chunkBody.delta.content - The contents of the chunk message.
 * @property {string} chunkBody.delta.role - The role of the author of this message.
 * @property {string} chunkBody.finishReason - The reason the model stopped generating tokens. This will be stop if the model hit a natural stop point or a provided stop sequence, length if the maximum number of tokens specified in the request was reached, content_filter if content was omitted due to a flag from our content filters, tool_calls if the model called a tool, or function_call (deprecated) if the model called a function.
 * @property {number} created - The Unix timestamp (in seconds) of when the chat completion was created. Each chunk has the same timestamp.
 */
export type AssistantMessage = {
	chunkId: string;
	chunkBody: {
		delta: {
			content: string | null;
			role: string;
		};
		finishReason: string;
	};
	created: number;
}