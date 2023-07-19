import { ulid } from 'ulid';

import { DocumentBuilder } from '$lib/documents/documentBuilder';
import type { HydratedDocument } from 'mongoose';
import type { CampaignProperties } from '$lib/shared/campaign';
import { Campaign } from '$lib/models/campaign';

export class CampaignBuilder extends DocumentBuilder<HydratedDocument<CampaignProperties>> {
	private readonly _campaignProperties: CampaignProperties;

	constructor() {
		super();
		this._campaignProperties = {
			_id: ulid()
		};
	}

	title(title: string): CampaignBuilder {
		this._campaignProperties.title = title;
		return this;
	}

	organizer(organizer: string): CampaignBuilder {
		this._campaignProperties.organizer = organizer;
		return this;
	}

	dates(dates: string[]): CampaignBuilder {
		this._campaignProperties.dates = dates;
		return this;
	}

	about(about: string): CampaignBuilder {
		this._campaignProperties.about = about;
		return this;
	}

	tags(tags: string[]): CampaignBuilder {
		this._campaignProperties.tags = tags;
		return this;
	}

	bannerURL(bannerURL: string): CampaignBuilder {
		this._campaignProperties.bannerURL = bannerURL;
		return this;
	}

	previewText(previewText: string): CampaignBuilder {
		this._campaignProperties.previewText = previewText;
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

	async build(): Promise<HydratedDocument<CampaignProperties>> {
		const campaign = new Campaign(this._campaignProperties);
		await campaign.save();

		return campaign;
	}
}
