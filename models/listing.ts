export class Listing {
	name: string;

	constructor(name: string) {
		this.name = name;
	}

	valueByPropertyName(propertyName: string): any {
		switch (propertyName) {
			case 'name':
				return this.name;
		}
	}
}
