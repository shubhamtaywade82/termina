import { z } from 'zod';
import { createLibrary, defineComponent } from '@openuidev/lang-core';
import { createDefaultComponents } from './defaults.js';
import type { GenUIComponent, GenUIRegistry } from './types.js';

export function defineGenUIComponent<TProps extends Record<string, unknown>>(
	def: GenUIComponent<TProps>,
): GenUIComponent<TProps> {
	return def;
}

export function createGenUIRegistry(
	components: readonly GenUIComponent<any>[],
): GenUIRegistry {
	const map = new Map<string, GenUIComponent<any>>();

	for (const comp of components) {
		if (map.has(comp.name)) {
			throw new Error(`Component "${comp.name}" is already registered.`);
		}
		map.set(comp.name, comp);
	}

	// Adapt to OpenUI Lang core component definitions for schema generation
	const openuiComponents = components.map(comp =>
		defineComponent({
			name: comp.name,
			description: comp.description,
			props: comp.schema as z.ZodObject<any>,
			component: comp.render,
		}),
	);

	const library = createLibrary({
		id: 'termina-genui',
		components: openuiComponents,
	});

	return {
		get: name => map.get(name),
		has: name => map.has(name),
		getAll: () => Array.from(map.values()),
		toJSONSchema: () => library.toJSONSchema() as Record<string, unknown>,
	};
}

export function createDefaultRegistry(): GenUIRegistry {
	return createGenUIRegistry(createDefaultComponents());
}
