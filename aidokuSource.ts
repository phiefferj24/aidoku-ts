import { CheckFilter, FilterBase, GenreFilter, GroupFilter, SelectFilter, SortFilter, SortSelection, TextFilter, TitleFilter } from "./models/filter";
import { Manga, MangaPageResult, MangaChapter, MangaPage, MangaSource, MangaSourceType, ExternalMangaSource } from "../mangaSource";
import * as Aidoku from "./models";
import { BlobReader, ZipReader, TextWriter, Uint8ArrayWriter } from "@zip.js/zip.js";
import { Wasm } from "./webassembly/wasm";
import * as Source from "../../source";

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

    async getFilters(): Promise<Source.Filter[]> {
        let filters: Source.Filter[] = [];
        for (let filter of this.filtersJson) {
            if (filter.type === "title") {
                filters.push(new Source.TextFilter("Title"));
            } else if (filter.type === "author") {
                filters.push(new Source.TextFilter("Author"));
            } else if (filter.type === "group" && filter.filters.length > 0) {
                let indices = filter.filters.map((item, index) => item["index"] = index).filter(item => item.default === true).map(item => item.index);
                filters.push(new Source.MultiSelectFilter(filter.name, filter.filters.map(f => f.name), filter.filters[0].canExclude ?? false, filter.filters.map(f => f.id), indices));
            } else if (filter.type === "sort") {
                filters.push(new Source.SortFilter(filter.name, filter.options, filter.canAscend, [], filter.default.index, filter.default.ascending))
            } else if (filter.type === "select") {
                filters.push(new Source.SingleSelectFilter(filter.name, filter.options, filter.canExclude ?? false, [], filter.default))
            }
        }
        return filters;
    }

    async getMangaList(filters: Source.Filter[], page: number): Promise<MangaPageResult> {
        let aidokuFilters: FilterBase[] = [];
        for (let filter of filters) {
            switch (filter.type) {
                case Source.FilterType.text:
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
                case Source.FilterType.singleSelect:
                    aidokuFilters.push(new SelectFilter(filter.name, filter.value as string[], (<Source.SingleSelectFilter>filter).index));
                    break;
                case Source.FilterType.sort:
                    aidokuFilters.push(new SortFilter(filter.name, filter.value as string[], (<Source.SortFilter>filter).canAscend, new SortSelection((<Source.SortFilter>filter).index, (<Source.SortFilter>filter).ascending)));
                    break;
                case Source.FilterType.multiSelect:
                    let innerFilters: FilterBase[];
                    if(filter.name.includes("Genre")) {
                        innerFilters = (filter.value as string[]).map((value, index) => new GenreFilter(value, (<Source.MultiSelectFilter>filter).canExclude, (<Source.MultiSelectFilter>filter).ids?.[index] ?? null, ((<Source.MultiSelectFilter>filter).excludings)[index]));
                    } else {
                        innerFilters = (filter.value as string[]).map((value, index) => new CheckFilter(value, (<Source.MultiSelectFilter>filter).canExclude, (<Source.MultiSelectFilter>filter).ids?.[index] ?? null, ((<Source.MultiSelectFilter>filter).excludings)[index]));
                    }
                    aidokuFilters.push(new GroupFilter(filter.name, innerFilters));
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
            c.volumeNum === -1 ? null : c.volumeNum,
        ));
    }
    async getMangaChapterPages(id: string, chapterId: string): Promise<MangaPage[]> {
        let chapterDescriptor = Wasm.storeStdValue(new Aidoku.Chapter.Chapter(this.id, chapterId, id));
        Wasm.currentSource = this.id;
        let resultDescriptor = await (Wasm.instances.get(Wasm.currentSource)!.exports as any).get_page_list(chapterDescriptor);
        let result = Wasm.readStdValue(resultDescriptor) as Aidoku.Page.Page[];
        Wasm.removeStdValue(chapterDescriptor);
        Wasm.removeStdValue(resultDescriptor);
        return result.map(p => new MangaPage(
            p.index,
            p.imageUrl,
            p.base64,
        ));
    }
    async init(json: any, url: string): Promise<void> {
        let baseUrl = url.replace(/\/[^/]*$/, "");
        let res = await fetch(url).then(res => res.json());
        let info = res.find(i => i.id === json.id);
        let file = await fetch(baseUrl + "/sources/" + info.file).then(res => res.blob());
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
        this.settingsJson = settingsJsonText ? JSON.parse(settingsJsonText) : [];
        this.id = this.sourceJson.info.id;
        this.name = this.sourceJson.info.name;
        this.version = this.sourceJson.info.version;
        this.type = MangaSourceType.aidoku;
        this.nsfw = this.sourceJson.info.nsfw ?? 0;
        this.image = baseUrl + "/icons/" + json.icon;
        for(let obj of this.settingsJson) {
            this.parseSettings(obj);
        }
        let sourceLang = this.id.split(".")[0];
        if(sourceLang === "multi") {
            let defaults = JSON.parse(localStorage.getItem("manga") || "{}");
            if(!defaults['aidoku']) defaults['aidoku'] = {};
            if(!defaults['aidoku'][this.id]) defaults['aidoku'][this.id] = {};
            let languages = window.navigator.languages || [window.navigator.language] || [];
            let defaultLanguages: string[] = [];
            if(this.sourceJson.languages) {
                for(let i = 0; i < this.sourceJson.languages.length; ++i) {
                    let language = this.sourceJson.languages[i];
                    if(languages.includes(language.code)) {
                        defaultLanguages.push(language.value ?? language.code)
                    }
                }
                if(defaultLanguages.length === 0) {
                    for(let i = 0; i < this.sourceJson.languages.length; ++i) {
                        let language = this.sourceJson.languages[i];
                        if(language.default) {
                            defaultLanguages.push(language.value ?? language.code)
                        }
                    }
                }
                if(defaultLanguages.length === 0 && this.sourceJson.languages.length > 0) {
                    defaultLanguages.push(this.sourceJson.languages[0].value ?? this.sourceJson.languages[0].code)
                }
                if(this.sourceJson.languageSelectType === "single" && this.sourceJson.languages.length > 0) {
                    defaultLanguages = [this.sourceJson.languages[0].value ?? this.sourceJson.languages[0].code]
                }
                defaults['aidoku'][this.id]['languages'] = `stringarray:${AidokuSource.stringArrayToString(defaultLanguages)}`;
            }
            localStorage.setItem("manga", JSON.stringify(defaults));
        }
        await Wasm.startWithData(this.id, mainWasm.buffer);
    }

    parseSettings(obj: {[key: string]: any}): void {
        let defaults;
        switch(obj.type) {
            case "group":
                for(let child of obj.items) {
                    this.parseSettings(child);
                }
                break;
            case "switch":
                defaults = JSON.parse(localStorage.getItem("manga") || "{}");
                if(!defaults['aidoku']) defaults['aidoku'] = {};
                if(!defaults['aidoku'][this.id]) defaults['aidoku'][this.id] = {};
                if(obj.default) defaults['aidoku'][this.id][obj.key] = `boolean:${obj.default || false}`;
                localStorage.setItem("manga", JSON.stringify(defaults));
                break;
            case "stepper":
                defaults = JSON.parse(localStorage.getItem("manga") || "{}");
                if(!defaults['aidoku']) defaults['aidoku'] = {};
                if(!defaults['aidoku'][this.id]) defaults['aidoku'][this.id] = {};
                if(obj.default) defaults['aidoku'][this.id][obj.key] = `float:${obj.default || 0}`;
                localStorage.setItem("manga", JSON.stringify(defaults));
                break;
            case "text":
                defaults = JSON.parse(localStorage.getItem("manga") || "{}");
                if(!defaults['aidoku']) defaults['aidoku'] = {};
                if(!defaults['aidoku'][this.id]) defaults['aidoku'][this.id] = {};
                if(obj.default) defaults['aidoku'][this.id][obj.key] = `string:${obj.default || ""}`;
                localStorage.setItem("manga", JSON.stringify(defaults));
                break;
            case "segment":
                defaults = JSON.parse(localStorage.getItem("manga") || "{}");
                if(!defaults['aidoku']) defaults['aidoku'] = {};
                if(!defaults['aidoku'][this.id]) defaults['aidoku'][this.id] = {};
                if(obj.default) defaults['aidoku'][this.id][obj.key] = `string:${obj.default || ""}`;
                localStorage.setItem("manga", JSON.stringify(defaults));
                break;
            case "select":
                defaults = JSON.parse(localStorage.getItem("manga") || "{}");
                if(!defaults['aidoku']) defaults['aidoku'] = {};
                if(!defaults['aidoku'][this.id]) defaults['aidoku'][this.id] = {};
                if(obj.default) defaults['aidoku'][this.id][obj.key] = `string:${obj.default || ""}`;
                localStorage.setItem("manga", JSON.stringify(defaults));
                break;
            case "multi-select":
                defaults = JSON.parse(localStorage.getItem("manga") || "{}");
                if(!defaults['aidoku']) defaults['aidoku'] = {};
                if(!defaults['aidoku'][this.id]) defaults['aidoku'][this.id] = {};
                if(obj.default) defaults['aidoku'][this.id][obj.key] = `stringarray:${AidokuSource.stringArrayToString(obj.default as string[] || [])}`;
                localStorage.setItem("manga", JSON.stringify(defaults));
                break;
            case "multi-single-select":
                defaults = JSON.parse(localStorage.getItem("manga") || "{}");
                if(!defaults['aidoku']) defaults['aidoku'] = {};
                if(!defaults['aidoku'][this.id]) defaults['aidoku'][this.id] = {};
                if(obj.default) defaults['aidoku'][this.id][obj.key] = `stringarray:${AidokuSource.stringArrayToString(obj.default as string[] || [])}`;
                localStorage.setItem("manga", JSON.stringify(defaults));
                break;
            }
    }

    static stringArrayToString(arr: string[]): string {
        return arr.join("\0");
    }

    static parseSourceList(list: any, url: string): ExternalMangaSource[] {
        let sources: ExternalMangaSource[] = [];
        for(let obj of list) {
            sources.push({
                name: obj.name,
                id: obj.id,
                version: obj.version,
                type: MangaSourceType.aidoku,
                nsfw: obj.nsfw,
                image: url.replace(/\/[^/]*$/, `/icons/${obj.icon}`),
                listUrl: url,
            } as ExternalMangaSource);
        }
        const languageCodes = [
            "multi", "en", "ca", "de", "es", "fr", "id", "it", "pl", "pt-br", "vi", "tr", "ru", "ar", "zh", "zh-hans", "ja", "ko"
        ]
        sources = sources.sort((a, b) => {
            let aLang = languageCodes.indexOf(a.id.split(".")[0]);
            let bLang = languageCodes.indexOf(b.id.split(".")[0]);
            if(aLang < bLang) return -1;
            if(aLang > bLang) return 1;
            return 0;
        });
        return sources;
    }
}