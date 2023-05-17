import type { Integer, Node } from 'neo4j-driver';
import type { BookProperties, UserProperties } from './NodeProperties';

export type Book = Node<Integer, BookProperties>;

export type User = Node<Integer, UserProperties>;
