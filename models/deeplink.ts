import { Chapter } from "./chapter";
import { Manga } from "./manga";
export class DeepLink {
	manga: Manga;
	chapter: Chapter;

	constructor(manga: Manga, chapter: Chapter) {
		this.manga = manga;
		this.chapter = chapter;
	}
}
