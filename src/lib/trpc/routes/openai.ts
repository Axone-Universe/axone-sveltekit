import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import {
	userMessage,
	type AssistantMessage,
	type UserMessage,
	generationLength
} from '$lib/trpc/schemas/openai';
import type { Response } from '$lib/util/types';
import { OPENAI_API_KEYS } from '$env/static/private';
import OpenAI from 'openai';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import { books } from '$lib/trpc/routes/books';
import { chapters } from '$lib/trpc/routes/chapters';
import type { ChapterProperties } from '$lib/properties/chapter';
import type { DeltaProperties } from '$lib/properties/delta';
import { deltas } from '$lib/trpc/routes/deltas';

const openaiClient = new OpenAI({
	apiKey: getKey(OPENAI_API_KEYS)
});

function getKey(keys: string): string {
	const keysArray: string[] = JSON.parse(keys);
	return keysArray[Math.floor(Math.random() * keysArray.length)];
}

function getTextPrompt(input: UserMessage): string {
	const prompt = `Please write a strictly a ***${input.requestedLength}*** following from the following excerpt: ${input.content}`;
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
function trimMessageContent(completion: completion, prompt: string): string {
	if (completion.choices[0].message.content.startsWith(prompt)){
		completion.choices[0].message.content = completion.choices[0].message.content.slice(prompt.length + 1);
		return completion
	}else {
		return completion
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
			const bookProperties = (await booksCaller.getById({ id: input.bookID }))
				.data as HydratedDocument<BookProperties>;
			const chapterProperties = (await chaptersCaller.getById({ id: input.chapterID }))
				.data as HydratedDocument<ChapterProperties>;
			const deltaProperties = (
				await deltasCaller.getById({ id: chapterProperties.delta as string })
			).data as HydratedDocument<DeltaProperties>;

			const systemMessage = getSystemTextPrompt(
				input,
				bookProperties,
				chapterProperties,
				deltaProperties
			);
			const prompt = getTextPrompt(input);

			const messages = [
				{ role: 'system', content: systemMessage },
				{ role: 'user', content: prompt }
			];
			const model = 'gpt-3.5-turbo';
			const completion = await openaiClient.chat.completions.create({
				messages: messages,
				model: model,
				stream: false,
			});

			response.data = trimMessageContent(completion, input.content);

			return response;
		})
});
