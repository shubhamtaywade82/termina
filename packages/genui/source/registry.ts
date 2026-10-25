/* eslint-disable @typescript-eslint/naming-convention -- The GenUI* function names are public exports, so they keep their spelling. */
import {type z} from 'zod';
import {createLibrary, defineComponent} from '@openuidev/lang-core';
import {createDefaultComponents} from './defaults.js';
import type {GenUIComponent, GenUIRegistry} from './types.js';

export function defineGenUIComponent<Props extends Record<string, unknown>>(
	definition: GenUIComponent<Props>,
): GenUIComponent<Props> {
	return definition;
}

export function createGenUIRegistry(
	components: ReadonlyArray<GenUIComponent<any>>,
): GenUIRegistry {
	const map = new Map<string, GenUIComponent<any>>();

	for (const component of components) {
		if (map.has(component.name)) {
			throw new Error(`Component "${component.name}" is already registered.`);
		}

		map.set(component.name, component);
	}

	// Adapt to OpenUI Lang core component definitions for schema generation
	const openuiComponents = components.map((component) =>
		defineComponent({
			name: component.name,
			description: component.description,
			props: component.schema as z.ZodObject<any>,
			component: component.render,
		}),
	);

	const library = createLibrary({
		id: 'termina-genui',
		components: openuiComponents,
	});

	return {
		get: (name) => map.get(name),
		has: (name) => map.has(name),
		getAll: () => [...components],
		toJSONSchema: () => library.toJSONSchema(),
	};
}

export function createDefaultRegistry(): GenUIRegistry {
	return createGenUIRegistry(createDefaultComponents());
}
