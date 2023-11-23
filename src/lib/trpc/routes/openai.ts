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
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import { books } from '$lib/trpc/routes/books';
import { chapters } from '$lib/trpc/routes/chapters';
import type { ChapterProperties } from '$lib/properties/chapter';
import type { DeltaProperties } from '$lib/properties/delta';
import { deltas } from '$lib/trpc/routes/deltas';

const openaiClient = new OpenAI({
	apiKey: OPENAI_API_KEY
});

function getTextPrompt(input: UserMessage): string {
	const prompt = `Limit your response to ${
		generationLength[input.requestedLength]
	} completion_tokens. Please write a strictly a ${
		input.requestedLength
	} following from the following excerpt: ${input.content}`;
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

	if (input.options) {
		if (input.options.style) prompt += `The style of the chapter is ${input.options.style}.`;
		if (input.options.keywords)
			prompt += `The keywords to use in your response are ${input.options.keywords.join(', ')}.`;
		if (input.options.plotDirection)
			prompt += `The plot direction of the chapter is ${input.options.plotDirection}.`;
		if (input.options.tone) prompt += `The tone of the chapter is ${input.options.tone}.`;
		if (input.options.targetAudience)
			prompt += `The target audience of the chapter is ${input.options.targetAudience}.`;
		if (input.options.targetLanguageProficiency)
			prompt += `The target language proficiency of the chapter is ${input.options.targetLanguageProficiency}.`;
	}

	const insertDeltas = (deltaProperties.ops as any[]).map((op) => op.insert || '').join('');

	if (insertDeltas) prompt += `\nHere is the current text of the chapter: "${insertDeltas}"`;

	if (input.options && input.options.customPrompt)
		prompt += `\n\nHere are more instructions and/or information: ${input.options.customPrompt}.`;

	return prompt;
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

			let data: AssistantMessage;

			const messages = [
				{ role: 'system', content: systemMessage },
				{ role: 'user', content: prompt }
			];
			const model = 'gpt-3.5-turbo';
			const completion = await openaiClient.chat.completions.create({
				messages: messages,
				model: model,
				stream: false
			});

			response.data = completion;
			console.log(messages);
			console.log(completion);
			return response;
		})
});
