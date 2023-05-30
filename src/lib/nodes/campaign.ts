import { randomUUID } from 'crypto';

import type { Node, Integer } from 'neo4j-driver';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import { NodeBuilder } from '$lib/nodes/nodeBuilder';

interface CampaignProperties {
	id: string;
	title?: string;
	organizer?: string;
	dates?: string[];
	about?: string;
	tags?: string[];
	bannerURL?: string;
}

export type CampaignNode = Node<Integer, CampaignProperties>;

export interface CampaignResponse {
	campaign: CampaignNode;
}

export class CampaignBuilder extends NodeBuilder<CampaignResponse> {
	private readonly _campaignProperties: CampaignProperties;
	// private readonly _userID: { id?: string };

	constructor() {
		super();
		this._campaignProperties = {
			id: randomUUID()
		};
		this.labels(['Campaign']);
		// this._userID = {};
	}

	// TODO: remove? We shouldn't ever be setting the ID anyway
	id(id: string): CampaignBuilder {
		this._campaignProperties.id = id;
		return this;
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

	// userID(userID: string): CampaignBuilder {
	// 	this._userID.id = userID;
	// 	return this;
	// }

	async build(): Promise<CampaignResponse> {
		// if (!this._userID.id) throw new Error('Must provide userID of user to build campaign.');

		const properties = stringifyObject(this._campaignProperties);
		console.log('PROPS: ', properties);
		const labels = this._labels.join(':');

		const query = `
			CREATE (campaign:${labels} ${properties})
			RETURN campaign
		`;

		const session = new DBSession();
		const result = await session.executeWrite<CampaignResponse>(query);

		return result.records[0].toObject();
	}
}
