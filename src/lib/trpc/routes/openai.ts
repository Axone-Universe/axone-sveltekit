import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { userMessage, type AssistantMessage, type UserMessage } from '$lib/trpc/schemas/openai';
import type { Response } from '$lib/util/types';
import { OPENAI_API_KEY} from '$env/static/private';
import OpenAI from "openai";
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
	const prompt = `
		Please write a ${input.requestedLength} following from the following excerpt:
		${input.content}
	`
	return prompt;
}

function getSystemTextPrompt(input: UserMessage, bookProperties: HydratedDocument<BookProperties>, chapterProperties: HydratedDocument<ChapterProperties>, deltaProperties: HydratedDocument<DeltaProperties>): string {
	let prompt = `You are a writer working on a book called ${bookProperties.title}`;

	if (bookProperties.genres) prompt += ` in the ${bookProperties.genres} genre(s).`;
	if (bookProperties.description) prompt += `Here is a short description of the book: ${bookProperties.description}`;

	prompt += `You are currently writing a chapter titled ${chapterProperties.title}.`
	if (chapterProperties.description) prompt += `Here is a short description of the chapter: ${chapterProperties.description}`;

	if (input.options){
		if (input.options.style) prompt += `The style of the chapter is ${input.options.style}.`;
		if (input.options.keywords) prompt += `The keywords to use in your response are ${input.options.keywords.join(", ")}.`;
		if (input.options.plotDirection) prompt += `The plot direction of the chapter is ${input.options.plotDirection}.`;
		if (input.options.tone) prompt += `The tone of the chapter is ${input.options.tone}.`;
		if (input.options.targetAudience) prompt += `The target audience of the chapter is ${input.options.targetAudience}.`;
		if (input.options.targetLanguageProficiency) prompt += `The target language proficiency of the chapter is ${input.options.targetLanguageProficiency}.`;
	}

	const insertDeltas = (deltaProperties.ops as any[]).map(op => op.insert || '').join('')

	if (input.deltas) prompt += `\nHere is the current text of the chapter: ${insertDeltas}`;

	if (input.options && input.options.customPrompt) prompt += `\n\nHere are more instructions and/or information: ${input.options.customPrompt}.`;

	return prompt;
}

export const openai = t.router({
	get: t.procedure
		.use(logger)
		.input(userMessage)
		.query(async ({ input, ctx }) => {
			const response: Response = {
				message: "Message sent successfully",
				success: true,
				data: undefined
			};

			const booksCaller = books.createCaller(ctx);
			const chaptersCaller = chapters.createCaller(ctx);
			const deltasCaller = deltas.createCaller(ctx);
			const bookProperties = (await booksCaller.getById({id: input.bookID})).data as HydratedDocument<BookProperties>;
			const chapterProperties = (await chaptersCaller.getById({id: input.chapterID})).data as HydratedDocument<ChapterProperties>;
			const deltaProperties = (await deltasCaller.getById({id: chapterProperties.delta as string})).data as HydratedDocument<DeltaProperties>;

			const systemMessage = getSystemTextPrompt(input, bookProperties, chapterProperties, deltaProperties);
			const prompt = getTextPrompt(input);

			let data: AssistantMessage;

			const completion = await openaiClient.chat.completions.create({
				messages: [{"role": "system", "content": "You are a helpful assistant."},
					{"role": "user", "content": "Who won the world series in 2020?"},
					{"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
					{"role": "user", "content": "Where was it played?"}],
				model: "gpt-3.5-turbo",
			});



			return response;
		})
});