import { CheckFilter, FilterBase, GenreFilter, GroupFilter, SelectFilter, SortFilter, SortSelection, TextFilter, TitleFilter } from "./models/filter";
import { Manga, MangaPageResult, MangaChapter, MangaFilter, MangaFilterType, MangaPage, MangaSource, MangaSourceType } from "../mangaSource";
import * as Aidoku from "./models";
import { BlobReader, ZipReader, TextWriter, Uint8ArrayWriter } from "@zip.js/zip.js";
import { Wasm } from "./webassembly/wasm";

export class AidokuSource implements MangaSource {
    name: string;
    id: string;
    version: string;
    type: MangaSourceType;
    nsfw: number;
    image: string;
    sourceJson: any;
    filtersJson: any;
    settingsJson: any;

    async getMangaList(filters: MangaFilter[], page: number): Promise<MangaPageResult> {
        let aidokuFilters: FilterBase[] = [];
        for (let filter of filters) {
            switch(filter.type) {
                case MangaFilterType.text:
                    switch(filter.name) {
                        case "Title": 
                            aidokuFilters.push(new TitleFilter(filter.value as string));
                            break;
                        case "Author":
                            aidokuFilters.push(new TitleFilter(filter.value as string));
                            break;
                        default:
                            aidokuFilters.push(new TextFilter(filter.name, filter.value as string));
                    }
                    break;
                case MangaFilterType.singleSelect:
                    aidokuFilters.push(new SelectFilter(filter.name, filter.value as string[], filter.index));
                    break;
                case MangaFilterType.singleSelectAscendable:
                    aidokuFilters.push(new SortFilter(filter.name, filter.value as string[], true, new SortSelection(filter.index, filter.ascending ?? false)));
                    break;
                case MangaFilterType.multiSelect:
                    let innerFilters: FilterBase[];
                    if(filter.name.includes("Genre")) {
                        innerFilters = (filter.value as string[]).map((value, index) => new GenreFilter(value, false, filter.ids?.[index] ?? null, null));
                    } else {
                        innerFilters = (filter.value as string[]).map((value, index) => new CheckFilter(value, false, filter.ids?.[index] ?? null, null));
                    }
                    aidokuFilters.push(new GroupFilter(filter.name, innerFilters));
                    break;
                case MangaFilterType.multiSelectAscendable:
                    let innerFilters2: FilterBase[];
                    if(filter.name.includes("Genre")) {
                        innerFilters2 = (filter.value as string[]).map((value, index) => new GenreFilter(value, true, filter.ids?.[index] ?? null, null));
                    } else {
                        innerFilters2 = (filter.value as string[]).map((value, index) => new CheckFilter(value, true, filter.ids?.[index] ?? null, null));
                    }
                    aidokuFilters.push(new GroupFilter(filter.name, innerFilters2));
                    break;
            }
        }
        Wasm.currentSource = this.id;
        let filterDescriptor = Wasm.storeStdValue(aidokuFilters);
        let resultDescriptor = await (Wasm.instances.get(Wasm.currentSource)!.exports as any).get_manga_list(filterDescriptor, page);
        let result = Wasm.readStdValue(resultDescriptor) as Aidoku.Manga.MangaPageResult;
        Wasm.removeStdValue(filterDescriptor);
        Wasm.removeStdValue(resultDescriptor);
        return new MangaPageResult(result.manga.map(m => new Manga(
            m.id,
            m.title,
            m.author,
            m.artist,
            m.description,
            m.tags,
            m.cover,
            m.url,
            m.status,
            m.nsfw,
        )), result.hasNextPage);
    }
    async getMangaListing(name: string, page: number): Promise<MangaPageResult> {
        let listing = new Aidoku.Listing.Listing(name);
        let listingDescriptor = Wasm.storeStdValue(listing);
        Wasm.currentSource = this.id;
        let resultDescriptor = await (Wasm.instances.get(Wasm.currentSource)!.exports as any).get_manga_listing(listingDescriptor, page);
        let result = Wasm.readStdValue(resultDescriptor) as Aidoku.Manga.MangaPageResult;
        Wasm.removeStdValue(listingDescriptor);
        Wasm.removeStdValue(resultDescriptor);
        return new MangaPageResult(result.manga.map(m => new Manga(
            m.id,
            m.title,
            m.author,
            m.artist,
            m.description,
            m.tags,
            m.cover,
            m.url,
            m.status,
            m.nsfw,
        )), result.hasNextPage);
    }
    async getMangaDetails(id: string): Promise<Manga> {
        let mangaDescriptor = Wasm.storeStdValue(new Aidoku.Manga.Manga(this.id, id));
        Wasm.currentSource = this.id;
        let resultDescriptor = await (Wasm.instances.get(Wasm.currentSource)!.exports as any).get_manga_details(mangaDescriptor);
        let result = Wasm.readStdValue(resultDescriptor) as Aidoku.Manga.Manga;
        Wasm.removeStdValue(mangaDescriptor);
        Wasm.removeStdValue(resultDescriptor);
        return new Manga(
            result.id,
            result.title,
            result.author,
            result.artist,
            result.description,
            result.tags,
            result.cover,
            result.url,
            result.status,
            result.nsfw,
        );
    }
    async getMangaChapters(id: string): Promise<MangaChapter[]> {
        let mangaDescriptor = Wasm.storeStdValue(new Aidoku.Manga.Manga(this.id, id));
        Wasm.currentSource = this.id;
        let resultDescriptor = await (Wasm.instances.get(Wasm.currentSource)!.exports as any).get_chapter_list(mangaDescriptor);
        let result = Wasm.readStdValue(resultDescriptor) as Aidoku.Chapter.Chapter[];
        Wasm.removeStdValue(mangaDescriptor);
        Wasm.removeStdValue(resultDescriptor);
        return result.map(c => new MangaChapter(
            c.id,
            c.chapterNum ?? 0,
            c.title,
            c.scanlator,
            c.dateUpdated,
            c.lang,
            c.volumeNum,
        ));
    }
    async getMangaChapterPages(id: string, chapterId: string): Promise<MangaPage[]> {
        let chapterDescriptor = Wasm.storeStdValue(new Aidoku.Chapter.Chapter(this.id, id, chapterId));
        Wasm.currentSource = this.id;
        let resultDescriptor = await (Wasm.instances.get(Wasm.currentSource)!.exports as any).get_chapter_pages(chapterDescriptor);
        let result = Wasm.readStdValue(resultDescriptor) as Aidoku.Page.Page[];
        Wasm.removeStdValue(chapterDescriptor);
        Wasm.removeStdValue(resultDescriptor);
        return result.map(p => new MangaPage(
            p.index,
            p.imageUrl,
            p.base64,
        ));
    }
    async init(url: string): Promise<void> {
        let file = await fetch(url).then(res => res.blob());
        let blobReader = new BlobReader(file);
        let zipReader = new ZipReader(blobReader);
        let entries = await zipReader.getEntries();
        let mainWasmEntry = entries.find(entry => entry.filename === "Payload/main.wasm");
        let sourceJsonEntry = entries.find(entry => entry.filename === "Payload/source.json");
        let filtersJsonEntry = entries.find(entry => entry.filename === "Payload/filters.json");
        let settingsJsonEntry = entries.find(entry => entry.filename === "Payload/settings.json");
        let textWriter = new TextWriter();
        let arrayWriter = new Uint8ArrayWriter();
        let mainWasm = await mainWasmEntry?.getData?.(arrayWriter) as Uint8Array ?? new Uint8Array(0);
        let sourceJsonText = await sourceJsonEntry?.getData?.(textWriter) as string;
        textWriter = new TextWriter();
        let filtersJsonText = await filtersJsonEntry?.getData?.(textWriter) as string;
        textWriter = new TextWriter();
        let settingsJsonText = await settingsJsonEntry?.getData?.(textWriter) as string;
        this.sourceJson = sourceJsonText ? JSON.parse(sourceJsonText) : {};
        this.filtersJson = filtersJsonText ? JSON.parse(filtersJsonText) : {};
        this.settingsJson = settingsJsonText ? JSON.parse(settingsJsonText) : {};
        this.id = this.sourceJson.info.id;
        this.name = this.sourceJson.info.name;
        this.version = this.sourceJson.info.version;
        this.type = MangaSourceType.Aidoku;
        this.nsfw = this.sourceJson.info.nsfw ?? 0;
        this.image = url.replace(/\/[^/]*$/, "/icons");
        for(let obj of this.settingsJson) {
            this.parseSettings(obj);
        }
        await Wasm.startWithData(this.id, mainWasm.buffer);
    }

