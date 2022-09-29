import { Chapter } from './chapter';
export class Volume {
	title: string;
	sortNumber: number;
	chapters: Chapter[];
	constructor(title: string, sortNumber: number, chapters: Chapter[]) {
		this.title = title;
		this.sortNumber = sortNumber;
		this.chapters = chapters;
	}
}
