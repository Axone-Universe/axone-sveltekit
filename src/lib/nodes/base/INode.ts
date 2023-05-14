import type { QueryResult, Node, Session } from 'neo4j-driver';
import type { Dict } from 'neo4j-driver-core/types/record';

export interface INode {
	create<T extends Dict>(session: Session): Promise<QueryResult<T>>;

	/**
	 * Used for removing properties when saving an object in the DB
	 * @param object
	 * @param property
	 */
	propertyFilter(object: any, property: string): void;
}
