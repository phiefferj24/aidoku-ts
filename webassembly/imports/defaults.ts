import { Wasm } from '../wasm';

export class Defaults {
	static getExports(): WebAssembly.ModuleImports {
		return {
			get: this.get,
			set: this.set
		};
	}
	static getNamespace(): string {
		return 'defaults';
	}

	static get(key: number, length: number): number {
		if (length <= 0) {
			return -1;
		}

		let keyString = Wasm.readString(key, length);
		let value = localStorage.getItem(keyString);
		if (value) {
			return Wasm.storeStdValue(value);
		}
		return -1;
	}

	static set(key: number, length: number, value: number): void {
		if (length <= 0 || value < 0) {
			return;
		}

		let keyString = Wasm.readString(key, length);
		let valueString = Wasm.readStdValue(value);
		localStorage.setItem(keyString, valueString);
	}
}
