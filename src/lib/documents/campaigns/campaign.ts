import { ulid } from 'ulid';

import { DocumentBuilder } from '$lib/documents/documentBuilder';
import { startSession, type HydratedDocument } from 'mongoose';
import type { CampaignProperties } from '$lib/properties/campaign';
import { Campaign } from '$lib/models/campaign';
import type { BookProperties } from '$lib/properties/book';
import { Book } from '$lib/models/book';
import { saveBook } from '../digital-products/book';
import { TRPCError } from '@trpc/server';
import type { UserProperties } from '$lib/properties/user';

export class CampaignBuilder extends DocumentBuilder<HydratedDocument<CampaignProperties>> {
	private readonly _campaignProperties: CampaignProperties;
	private _bookProperties: BookProperties;
	private _sessionUser?: UserProperties;

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

	properties() {
		return this._campaignProperties;
	}

	bookProperties() {
		return this._bookProperties;
	}

	startDate(date: Date): CampaignBuilder {
		this._campaignProperties.startDate = date;
		return this;
	}

	endDate(date: Date): CampaignBuilder {
		this._campaignProperties.endDate = date;
		return this;
	}

	criteria(criteria: { value: string; link: string }[]): CampaignBuilder {
		this._campaignProperties.criteria = criteria;
		return this;
	}

	rewards(rewards: { value: string; link: string }[]): CampaignBuilder {
		this._campaignProperties.rewards = rewards;
		return this;
	}

	resources(resources: { value: string; link: string }[]): CampaignBuilder {
		this._campaignProperties.resources = resources;
		return this;
	}

	winners(winners: string[]): CampaignBuilder {
		this._campaignProperties.winners = winners;
		return this;
	}

	book(book: BookProperties): CampaignBuilder {
		book.campaign = this._campaignProperties._id;
		this._bookProperties = book;
		return this;
	}

	userID(userID: string): CampaignBuilder {
		this._bookProperties.user = userID;
		this._campaignProperties.user = userID;
		return this;
	}

	sessionUser(sessionUser: UserProperties): CampaignBuilder {
		this._sessionUser = sessionUser;
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
				await saveBook(book, session, this._sessionUser!);

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

		try {
			// use a transaction to make sure everything saves
			await session.withTransaction(async () => {
				await Book.findOneAndUpdate({ _id: this._bookProperties._id }, this._bookProperties, {
					new: true,
					user: this._sessionUser,
					session
				});

				returnedCampaign = await Campaign.findOneAndUpdate(
					{ _id: this._campaignProperties._id },
					this._campaignProperties,
					{
						new: true,
						user: this._sessionUser,
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
