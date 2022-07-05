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
		let value = localStorage.getItem(`manga:aidoku:${Wasm.currentSource}:${keyString}`);
		if(!value) {
			return -1;
		}
		let vkey = value.substring(0, value.indexOf(':'));
		let vvalue = value.substring(value.indexOf(':') + 1);
		switch(vkey) {
			case 'float':
				return Wasm.storeStdValue(parseFloat(vvalue));
			case 'int':
				return Wasm.storeStdValue(parseInt(vvalue));
			case 'bool':
				return Wasm.storeStdValue(vvalue === 'true');
			case 'string':
				return Wasm.storeStdValue(vvalue);
			case 'stringarray':
				return Wasm.storeStdValue(vvalue.split('\0'));
		}
	}

	static set(key: number, length: number, value: number): void {
		if (length <= 0 || value < 0) {
			return;
		}

		let keyString = Wasm.readString(key, length);
		let valueString = Wasm.readStdValue(value);
		let valueType: string;
		switch(typeof valueString) {
			case 'number':
				if(valueString % 1 === 0) {
					valueType = 'int';
				} else {
					valueType = 'float';
				}
				break;
			case 'boolean':
				valueType = 'bool';
				break;
			case 'string':
				valueType = 'string';
				break;
			case 'object':
				if(valueString instanceof Array) {
					valueType = 'stringarray';
					valueString = this.stringArrayToString(valueString);
				} else {
					valueType = 'string';
				}
				break;
		}
		localStorage.setItem(`manga:aidoku:${Wasm.currentSource}:${keyString}`, `${valueType}:${valueString}`);
	}
	static stringArrayToString(arr: string[]): string {
        return arr.join("\0");
    }
}
