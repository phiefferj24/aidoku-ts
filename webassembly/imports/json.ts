import { Wasm } from '../wasm';

export class Json {
	static getExports(): WebAssembly.ModuleImports {
		return {
			parse: this.parse
		};
	}
	static getNamespace(): string {
		return 'json';
	}

	static parse(data: number, length: number): number {
		if (length <= 0) {
			return -1;
		}

		let dataString = Wasm.readString(data, length);
		let value = JSON.parse(dataString);
		return Wasm.storeStdValue(value);
	}
}
