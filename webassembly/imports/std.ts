import { DateTime } from 'luxon';
import { Wasm } from '../wasm';

export enum ObjectType {
	null = 0,
	int = 1,
	float = 2,
	string = 3,
	bool = 4,
	array = 5,
	object = 6,
	date = 7,
	node = 8,
	unknown = 9
}

export class Std {
	static getExports(): WebAssembly.ModuleImports {
		return {
			copy: this.copy,
			destroy: this.destroy,

			create_null: this.create_null,
			create_int: this.create_int,
			create_float: this.create_float,
			create_string: this.create_string,
			create_bool: this.create_bool,
			create_array: this.create_array,
			create_object: this.create_object,
			create_date: this.create_date,

			typeof: this.type_of,
			string_len: this.string_len,
			read_string: this.read_string,
			read_int: this.read_int,
			read_float: this.read_float,
			read_bool: this.read_bool,
			read_date: this.read_date,
			read_date_string: this.read_date_string,

			object_len: this.object_len,
			object_get: this.object_get,
			object_set: this.object_set,
			object_remove: this.object_remove,
			object_keys: this.object_keys,
			object_values: this.object_values,

			array_len: this.array_len,
			array_get: this.array_get,
			array_set: this.array_set,
			array_append: this.array_append,
			array_remove: this.array_remove
		};
	}
	static getNamespace(): string {
		return 'std';
	}

	static copy(descriptor: number): number {
		if (descriptor < 0) {
			return -1;
		}
		return Wasm.storeStdValue(Wasm.readStdValue(descriptor));
	}

	static destroy(descriptor: number): void {
		if (descriptor < 0) {
			return;
		}
		Wasm.removeStdValue(descriptor);
	}

	static create_null(): number {
		return Wasm.storeStdValue(null);
	}

	static create_int(int: bigint): number {
		return Wasm.storeStdValue(int);
	}

	static create_float(float: number): number {
		return Wasm.storeStdValue(float);
	}

	static create_string(string: number, length: number): number {
		if (length <= 0) {
			return -1;
		}
		let stringString = Wasm.readString(string, length);
		return Wasm.storeStdValue(stringString);
	}

	static create_bool(bool: number): number {
		return Wasm.storeStdValue(bool != 0);
	}

	static create_object(): number {
		return Wasm.storeStdValue({});
	}

	static create_array(): number {
		return Wasm.storeStdValue([]);
	}

	static create_date(date: number): number {
		return Wasm.storeStdValue(date < 0 ? new Date() : new Date(date));
	}

	static type_of(descriptor: number): number {
		if (descriptor < 0) {
			return ObjectType.null;
		}
		let value = Wasm.readStdValue(descriptor);
		if (value === null) {
			return ObjectType.null;
		}
		switch (typeof value) {
			case 'number':
				if (Number.isInteger(value)) {
					return ObjectType.int;
				}
				return ObjectType.float;
			case 'bigint':
				return ObjectType.int;
			case 'string':
				return ObjectType.string;
			case 'boolean':
				return ObjectType.bool;
			case 'object':
				if (value instanceof Array) {
					if (value.length > 0 && value[0].nodeType) {
						return ObjectType.node;
					}
					return ObjectType.array;
				}
				if (value instanceof Date) {
					return ObjectType.date;
				}
				if (value instanceof Node) {
					return ObjectType.node;
				}
				return ObjectType.object;
			default:
				return ObjectType.unknown;
		}
	}

