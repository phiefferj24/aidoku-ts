import { Chapter } from '../../models/chapter';
import { Page } from '../../models/page';
import { Wasm } from '../wasm';
import { Manga, MangaPageResult } from '../../models/manga';
import { DeepLink } from '../../models/deeplink'
export class Aidoku {
	static getNamespace(): string {
		return 'aidoku';
	}
	static getExports(): WebAssembly.ModuleImports {
		return {
			create_manga: this.create_manga,
			create_manga_result: this.create_manga_result,
			create_chapter: this.create_chapter,
			create_page: this.create_page,
			create_deeplink: this.create_deeplink
		};
	}

	static create_manga(
		id: number,
		idLen: number,
		coverUrl: number,
		coverUrlLen: number,
		title: number,
		titleLen: number,
		author: number,
		authorLen: number,
		artist: number,
		artistLen: number,
		description: number,
		descriptionLen: number,
		url: number,
		urlLen: number,
		tags: number,
		tagsStrLens: number,
		tagCount: number,
		status: number,
		nsfw: number,
		viewer: number
	): number {
		if (idLen <= 0) {
			return -1;
		}
		let idString = Wasm.readString(id, idLen);
		let tagList: string[] = [];
		let tagBytes = Wasm.readBytes(tags, tagCount * 4);
		let tagLengthBytes = Wasm.readBytes(tagsStrLens, tagCount * 4);
		for (let i = 0; i < tagCount * 4; i += 4) {
			let tagPtr: number = tagBytes[i] + (tagBytes[i + 1] << 8) + (tagBytes[i + 2] << 16) + (tagBytes[i + 3] << 24);
			let tagLen: number = tagLengthBytes[i] + (tagLengthBytes[i + 1] << 8) + (tagLengthBytes[i + 2] << 16) + (tagLengthBytes[i + 3] << 24);
			let tag = Wasm.readString(tagPtr, tagLen);
			tagList.push(tag);
		}
		let manga = new Manga(
			Wasm.currentSource,
			idString,
			titleLen > 0 ? Wasm.readString(title, titleLen) : '',
			authorLen > 0 ? Wasm.readString(author, authorLen) : '',
			artistLen > 0 ? Wasm.readString(artist, artistLen) : '',
			descriptionLen > 0 ? Wasm.readString(description, descriptionLen) : '',
			tagList,
			coverUrlLen > 0 ? Wasm.readString(coverUrl, coverUrlLen) : '',
			urlLen > 0 ? Wasm.readString(url, urlLen) : '',
			status,
			nsfw,
			viewer
		);
		return Wasm.storeStdValue(manga);
	}

	static create_manga_result(mangaArray: number, hasMore: number) {
		let mangaList = Wasm.readStdValue(mangaArray) as Manga[];
		let result = Wasm.storeStdValue(new MangaPageResult(mangaList, hasMore != 0));
		Wasm.addStdReference(result, mangaArray);
		return result;
	}

	static create_chapter(
		id: number,
		idLen: number,
		name: number,
		nameLen: number,
		volume: number,
		chapter: number,
		dateUploaded: number,
		scanlator: number,
		scanlatorLen: number,
		url: number,
		urlLen: number,
		lang: number,
		langLen: number
	) {
		if (idLen <= 0) {
			return -1;
		}
		let chapterId = Wasm.readString(id, idLen);
		let chapterobj = new Chapter(
			Wasm.currentSource,
			chapterId,
			Wasm.currentManga,
			nameLen > 0 ? Wasm.readString(name, nameLen) : '',
			scanlatorLen > 0 ? Wasm.readString(scanlator, scanlatorLen) : '',
			urlLen > 0 ? Wasm.readString(url, urlLen) : '',
			langLen > 0 ? Wasm.readString(lang, langLen) : '',
			chapter,
			volume,
			new Date(dateUploaded),
			Wasm.chapterCounter
		);
		Wasm.chapterCounter++;
		return Wasm.storeStdValue(chapterobj);
	}

	static create_page(
		index: number,
		imageUrl: number,
		imageUrlLen: number,
		base64: number,
		base64Len: number,
		text: number,
		textLen: number
	) {
		return Wasm.storeStdValue(
			new Page(
				index,
				imageUrlLen > 0 ? Wasm.readString(imageUrl, imageUrlLen) : '',
				base64Len > 0 ? Wasm.readString(base64, base64Len) : '',
				textLen > 0 ? Wasm.readString(text, textLen) : ''
			)
		);
	}

	static create_deeplink(manga: number, chapter: number) {
		return Wasm.storeStdValue(
			new DeepLink(
				Wasm.readStdValue(manga) as Manga,
				Wasm.readStdValue(chapter) as Chapter
			)
		);
	}
}
