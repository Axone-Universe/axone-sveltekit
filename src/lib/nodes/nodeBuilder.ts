export abstract class NodeBuilder<T> {
	protected readonly _labels: string[] = [];

	constructor() {
		this._labels = [];
	}

	abstract build(): Promise<T>;

	labels(labels: string[]): this {
		this._labels.length = 0;
		labels.forEach((label) => this._labels.push(label));
		return this;
	}
}
