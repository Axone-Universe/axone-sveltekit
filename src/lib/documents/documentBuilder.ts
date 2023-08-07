export abstract class DocumentBuilder<T> {
	abstract build(): Promise<T>;
	abstract sessionUserID(sessionUserID: string): DocumentBuilder<T>;
}
