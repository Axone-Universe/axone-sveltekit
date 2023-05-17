import type { QueryResult } from 'neo4j-driver-core';
import type { Dict } from 'neo4j-driver-core/types/record';

export abstract class Handler {
	abstract create<T extends Dict>(): Promise<QueryResult<T>>;

	/**
	 * Used for removing properties when saving an object in the DB
	 * @param object
	 * @param property
	 */
	abstract propertyFilter(object: any, property: string): void;
}
