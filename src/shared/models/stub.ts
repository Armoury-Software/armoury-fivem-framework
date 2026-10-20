/**
 * Extension point for libraries that add model-specific fields to `Stub<T>`.
 *
 * Add one uniquely named property per model in a module augmentation. Each
 * property should contain the model type and the fields added to its stub.
 */
export interface StubFieldRegistry {}

type RegisteredStubFields<T> = {
	[K in keyof StubFieldRegistry]: StubFieldRegistry[K] extends {
		model: infer Model;
		fields: infer Fields;
	}
		? T extends Model
			? Fields
			: never
		: never;
}[keyof StubFieldRegistry];

/** A lightweight reference to a model, extended by registered model fields. */
export type Stub<T> = { id?: number } & ( [RegisteredStubFields<T>] extends [never]
	? {}
	: RegisteredStubFields<T>
);
