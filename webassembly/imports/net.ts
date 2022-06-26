import type { KVCObject } from '../../models/kvcObject';
import { Wasm } from '../wasm';
import type { Optional } from '../../models/optional';

export enum HttpMethod {
	GET = 0,
	POST = 1,
	HEAD = 2,
	PUT = 3,
	DELETE = 4
}

export class Net {
	rateLimit: number = -1;
	period: number = 60;
	lastRequestTime: Optional<Date>;
	passedRequests: number = 0;

	defaultUserAgent =
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36 Edg/88.0.705.63';

	static getNamespace(): string {
		return 'net';
	}
	static getExports(): WebAssembly.ModuleImports {
		return {
			init: this.init_request,
			send: this.send,
			close: this.close,

			set_url: this.set_url,
			set_header: this.set_header,
			set_body: this.set_body,

			get_url: this.get_url,
			get_data_size: this.get_data_size,
			get_data: this.get_data,

			json: this.json,
			html: this.html,

			set_rate_limit: this.set_rate_limit,
			set_rate_limit_period: this.set_rate_limit_period
		};
	}

	modifyRequest(request: Request): void {
		if (!request.headers.has('User-Agent')) {
			request.headers.append('User-Agent', this.defaultUserAgent);
		}
	}

	async performRequest(request: Request): Promise<ResponseObject> {
		if (this.isRateLimited()) {
			let response = new ResponseObject();
			response.status = 429;
			return response;
		}

		this.modifyRequest(request);
		return fetch(request).then(async (response) => {
			this.incrementRequest();

			let headers: Map<string, string> = new Map();
			response.headers.forEach((value, key) => {
				headers.set(key, value);
			});
			let statusCode = response.status;

			return new ResponseObject(statusCode, new Uint8Array(await response.arrayBuffer()), headers);
		});
	}

	isRateLimited(): boolean {
		return (
			this.rateLimit > 0 &&
			new Date().getTime() - (this.lastRequestTime?.getTime() ?? 0) < this.period &&
			this.passedRequests >= this.rateLimit
		);
	}

	incrementRequest(): void {
		if (
			new Date().getTime() - (this.lastRequestTime?.getTime() ?? new Date().getTime() - 60 * 1000) <
			this.period
		) {
			this.passedRequests++;
		} else {
			this.passedRequests = 1;
			this.lastRequestTime = new Date();
		}
	}

	static init_request(method: number): number {
		Wasm.requestsPointer += 1;
		let request = new RequestObject(Wasm.requestsPointer);
		request.method = method;
		Wasm.requests.set(Wasm.requestsPointer, request);
		return Wasm.requestsPointer;
	}

	static close(descriptor: number): void {
		if (descriptor >= 0) {
			Wasm.requests.delete(descriptor);
		}
	}

	static set_url(descriptor: number, value: number, length: number): void {
		if (descriptor >= 0 && length > 0 && Wasm.requests.has(descriptor)) {
			Wasm.requests.get(descriptor)!.url = Wasm.readString(value, length);
		}
	}

	static set_header(
		descriptor: number,
		key: number,
		keyLen: number,
		value: number,
		valueLen: number
	): void {
		if (descriptor >= 0 && keyLen > 0 && valueLen > 0 && Wasm.requests.has(descriptor)) {
			Wasm.requests
				.get(descriptor)!
				.headers.set(Wasm.readString(key, keyLen), Wasm.readString(value, valueLen));
		}
	}

	static set_body(descriptor: number, value: number, length: number): void {
		if (descriptor >= 0 && length > 0 && Wasm.requests.has(descriptor)) {
			Wasm.requests.get(descriptor)!.body = Wasm.readBytes(value, length);
		}
	}

	static set_rate_limit(limit: number) {
		if(Wasm.networkInstances.has(Wasm.currentSource)) {
			Wasm.networkInstances.get(Wasm.currentSource)!.rateLimit = limit;
		}
	}

	static set_rate_limit_period(period: number) {
		if(Wasm.networkInstances.has(Wasm.currentSource)) {
			Wasm.networkInstances.get(Wasm.currentSource)!.period = period;
		}
	}

