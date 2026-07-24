declare module "proj4" {
	interface Converter {
		forward(coordinates: number[]): number[];
		inverse(coordinates: number[]): number[];
	}

	interface Proj4Static {
		(from: string, to: string, coordinates: number[]): number[];
		(from: string, to: string): Converter;
		(definition: string): void;
		defs(name: string, definition?: string): void;
	}

	const proj4: Proj4Static;
	export default proj4;
}
