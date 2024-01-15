import axios from 'axios';
import { AuthorDto, TeiDivDto } from './dtos';


export class TextbaseClient {

    constructor(public baseurl: string = 'https://textbase.scriptorium.ro') {}

    async getAuthors() : Promise<AuthorDto[]> {
        const url = `${this.baseurl}/api/drest/authors?size=1000`
        const resp = await axios.get(url);
        return resp.data._embedded.authors;
    }

    async getAuthorsNames() : Promise<string[]> {
        const authors = await this.getAuthors();
        return TextbaseClient.getAuthorsNamesFromDtos(authors);
    }

    static getAuthorsNamesFromDtos(authors: AuthorDto[]) : string[] {
        return authors
            .map(it => it.strId)
            .filter(it => it);
    }

    static getTeiDivFragmentsFromDtos(divs: TeiDivDto[]) : string[] {
        return divs
            .map(it => it.urlFragment)
            .filter(it => it);
    }

    get api_authors(): string { return `${this.baseurl}/api/authors`; }
    get api_divs(): string { return `${this.baseurl}/api/divs`; }

    async getAuthor(strId: string) : Promise<AuthorDto> {
        const url = `${this.api_authors}/${strId}`;
        const resp = await axios.get(url);
        return resp.data;
    }

    async getAuthorsOpera(strId: string) : Promise<TeiDivDto[]> {
        const url = `${this.api_authors}/${strId}/opera`;
        const resp = await axios.get(url);
        return resp.data;
    }

    async getAuthorsOperaFragments(strId: string) : Promise<string[]> {
        const resp = await this.getAuthorsOpera(strId);
        return resp.map(it => it.urlFragment);
    }

    async getDiv(path: string) : Promise<TeiDivDto> {
        const url = `${this.api_divs}?path=${path}`;
        // console.log(`GET ${url}`);
        const resp = await axios.get(url);
        return resp.data;
    }

    async getDivAsDecoratedHtml(path: string) : Promise<string> {
        if (!path.startsWith('/'))
            path = `/${path}`;
        const url = `${this.baseurl}${path}`;
        const resp = await axios.get<string>(url);
        return resp.data;
    }

    async getDivAsTextPlain(path: string) : Promise<string> {
        if (!path.startsWith('/'))
            path = `/${path}`;
        const url = `${this.baseurl}${path}`;
        const resp = await axios.get<string>(url, {
            headers: {
                'Accept': 'text/plain'
            }
        });
        return resp.data;
    }

    async getDivToc(id: number) : Promise<TeiDivDto[]> {
        const url = `${this.baseurl}/api/divs/${id}/toc`;
        const resp = await axios.get<TeiDivDto[]>(url);
        return Promise.resolve(resp.data);
    }

}