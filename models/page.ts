export class Page {
	index: number;
	imageUrl: string;
	base64: string;
	text: string;

	constructor(index: number, imageUrl: string = '', base64: string = '', text: string = '') {
		this.index = index;
		this.imageUrl = imageUrl;
		this.base64 = base64;
		this.text = text;
	}
}
