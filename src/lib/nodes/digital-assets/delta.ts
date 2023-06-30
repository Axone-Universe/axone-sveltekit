import { randomUUID } from 'crypto';

import type { Node, Integer, Relationship } from 'neo4j-driver';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import { NodeBuilder } from '$lib/nodes/nodeBuilder';
import Delta from 'quill-delta';
import { ChapterHasDeltaRelationship } from '$lib/nodes/digital-products/chapter';

interface DeltaProperties {
	id: string;
	ops: string;
}

export interface DeltaResponse {
	delta: DeltaNode;
}

export type DeltaNode = Node<Integer, DeltaProperties>;

export class DeltaBuilder extends NodeBuilder<DeltaResponse> {
	private _chapterID?: string;
	private readonly _deltaProperties: DeltaProperties;

	constructor() {
		super();
		this._deltaProperties = {
			id: randomUUID(),
			ops: '[]'
		};
		this.labels(['Delta']);
	}

	id(id: string) {
		this._deltaProperties.id = id;
		return this;
	}

	chapterID(chapterID: string) {
		this._chapterID = chapterID;
		return this;
	}

	ops(ops: string): DeltaBuilder {
		this._deltaProperties.ops = ops;
		return this;
	}

	/**
	 * Mostly used for incremental autosaving
	 * @param delta
	 */
	async delta(id: string, ops: string) {
		let deltaOps = JSON.parse(ops);
		let delta = new Delta(deltaOps);

		const labels = this._labels.join(':');

		// Get current node content
		const query = `
            MATCH (delta:${labels} {id: '${id}'})
            return delta`;

		const session = new DBSession();
		const result = await session.executeWrite<DeltaResponse>(query);
		const deltaResponse = result.records[0].toObject();

		const currentOpsJSON = deltaResponse.delta.properties.ops;

		// convert current ops to a delta
		let currentOps = JSON.parse(currentOpsJSON ? currentOpsJSON : '[]');
		let currentDelta = new Delta(currentOps);

		// merge the 2 deltas
		let newDelta = currentDelta.compose(delta);
		let newOpsJSON = JSON.stringify(newDelta.ops);

		this._deltaProperties.ops = newOpsJSON;
		return this;
	}

	async update(): Promise<DeltaResponse> {
		if (!this._deltaProperties.id) throw new Error('Must provide a deltaID to update the delta.');

		const properties = stringifyObject(this._deltaProperties);
		const labels = this._labels.join(':');

		const query = `
            MATCH (delta:${labels} {id: '${this._deltaProperties.id}'})
            SET delta += ${properties}
            return delta`;

		const session = new DBSession();
		const result = await session.executeWrite<DeltaResponse>(query);

		return result.records[0].toObject();
	}

	async build(): Promise<DeltaResponse> {
		if (!this._chapterID) throw new Error('Must provide a chapterID to build the delta.');

		const properties = stringifyObject(this._deltaProperties);

		const labels = this._labels.join(':');

		const query = `
			MERGE (delta:${labels} {id: '${this._deltaProperties.id}'})
			SET delta = ${properties}
			WITH delta
			MATCH (chapter:Chapter) WHERE chapter.id='${this._chapterID}'
			MERGE (chapter)-[${ChapterHasDeltaRelationship.name}:${ChapterHasDeltaRelationship.label}]->(delta)
            SET chapter.deltaID = '${this._deltaProperties.id}'
            RETURN delta
		`;

		const session = new DBSession();
		const result = await session.executeWrite<DeltaResponse>(query);

		return result.records[0].toObject();
	}
}
