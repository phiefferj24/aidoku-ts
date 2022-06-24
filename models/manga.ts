export enum MangaStatus {
	unknown = 0,
	ongoing = 1,
	completed = 2,
	cancelled = 3,
	hiatus = 4
}

export enum MangaContentRating {
	safe = 0,
	suggestive = 1,
	nsfw = 2
}

export enum MangaViewer {
	defaultViewer = 0,
	rtl = 1,
	ltr = 2,
	vertical = 3,
	scroll = 4
}

export class Manga {
	sourceId: string;
	id: string;
	title: string;
	author: string;
	artist: string;
	description: string;
	tags: string[];
	cover: string;
	url: string;
	status: MangaStatus;
	nsfw: MangaContentRating;
	viewer: MangaViewer;
	lastUpdated: Date;
	lastOpened: Date;
	lastRead: Date;
	dateAdded: Date;

	constructor(
		sourceId: string,
		id: string,
		title: string = '',
		author: string = '',
		artist: string = '',
		description: string = '',
		tags: string[] = [],
		cover: string = '',
		url: string = '',
		status: MangaStatus = MangaStatus.unknown,
		nsfw: MangaContentRating = MangaContentRating.safe,
		viewer: MangaViewer = MangaViewer.defaultViewer,
		lastUpdated: Date = new Date(),
		lastOpened: Date = new Date(),
		lastRead: Date = new Date(),
		dateAdded: Date = new Date()
	) {
		this.sourceId = sourceId;
		this.id = id;
		this.title = title;
		this.author = author;
		this.artist = artist;
		this.description = description;
		this.tags = tags;
		this.cover = cover;
		this.url = url;
		this.status = status;
		this.nsfw = nsfw;
		this.viewer = viewer;
		this.lastUpdated = lastUpdated;
		this.lastOpened = lastOpened;
		this.lastRead = lastRead;
		this.dateAdded = dateAdded;
	}

	valueByPropertyName(propertyName: string): any {
		switch (propertyName) {
			case 'id':
				return this.id;
			case 'title':
				return this.title;
			case 'author':
				return this.author;
			case 'artist':
				return this.artist;
			case 'description':
				return this.description;
			case 'tags':
				return this.tags;
			case 'cover':
				return this.cover;
			case 'url':
				return this.url;
			case 'status':
				return this.status;
			case 'nsfw':
				return this.nsfw;
			case 'viewer':
				return this.viewer;
		}
	}
}

export class MangaPageResult {
	manga: Manga[];
	hasNextPage: boolean;

	constructor(manga: Manga[], hasNextPage: boolean) {
		this.manga = manga;
		this.hasNextPage = hasNextPage;
	}
}
