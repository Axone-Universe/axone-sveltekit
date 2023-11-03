export function debouncedScrollCallback(
	lastLoadEpoch: number,
	callback: () => void,
	debounce = 0.5,
	scrollThreshold = 0.5
): number {
	const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;

	if (
		window.scrollY >= scrollableHeight * scrollThreshold &&
		(lastLoadEpoch === 0 || Date.now() - lastLoadEpoch >= debounce * 1000)
	) {
		lastLoadEpoch = Date.now();
		callback();
	}

	return lastLoadEpoch;
}