    parseSettings(obj: {[key: string]: any}): void {
        switch(obj.type) {
            case "group":
                for(let child of obj.items) {
                    this.parseSettings(child);
                }
                break;
            case "switch":
                localStorage.setItem(`manga:aidoku:${this.id}:${obj.key}`, `boolean:${obj.default || false}`);
                break;
            case "stepper":
                localStorage.setItem(`manga:aidoku:${this.id}:${obj.key}`, `float:${obj.default || 0}`);
                break;
            case "text":
                localStorage.setItem(`manga:aidoku:${this.id}:${obj.key}`, `string:${obj.default || ""}`);
                break;
            case "segment":
                localStorage.setItem(`manga:aidoku:${this.id}:${obj.key}`, `string:${obj.default || ""}`);
                break;
            case "select":
                localStorage.setItem(`manga:aidoku:${this.id}:${obj.key}`, `string:${obj.default || ""}`);
                break;
            case "multi-select":
                localStorage.setItem(`manga:aidoku:${this.id}:${obj.key}`, `stringarray:${AidokuSource.stringArrayToString(obj.default as string[] || [])}`);
                break;
            case "multi-single-select":
                localStorage.setItem(`manga:aidoku:${this.id}:${obj.key}`, `stringarray:${AidokuSource.stringArrayToString(obj.default as string[] || [])}`);
                break;
            }
    }

    static stringArrayToString(arr: string[]): string {
        return arr.join("\0");
    }
}