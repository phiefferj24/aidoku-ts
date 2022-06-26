import { Aidoku, Defaults, Html, Json, Net, Std, Env } from './imports/index';
import type { Optional } from '../models/optional';
import type { RequestObject } from './imports/net';

export class Wasm {
    static imports: WebAssembly.Imports = {};

	static instances: Map<string, WebAssembly.Instance> = new Map();
	static networkInstances: Map<String, Net> = new Map();

	static currentSource = '';

    static async start(url: string) {
        let module = await WebAssembly.compileStreaming(fetch(url));
        let instance = await WebAssembly.instantiate(module, this.imports);
        if (instance.exports['initialize']) {
            (instance.exports as any).initialize();
        }
		this.instances.set(url, instance);
		this.networkInstances.set(url, new Net());
		this.currentSource = url;
    }

	static chapterCounter = 0;
	static currentManga = '';

	static stdDescriptorPointer = -1;
	static stdDescriptors: Map<number, any> = new Map();
	static stdReferences: Map<number, number[]> = new Map();

	static requestsPointer = -1;
	static requests: Map<number, RequestObject> = new Map();

	static readStdValue(ptr: number): any {
		return this.stdDescriptors.get(ptr);
	}

	static storeStdValue(value: any, from: Optional<number> = null): number {
		this.stdDescriptorPointer++;
		this.stdDescriptors.set(this.stdDescriptorPointer, value);
		if (from) {
			let references = this.stdReferences.get(from);
			if (references) {
				references.push(this.stdDescriptorPointer);
				this.stdReferences.set(from, references);
			}
		}
		return this.stdDescriptorPointer;
	}

	static removeStdValue(ptr: number): void {
		this.stdDescriptors.delete(ptr);
		let references = this.stdReferences.get(ptr);
		if (references) {
			references.forEach((ref) => {
				this.removeStdValue(ref);
			});
			this.stdReferences.delete(ptr);
		}
	}

	static addStdReference(ptr: number, reference: number): void {
		let references = this.stdReferences.get(ptr) ?? [];
		references.push(reference);
		this.stdReferences.set(ptr, references);
	}

	static readString(ptr: number, len: number): string {
		if(Wasm.instances.has(Wasm.currentSource)) {
			const buffer = (Wasm.instances.get(Wasm.currentSource)!.exports.memory as any).buffer;
			const bytes = new Uint8Array(buffer, ptr, len);
			return String.fromCharCode(...bytes);
		}
		return '';
	}
	static readBytes(ptr: number, len: number): Uint8Array {
		if(Wasm.instances.has(Wasm.currentSource)) {
			const buffer = (Wasm.instances.get(Wasm.currentSource)!.exports.memory as any).buffer;
			return new Uint8Array(buffer, ptr, len);
		}
		return new Uint8Array(0);
	}
	static writeString(ptr: number, str: string): void {
		if(Wasm.instances.has(Wasm.currentSource)) {
			const buffer = (Wasm.instances.get(Wasm.currentSource)!.exports.memory as any).buffer;
			const bytes = new Uint8Array(buffer, ptr, str.length);
			for (let i = 0; i < str.length; i++) {
				bytes[i] = str.charCodeAt(i);
			}
		}
	}
	static writeBytes(ptr: number, bytes: Uint8Array): void {
		if(Wasm.instances.has(Wasm.currentSource)) {
			const buffer = (Wasm.instances.get(Wasm.currentSource)!.exports.memory as any).buffer;
			const dest = new Uint8Array(buffer, ptr, bytes.length);
			for (let i = 0; i < bytes.length; i++) {
				dest[i] = bytes[i];
			}
		}
		
	}
}

Wasm.imports[Aidoku.getNamespace()] = Aidoku.getExports();
Wasm.imports[Defaults.getNamespace()] = Defaults.getExports();
Wasm.imports[Html.getNamespace()] = Html.getExports();
Wasm.imports[Json.getNamespace()] = Json.getExports();
Wasm.imports[Net.getNamespace()] = Net.getExports();
Wasm.imports[Std.getNamespace()] = Std.getExports();
Wasm.imports[Env.getNamespace()] = Env.getExports();