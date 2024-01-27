import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { userMessage, type UserMessage } from '$lib/trpc/schemas/openai';
import type { Response } from '$lib/util/types';
import {
	OPENAI_ORGANIZATION_ID,
	OPENAI_API_KEYS,
	CHAT_COMPLETIONS_MODEL
} from '$env/static/private';
import OpenAI from 'openai';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import { books } from '$lib/trpc/routes/books';
import { chapters } from '$lib/trpc/routes/chapters';
import type { ChapterProperties } from '$lib/properties/chapter';
import type { DeltaProperties } from '$lib/properties/delta';
import { deltas } from '$lib/trpc/routes/deltas';
import type { ChatCompletionMessageParam } from 'openai/resources';

const openaiClient = new OpenAI({
	apiKey: getKey(OPENAI_API_KEYS),
	organization: OPENAI_ORGANIZATION_ID
});

function getKey(keys: string): string {
	const keysArray: string[] = JSON.parse(keys);
	return keysArray[Math.floor(Math.random() * keysArray.length)];
}

function getTextPrompt(input: UserMessage): string {
	const prompt = `Please complete following ${input.requestedLength} (strictly not longer than one ${input.requestedLength}): ${input.content} ...`;
	return prompt;
}

function getSystemTextPrompt(
	input: UserMessage,
	bookProperties: HydratedDocument<BookProperties>,
	chapterProperties: HydratedDocument<ChapterProperties>,
	deltaProperties: HydratedDocument<DeltaProperties>
): string {
	let prompt = `You are a writer working on a book titled '${bookProperties.title}'`;

	if (bookProperties.genres) prompt += ` in the ${bookProperties.genres} genre(s).`;
	if (bookProperties.description)
		prompt += ` Here is a short description of the book: "${bookProperties.description}"`;

	prompt += `\n\nYou are currently writing a chapter titled '${chapterProperties.title}'.`;
	if (chapterProperties.description)
		prompt += `Here is a short description of the chapter: "${chapterProperties.description}".\n\n`;

	const insertDeltas = (deltaProperties.ops as any[]).map((op) => op.insert || '').join('');

	if (input?.options?.customPrompt)
		prompt += `\n\nHere are more instructions and/or information: ${input.options.customPrompt}.`;

	return prompt;
}

/**
 * Removes the prompt text from the response
 */
function trimMessageContent(
	completion: OpenAI.Chat.Completions.ChatCompletion,
	prompt: string
): OpenAI.Chat.Completions.ChatCompletion {
	if (completion.choices[0].message.content?.startsWith(prompt)) {
		completion.choices[0].message.content = completion.choices[0].message.content.slice(
			prompt.length + 1
		);
		return completion;
	} else {
		return completion;
	}
}

export const openai = t.router({
	get: t.procedure
		.use(logger)
		.input(userMessage)
		.query(async ({ input, ctx }) => {
			const response: Response = {
				message: 'Message sent successfully',
				success: true,
				data: undefined
			};

			const booksCaller = books.createCaller(ctx);
			const chaptersCaller = chapters.createCaller(ctx);
			const deltasCaller = deltas.createCaller(ctx);
			const bookProperties = await booksCaller.getById({ id: input.bookID });
			const chapterProperties = await chaptersCaller.getById({ id: input.chapterID });
			const deltaProperties = await deltasCaller.getById({ id: chapterProperties.delta });

			const systemMessage = getSystemTextPrompt(
				input,
				bookProperties.data,
				chapterProperties.data,
				deltaProperties.data
			);
			const prompt = getTextPrompt(input);

			const messages: ChatCompletionMessageParam[] = [
				{ role: 'system', content: systemMessage },
				{ role: 'user', content: prompt }
			];

			const completion = await openaiClient.chat.completions.create({
				model: CHAT_COMPLETIONS_MODEL,
				messages: messages,
				stream: false
			});

			response.data = trimMessageContent(completion, input.content);

			return response;
		})
});
