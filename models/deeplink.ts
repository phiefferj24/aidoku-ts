import { Chapter } from "./chapter";
export class DeepLink {
	manga: Manga;
	chapter: Chapter;

	constructor(manga: Manga, chapter: Chapter) {
		this.manga = manga;
		this.chapter = chapter;
	}
}
