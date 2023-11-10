import { ulid } from 'ulid';

import { DocumentBuilder } from '$lib/documents/documentBuilder';
import { startSession, type HydratedDocument } from 'mongoose';
import type { CampaignProperties } from '$lib/properties/campaign';
import { Campaign } from '$lib/models/campaign';
import type { BookProperties } from '$lib/properties/book';
import { Book } from '$lib/models/book';
import { saveBook } from '../digital-products/book';
import { TRPCError } from '@trpc/server';

export class CampaignBuilder extends DocumentBuilder<HydratedDocument<CampaignProperties>> {
	private readonly _campaignProperties: CampaignProperties;
	private _bookProperties: BookProperties;
	private _sessionUserID?: string;

	constructor(id?: string) {
		super();
		this._campaignProperties = {
			_id: id ? id : ulid(),
			user: ''
		};
		this._bookProperties = {
			_id: ulid(),
			user: '',
			title: '',
			imageURL: '',
			description: '',
			permissions: {},
			genres: [],
			rating: 0
		};
	}

	startDate(date: Date): CampaignBuilder {
		this._campaignProperties.startDate = date;
		return this;
	}

	endDate(date: Date): CampaignBuilder {
		this._campaignProperties.endDate = date;
		return this;
	}

	submissionCriteria(submissionCriteria: string): CampaignBuilder {
		this._campaignProperties.submissionCriteria = submissionCriteria;
		return this;
	}

	rewards(rewards: string): CampaignBuilder {
		this._campaignProperties.rewards = rewards;
		return this;
	}

	book(book: BookProperties): CampaignBuilder {
		book.campaign = this._campaignProperties._id;
		this._bookProperties = book;
		this._campaignProperties.user = book.user as string;
		return this;
	}

	userID(userID: string): CampaignBuilder {
		this._bookProperties.user = userID;
		return this;
	}

	async build(): Promise<HydratedDocument<CampaignProperties>> {
		if (!this._campaignProperties.user)
			throw new Error('Must provide userID to create a campaign.');

		const book = new Book(this._bookProperties);
		const campaign = new Campaign(this._campaignProperties);
		campaign.book = book._id;

		const session = await startSession();

		let returnedCampaign: HydratedDocument<CampaignProperties> | undefined;

		try {
			await session.withTransaction(async () => {
				await saveBook(book, session);

				returnedCampaign = await campaign.save({ session });
			});
		} finally {
			session.endSession();
		}

		if (returnedCampaign) {
			return returnedCampaign;
		}

		throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
	}

	async update(): Promise<HydratedDocument<CampaignProperties>> {
		const session = await startSession();

		let returnedCampaign: HydratedDocument<CampaignProperties> | null = null;

		console.log(this._campaignProperties);
		console.log(this._bookProperties);

		try {
			// use a transaction to make sure everything saves
			await session.withTransaction(async () => {
				await Book.findOneAndUpdate({ _id: this._bookProperties._id }, this._bookProperties, {
					new: true,
					userID: this._campaignProperties.user,
					session
				});

				returnedCampaign = await Campaign.findOneAndUpdate(
					{ _id: this._campaignProperties._id },
					this._campaignProperties,
					{
						new: true,
						userID: this._campaignProperties.user,
						session
					}
				);
			});
		} finally {
			session.endSession();
		}

		if (returnedCampaign) {
			return returnedCampaign;
		}

		throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
	}
}