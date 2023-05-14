import type { Integer, Relationship } from 'neo4j-driver';

export type Created = Relationship<
	Integer,
	{
		title: string;
	}
>;
