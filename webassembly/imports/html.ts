import { load, AnyNode, type Cheerio } from 'cheerio';
import { Wasm } from '../wasm';
import { Element } from 'domhandler';

export class Html {
	private static node(descriptor: number): Cheerio<AnyNode> {
		return Wasm.readStdValue(descriptor) as Cheerio<AnyNode>;
	}

	static getExports(): WebAssembly.ModuleImports {
		return {
			parse: this.parse,
			parse_fragment: this.parse_fragment,
			parse_with_uri: this.parse_with_uri,
			parse_fragment_with_uri: this.parse_fragment_with_uri,

			select: this.select,
			attr: this.attr,

			first: this.first,
			last: this.last,
			next: this.next,
			previous: this.previous,

			set_text: this.set_text,
			set_html: this.set_html,
			prepend: this.prepend,
			append: this.append,

			base_uri: this.base_uri,
			body: this.body,
			text: this.text,
			own_text: this.own_text,
			data: this.data,
			array: this.array,
			html: this.html,
			outer_html: this.outer_html,

			id: this.id,
			tag_name: this.tag_name,
			class_name: this.class_name,
			has_class: this.has_class,
			has_attr: this.has_attr
		};
	}
	static getNamespace(): string {
		return 'html';
	}

	static parse(data: number, length: number): number {
		return length <= 0 ? -1 : Wasm.storeStdValue(load(Wasm.readString(data, length)).root());
	}

	static parse_fragment(data: number, length: number): number {
		return length <= 0 ? -1 : Wasm.storeStdValue(load(Wasm.readString(data, length), null, false).root());
	}

	static parse_with_uri(data: number, length: number, uri: number, uriLength: number): number {
		if (length <= 0) {
			return -1;
		}
		let value = load(Wasm.readString(data, length)).root();
		value.prepend(new Element("base", { href: Wasm.readString(uri, uriLength) }));
		return Wasm.storeStdValue(value);
	}

	static parse_fragment_with_uri(data: number, length: number, uri: number, uriLength: number): number {
		if (length <= 0) {
			return -1;
		}
		let value = load(Wasm.readString(data, length), null, false).root();
		value.prepend(new Element("base", { href: Wasm.readString(uri, uriLength) }));
		return Wasm.storeStdValue(value);
	}

	static select(descriptor: number, selector: number, selectorLength: number): number {
		console.log(this.node, this.node(descriptor));
		return selectorLength <= 0 ? -1 : Wasm.storeStdValue(this.node(descriptor).find(Wasm.readString(selector, selectorLength)));
	}

	static attr(descriptor: number, selector: number, selectorLength: number) {
		return selectorLength <= 0 ? -1 : Wasm.storeStdValue(this.node(descriptor).attr(Wasm.readString(selector, selectorLength)));
	}
	

	static first(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).first());
	}

	static last(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).last());
	}

	static next(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).next());
	}

	static previous(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).prev());
	}

	static base_uri(descriptor: number): number {
		let base = this.node(descriptor).find("base");
		return base.length > 0 ? Wasm.storeStdValue(base.attr("href")) : Wasm.storeStdValue("")
	}

	static body(descriptor: number): number {
		let value = this.node(descriptor);
		let body = value.find('body');
		return Wasm.storeStdValue(body.length > 0 ? body : value);
	}

	static text(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor));
	}

	static own_text(descriptor: number): number {
		let v = this.node(descriptor);
		return Wasm.storeStdValue(v.contents().not(v.children()).text());
	}

	static data(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).data());
	}

	static array(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).toArray());
	}

	static html(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).children().html());
	}

	static outer_html(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).html());
	}

	static id(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).attr("id"));
	}

	static tag_name(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).prop("tagName"));
	}

	static class_name(descriptor: number): number {
		return Wasm.storeStdValue(this.node(descriptor).attr("class"));
	}

	static has_class(descriptor: number, className: number, classLength: number): number {
		if (classLength <= 0) {
			return -1;
		}
		return this.node(descriptor).hasClass(Wasm.readString(className, classLength)) ? 1 : 0;
	}

	static has_attr(descriptor: number, attribute: number, attributeLength: number): number {
		if (attributeLength <= 0) {
			return -1;
		}
		return this.node(descriptor).attr(Wasm.readString(attribute, attributeLength)) ? 1 : 0;
	}

	static set_text(descriptor: number, text: number, textLength: number): void {
		if(descriptor >= 0) { this.node(descriptor).text(Wasm.readString(text, textLength)); }
	}

	static set_html(descriptor: number, html: number, htmlLength: number): void {
		if(descriptor >= 0) { this.node(descriptor).html(Wasm.readString(html, htmlLength)); }
	}

	static prepend(descriptor: number, text: number, textLength: number): void {
		if(descriptor >= 0) { this.node(descriptor).prepend(Wasm.readString(text, textLength)); }
	}

	static append(descriptor: number, text: number, textLength: number): void {
		if(descriptor >= 0) { this.node(descriptor).append(Wasm.readString(text, textLength)); }
	}
}
