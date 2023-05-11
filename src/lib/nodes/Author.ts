import type { UserNode } from './base/NodeTypes'
import neo4j, { DateTime, Integer, int, Node, Relationship } from 'neo4j-driver';

export default class Author implements UserNode {
    identity: Integer;
    labels: string[];
    properties: { name: string; };
    elementId: string;

    constructor(identity: number, labels: string[], properties: { name: string; }, elementId: string) {
        this.identity = int(identity)
        this.labels = labels
        this.properties = properties
        this.elementId = elementId
    }

    toString(): string {
        throw new Error('Method not implemented.');
    }
}