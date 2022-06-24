export class Chapter {
	sourceId: string;
	id: string;
	mangaId: string;
	title: string;
	scanlator: string;
	url: string;
	lang: string;
	chapterNum: number;
	volumeNum: number;
	dateUpdated: Date;
	sourceOrder: number;

	constructor(
		sourceId: string,
		id: string,
		mangaId: string,
		title: string,
		scanlator: string,
		url: string,
		lang: string,
		chapterNum: number,
		volumeNum: number,
		dateUpdated: Date,
		sourceOrder: number
	) {
		this.sourceId = sourceId;
		this.id = id;
		this.mangaId = mangaId;
		this.title = title;
		this.scanlator = scanlator;
		this.url = url;
		this.lang = lang;
		this.chapterNum = chapterNum;
		this.volumeNum = volumeNum;
		this.dateUpdated = dateUpdated;
		this.sourceOrder = sourceOrder;
	}

	valueByPropertyName(propertyName: string): any {
		switch (propertyName) {
			case 'id':
				return this.id;
			case 'mangaId':
				return this.mangaId;
			case 'title':
				return this.title;
			case 'scanlator':
				return this.scanlator;
			case 'url':
				return this.url;
			case 'chapterNum':
				return this.chapterNum;
			case 'volumeNum':
				return this.volumeNum;
		}
	}
}
