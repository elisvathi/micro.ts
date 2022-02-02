import * as zlib from 'zlib';

export async function sleep(time: number = 1000): Promise<void> {
	return new Promise((ok) => {
		setTimeout(() => {
			ok();
		}, time);
	});
}

export function minNonZero(...numbers: number[]) {
	const sorted = numbers.filter((x) => x > 0).sort();
	if (sorted.length) {
		return sorted[0];
	}
}

export async function zipAsync(value: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		zlib.gzip(value, (err, value) => {
			if (err) {
				reject(err);
			}
			resolve(value);
		});
	});
}

export async function unzipAsync(value: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		zlib.unzip(value, (err, value) => {
			if (err) {
				reject(err);
			}
			resolve(value);
		});
	});
}
