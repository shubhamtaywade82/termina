// True for a string with at least one character. Components use this one check for "has text", so an empty string and an absent value behave the same everywhere.
export const isPresent = (value: string | undefined): value is string =>
	value !== undefined && value !== '';
