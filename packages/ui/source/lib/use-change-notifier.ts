import {useCallback, useState} from 'react';

// Returns the function an edit calls to report the next value. An exception from onChange is kept and thrown during the next render, so the nearest error boundary catches it, as it did when onChange ran from an effect. Thrown into the key handler instead, nothing above the component would see it.
export const useChangeNotifier = (
	onChange: ((value: string) => void) | undefined,
): ((value: string) => void) => {
	const [failure, setFailure] = useState<{error: unknown} | undefined>(
		undefined,
	);

	if (failure !== undefined) {
		throw failure.error;
	}

	return useCallback(
		(value: string) => {
			try {
				onChange?.(value);
			} catch (error) {
				setFailure({error});
			}
		},
		[onChange],
	);
};