	static send(descriptor: number): void {
		if (Wasm.requests.has(descriptor) && Wasm.requests.get(descriptor)!.url) {
			let method;
			switch (Wasm.requests.get(descriptor)!.method) {
				case HttpMethod.GET:
					method = 'GET';
					break;
				case HttpMethod.POST:
					method = 'POST';
					break;
				case HttpMethod.HEAD:
					method = 'HEAD';
					break;
				case HttpMethod.PUT:
					method = 'PUT';
					break;
				case HttpMethod.DELETE:
					method = 'DELETE';
					break;
				default:
					method = 'GET';
					break;
			}
			let xhr = new XMLHttpRequest();
			xhr.open(method, Wasm.requests.get(descriptor)!.url!, false);
			xhr.send(Wasm.requests.get(descriptor)!.body);
			let headers = new Map<string, string>();
			for (let [key, value] of xhr
				.getAllResponseHeaders()
				.split('\n')
				.map((line) => line.split(': '))
				.filter((line) => line.length == 2)) {
				headers.set(key, value);
			}
			let response = new Uint8Array();
			switch(typeof xhr.response) {
				case 'string':
					response = new TextEncoder().encode(xhr.response);
					break;
				case 'object':
					response = new Uint8Array(xhr.response);
					break;
				default:
					response = new Uint8Array();
					break;
			}
			let responseObject = new ResponseObject(xhr.status, response, headers);
			Wasm.requests.get(descriptor)!.response = responseObject;
		}
	}

	static get_url(descriptor: number): number {
		if (Wasm.requests.has(descriptor) && Wasm.requests.get(descriptor)!.url) {
			return Wasm.storeStdValue(Wasm.requests.get(descriptor)!.url);
		}
		return -1;
	}

	static get_data_size(descriptor: number): number {
		if (Wasm.requests.has(descriptor) && Wasm.requests.get(descriptor)!.response?.data) {
			return Wasm.requests.get(descriptor)!.response!.bytesRead;
		}
		return -1;
	}

	static get_data(descriptor: number, buffer: number, size: number): void {
		if (!(descriptor >= 0 && size > 0)) {
			return;
		}
		if (Wasm.requests.has(descriptor) && Wasm.requests.get(descriptor)!.response?.data) {
			let response = Wasm.requests.get(descriptor)!.response!;
			if (response.bytesRead + size > response.data!.length) {
				return;
			}
			let result = response.data!.slice(response.bytesRead, response.bytesRead + size);
			Wasm.writeBytes(buffer, result);
			response.bytesRead += size;
		}
	}

	static json(descriptor: number): number {
		if (Wasm.requests.has(descriptor) && Wasm.requests.get(descriptor)!.response?.data) {
			let response = Wasm.requests.get(descriptor)!.response!;
			console.dir(Wasm.stdDescriptors, Wasm.stdReferences)
			let result = JSON.parse(String.fromCharCode(...response.data!));
			return Wasm.storeStdValue(result);
		}
		return -1;
	}

	static html(descriptor: number): number {
		if (Wasm.requests.has(descriptor) && Wasm.requests.get(descriptor)!.response?.data) {
			let response = Wasm.requests.get(descriptor)!.response;
			let html = $.parseHTML(String.fromCharCode(...response!.data!))[0];
			return Wasm.storeStdValue(html);
		}
		return -1;
	}
}
export class ResponseObject implements KVCObject {
	data: Optional<Uint8Array>;
	status: Optional<number>;
	headers: Map<string, string>;

	bytesRead: number = 0;

	constructor(
		status: Optional<number> = null,
		data: Optional<Uint8Array> = null,
		headers: Map<string, string> = new Map()
	) {
		this.status = status;
		this.data = data;
		this.headers = headers;
	}

	valueByPropertyName(propertyName: string) {
		switch (propertyName) {
			case 'data':
				return this.data;
			case 'status_code':
				return this.status;
			case 'headers':
				return this.headers;
		}
	}
}
export class RequestObject implements KVCObject {
	id: number;
	url: Optional<string>;
	method: Optional<HttpMethod>;
	headers: Map<string, string>;
	body: Optional<Uint8Array>;

	response: Optional<ResponseObject>;

	constructor(
		id: number,
		url: Optional<string> = null,
		method: Optional<HttpMethod> = null,
		headers: Map<string, string> = new Map(),
		body: Optional<Uint8Array> = null
	) {
		this.id = id;
		this.url = url;
		this.method = method;
		this.headers = headers;
		this.body = body;
	}

	valueByPropertyName(propertyName: string) {
		switch (propertyName) {
			case 'url':
				return this.url;
			case 'method':
				return this.method;
			case 'headers':
				return this.headers;
			case 'body':
				return this.body;
			case 'response':
				return this.response;
		}
	}
}
