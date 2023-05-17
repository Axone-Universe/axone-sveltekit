// Interfaces for the properties that can be RETURNED from a cypher query for their respective nodes

export interface UserProperties {
	id: string;
	name: string;
	email: string;
}

export interface BookProperties {
	id: string;
	title: string;
}
