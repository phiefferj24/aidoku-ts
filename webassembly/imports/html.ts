import { Wasm } from '../wasm';

export class Html {
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
		if (length <= 0) {
			return -1;
		}

		let dataString = Wasm.readString(data, length);
		let value = $.parseHTML(dataString)[0];
		return Wasm.storeStdValue(value);
	}

	static parse_fragment(data: number, length: number): number {
		if (length <= 0) {
			return -1;
		}

		let dataString = Wasm.readString(data, length);
		let value = $.parseHTML(dataString);
		return Wasm.storeStdValue(value);
	}

	static parse_with_uri(data: number, length: number, uri: number, uriLength: number): number {
		if (length <= 0) {
			return -1;
		}

		let dataString = Wasm.readString(data, length);
		let uriString = Wasm.readString(uri, uriLength);
		let value = $.parseHTML(dataString)[0];
		let base = document.createElement('base');
		base.href = uriString;
		if ($(value).has('head')) {
			$(value).find('head').append(base);
		} else {
			$(value).prepend(base);
		}
		return Wasm.storeStdValue(value);
	}

	static parse_fragment_with_uri(data: number, length: number, uri: number, uriLength: number): number {
		if (length <= 0) {
			return -1;
		}

		let dataString = Wasm.readString(data, length);
		let uriString = Wasm.readString(uri, uriLength);
		let value = $.parseHTML(dataString);
		let outer = $.parseHTML('<html><head></head><body></body></html>')[0];
		let base = document.createElement('base');
		base.href = uriString;
		$(outer).find('head').append(base);
		for (let v of value) {
			$(outer).find('body').append(v);
		}
		return Wasm.storeStdValue(outer);
	}

	static select(descriptor: number, selector: number, selectorLength: number): number {
		if (selectorLength <= 0) {
			return -1;
		}

		let selectorString = Wasm.readString(selector, selectorLength);
		let value = $(Wasm.readStdValue(descriptor)).find(selectorString);
		return Wasm.storeStdValue(value);
	}

	static attr(descriptor: number, selector: number, selectorLength: number) {
		if (selectorLength <= 0) {
			return -1;
		}

		let selectorString = Wasm.readString(selector, selectorLength);
		let value = $(Wasm.readStdValue(descriptor)).attr(selectorString);
		return Wasm.storeStdValue(value);
	}

	static first(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).first();
		return Wasm.storeStdValue(value);
	}

	static last(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).last();
		return Wasm.storeStdValue(value);
	}

	static next(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).next();
		return Wasm.storeStdValue(value);
	}

	static previous(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).prev();
		return Wasm.storeStdValue(value);
	}

	static base_uri(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor));
		let base = value.find('base');
		if (base.length > 0) {
			return Wasm.storeStdValue(base.attr('href'));
		} else {
			return Wasm.storeStdValue('');
		}
	}

	static body(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor));
		let body = value.find('body');
		if (body.length > 0) {
			return Wasm.storeStdValue(body);
		} else {
			return Wasm.storeStdValue(value);
		}
	}

	static text(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).text();
		return Wasm.storeStdValue(value);
	}

	static own_text(descriptor: number): number {
		let v = $(Wasm.readStdValue(descriptor));
		let value = $(v).contents().not(v.children()).text();
		return Wasm.storeStdValue(value);
	}

	static data(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).data();
		return Wasm.storeStdValue(value);
	}

	static array(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).toArray();
		return Wasm.storeStdValue(value);
	}

	static html(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).html();
		return Wasm.storeStdValue(value);
	}

	static outer_html(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor))[0].outerHTML;
		return Wasm.storeStdValue(value);
	}

	static id(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).attr('id');
		return Wasm.storeStdValue(value);
	}

	static tag_name(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).prop('tagName');
		return Wasm.storeStdValue(value);
	}

	static class_name(descriptor: number): number {
		let value = $(Wasm.readStdValue(descriptor)).attr('class');
		return Wasm.storeStdValue(value);
	}

	static has_class(descriptor: number, className: number, classLength: number): number {
		if (classLength <= 0) {
			return -1;
		}

		let classString = Wasm.readString(className, classLength);
		let value = $(Wasm.readStdValue(descriptor)).hasClass(classString);
		return value ? 1 : 0;
	}

	static has_attr(descriptor: number, attribute: number, attributeLength: number): number {
		if (attributeLength <= 0) {
			return -1;
		}

		let attributeString = Wasm.readString(attribute, attributeLength);
		let value = $(Wasm.readStdValue(descriptor)).attr(attributeString);
		return value ? 1 : 0;
	}

	static set_text(descriptor: number, text: number, textLength: number): void {
		if(descriptor < 0) { return; }
		let textString = Wasm.readString(text, textLength);
		$(Wasm.readStdValue(descriptor)).text(textString);
	}

	static set_html(descriptor: number, html: number, htmlLength: number): void {
		if(descriptor < 0) { return; }
		let htmlString = Wasm.readString(html, htmlLength);
		$(Wasm.readStdValue(descriptor)).html(htmlString);
	}

	static prepend(descriptor: number, text: number, textLength: number): void {
		if(descriptor < 0) { return; }
		let textString = Wasm.readString(text, textLength);
		$(Wasm.readStdValue(descriptor)).prepend(textString);
	}

	static append(descriptor: number, text: number, textLength: number): void {
		if(descriptor < 0) { return; }
		let textString = Wasm.readString(text, textLength);
		$(Wasm.readStdValue(descriptor)).append(textString);
	}
}
