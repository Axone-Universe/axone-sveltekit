import type { Integer, Node } from 'neo4j-driver';

export type BookNode = Node<
    Integer,
    {
        title: string;
    }
>;

export type UserNode = Node<
    Integer,
    {
        name: string;
    }
>;