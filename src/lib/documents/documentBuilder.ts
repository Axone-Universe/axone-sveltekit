export abstract class DocumentBuilder<T> {
	abstract build(): Promise<T>;
}
