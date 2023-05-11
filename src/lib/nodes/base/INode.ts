import type { QueryResult, Node } from 'neo4j-driver';
import type { Dict } from 'neo4j-driver-core/types/record'

export interface INode {

    create<T extends Dict>(): Promise<QueryResult<T>>
}