	static string_len(descriptor: number): number {
		if (descriptor < 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (value === null) {
			return -1;
		}
		return value.length;
	}

	static read_string(descriptor: number, buffer: number, size: number): void {
		if (descriptor < 0 || size < 0) {
			return;
		}
		let value = Wasm.readStdValue(descriptor);
		if (value === null) {
			return;
		}
		if (typeof value !== 'string') {
			return;
		}
		if (size <= value.length) {
			Wasm.writeString(buffer, value.substring(0, size));
		}
	}

	static read_int(descriptor: number): bigint {
		if (descriptor < 0) {
			return BigInt(-1);
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value === 'number') {
			if (Number.isInteger(value)) {
				return BigInt(value);
			}
			return BigInt(Math.floor(value));
		}
		if (typeof value === 'boolean') {
			return BigInt(value ? 1 : 0);
		}
		if (typeof value === 'string') {
			return BigInt(parseInt(value));
		}
		return BigInt(-1);
	}

	static read_float(descriptor: number): number {
		if (descriptor < 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value === 'number') {
			if (Number.isInteger(value)) {
				return value;
			}
			return value;
		}
		if (typeof value === 'string') {
			return parseFloat(value);
		}
		return -1;
	}

	static read_bool(descriptor: number): number {
		if (descriptor < 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value === 'boolean' || typeof value === 'number') {
			return value ? 1 : 0;
		}
		return 0;
	}

	static read_date(descriptor: number): number {
		if (descriptor < 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value === 'number') {
			return value;
		}
		if (typeof value === 'object' && value instanceof Date) {
			return value.getTime();
		}
		return -1;
	}

	static read_date_string(
		descriptor: number,
		format: number,
		formatLen: number,
		locale: number,
		localeLen: number,
		timeZone: number,
		timeZoneLen: number
	): number {
		if (descriptor < 0 || formatLen <= 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value !== 'string') {
			return -1;
		}
		let formatString = Wasm.readString(format, formatLen);
		let localeString = localeLen > 0 ? Wasm.readString(locale, localeLen) : undefined;
		let timeZoneString = timeZoneLen > 0 ? Wasm.readString(timeZone, timeZoneLen) : undefined;
		let time = DateTime.fromFormat(value, formatString, { locale: localeString });
		if (timeZoneString) {
			time = time.setZone(timeZoneString);
		}
		return time.valueOf();
	}

	static object_len(descriptor: number): number {
		if (descriptor < 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value !== 'object') {
			return -1;
		}
		return Object.keys(value).length;
	}

	static object_get(descriptor: number, key: number, keyLen: number): number {
		if (descriptor < 0 || keyLen <= 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value !== 'object') {
			return -1;
		}
		let keyString = Wasm.readString(key, keyLen);
		return Wasm.storeStdValue(value[keyString]);
	}

	static object_set(descriptor: number, key: number, keyLen: number, value: number): void {
		if (descriptor < 0 || keyLen < 0 || value < 0) {
			return;
		}
		let object = Wasm.readStdValue(descriptor);
		if (typeof object !== 'object') {
			return;
		}
		let keyString = Wasm.readString(key, keyLen);
		object[keyString] = Wasm.readStdValue(value);
		Wasm.stdDescriptors.set(descriptor, object);
		Wasm.addStdReference(descriptor, value);
	}

	static object_remove(descriptor: number, key: number, keyLen: number): void {
		if (descriptor < 0 || keyLen < 0) {
			return;
		}
		let object = Wasm.readStdValue(descriptor);
		if (typeof object !== 'object') {
			return;
		}
		let keyString = Wasm.readString(key, keyLen);
		delete object[keyString];
		Wasm.stdDescriptors.set(descriptor, object);
	}

	static object_keys(descriptor: number): number {
		if (descriptor < 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value !== 'object') {
			return -1;
		}
		let keys = Object.keys(value);
		return Wasm.storeStdValue(keys, descriptor);
	}

	static object_values(descriptor: number): number {
		if (descriptor < 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value !== 'object') {
			return -1;
		}
		let values = Object.values(value);
		return Wasm.storeStdValue(values, descriptor);
	}

	static array_len(descriptor: number): number {
		if (descriptor < 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value !== 'object') {
			return -1;
		}
		return value.length;
	}

	static array_get(descriptor: number, index: number): number {
		if (descriptor < 0 || index < 0) {
			return -1;
		}
		let value = Wasm.readStdValue(descriptor);
		if (typeof value !== 'object') {
			return -1;
		}
		return Wasm.storeStdValue(value[index], descriptor);
	}

	static array_set(descriptor: number, index: number, value: number): void {
		if (descriptor < 0 || index < 0 || value < 0) {
			return;
		}
		let array = Wasm.readStdValue(descriptor);
		if (typeof array !== 'object') {
			return;
		}
		array[index] = Wasm.readStdValue(value);
		Wasm.stdDescriptors.set(descriptor, array);
		Wasm.addStdReference(descriptor, value);
	}

	static array_append(descriptor: number, value: number): void {
		if (descriptor < 0 || value < 0) {
			return;
		}
		let array = Wasm.readStdValue(descriptor);
		if (typeof array !== 'object') {
			return;
		}
		array.push(Wasm.readStdValue(value));
		Wasm.stdDescriptors.set(descriptor, array);
		Wasm.addStdReference(descriptor, value);
	}

	static array_remove(descriptor: number, index: number): void {
		if (descriptor < 0 || index < 0) {
			return;
		}
		let array = Wasm.readStdValue(descriptor);
		if (typeof array !== 'object') {
			return;
		}
		array.splice(index, 1);
		Wasm.stdDescriptors.set(descriptor, array);
	}
}
