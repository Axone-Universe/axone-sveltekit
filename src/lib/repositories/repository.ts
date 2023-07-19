export interface Count {
	count: number;
}

export abstract class Repository {
	abstract getById(searchTerm?: string, limit?: number, skip?: number): Promise<unknown>;
	abstract getByTitle(searchTerm?: string, limit?: number, skip?: number): Promise<unknown[]>;
	abstract count(): Promise<number>;
}
