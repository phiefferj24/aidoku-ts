import type { KVCObject } from "./kvcObject";
import type { Optional } from "./optional";

export enum FilterType {
	base = 0,
	group = 1,
	text = 2,
	check = 3,
	select = 4,
	sort = 5,
	sortSelection = 6,
	title = 7,
	author = 8,
	genre = 9
}

export class FilterBase implements KVCObject {
	type: FilterType = FilterType.base;
	name: string;
	constructor(name: string) {
		this.name = name;
	}
	valueByPropertyName(propertyName: string) {
		switch (propertyName) {
			case "type":
				return this.type;
			case "name":
				return this.name;
		}
	}
}

export class Filter<T> extends FilterBase {
	value: T
	defaultValue: T

	constructor(name: string, value: T) {
		super(name)
		this.value = value
		this.defaultValue = value
	}

	override valueByPropertyName(propertyName: string): any {
		switch (propertyName) {
			case "value":
				return this.value;
			case "defaultValue":
				return this.defaultValue;
			default:
				return super.valueByPropertyName(propertyName)
		}
	}
}

export class StringFilter extends Filter<string> {
	constructor(value: string = "") {
		super(value, value)
	}
}

export class TextFilter extends Filter<string> {
	constructor(name: string, value: string = "") {
		super(name, value)
		this.type = FilterType.text
	}
}

export class CheckFilter extends Filter<Optional<boolean>> {
	canExclude: boolean
	id: any
	constructor(name: string, canExclude: boolean, id: any = null, value: Optional<boolean> = null) {
		super(name, value)
		this.type = FilterType.check
		this.canExclude = canExclude
		this.id = id
		this.type = FilterType.check
	}

	override valueByPropertyName(propertyName: string): any {
		switch (propertyName) {
			case "canExclude":
				return this.canExclude;
			case "id":
				return this.id;
			default:
				return super.valueByPropertyName(propertyName)
		}
	}
}

export class SelectFilter extends Filter<number> {
	options: string[]

	constructor(name: string, options: string[], value: number = 0) {
		super(name, value);
		this.options = options;
		this.type = FilterType.select;
	}

	override valueByPropertyName(propertyName: string): any {
		switch (propertyName) {
			case "options":
				return this.options;
			default:
				return super.valueByPropertyName(propertyName)
		}
	}
}

export class SortSelection extends FilterBase {
	index: number
	ascending: boolean

	constructor(index: number, ascending: boolean) {
		super("")
		this.index = index
		this.ascending = ascending
		this.type = FilterType.sortSelection
	}

	override valueByPropertyName(propertyName: string): any {
		switch (propertyName) {
			case "index":
				return this.index;
			case "ascending":
				return this.ascending;
			default:
				return super.valueByPropertyName(propertyName)
		}
	}
}

export class SortFilter extends Filter<SortSelection> {
	options: string[]
	canAscend: boolean

	constructor(name: string, options: string[], canAscend: boolean = true, value: SortSelection = new SortSelection(0, false)) {
		super(name, value)
		this.options = options
		this.canAscend = canAscend
		this.type = FilterType.sort
	}

	override valueByPropertyName(propertyName: string): any {
		switch (propertyName) {
			case "options":
				return this.options;
			case "canAscend":
				return this.canAscend;
			default:
				return super.valueByPropertyName(propertyName)
		}
	}
}

export class GroupFilter extends Filter<any> {
	filters: FilterBase[]

	constructor(name: string, filters: FilterBase[]) {
		super(name, null)
		this.filters = filters
		this.type = FilterType.group
	}

	override valueByPropertyName(propertyName: string): any {
		switch (propertyName) {
			case "filters":
				return this.filters;
			default:
				return super.valueByPropertyName(propertyName)
		}
	}
}

export class TitleFilter extends TextFilter {
	constructor(value: string = "") {
		super("Title", value)
		this.type = FilterType.title
	}
}

export class AuthorFilter extends TextFilter {
	constructor(value: string = "") {
		super("Author", value)
		this.type = FilterType.author
	}
}

export class GenreFilter extends CheckFilter {
	constructor(name: string, canExclude: boolean, id: any = null, value: Optional<boolean> = null) {
		super(name, canExclude, id, value)
		this.type = FilterType.check
		this.canExclude = canExclude
		this.id = id
		this.type = FilterType.genre
	}
}