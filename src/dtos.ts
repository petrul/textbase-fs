export class Attr {
    mtime: Date;
    atime: Date;
    ctime: Date;
    nlink: number;
    size: number;
    mode: number;
    uid: number;
    gid: number;
}

export class AuthorDto {
    strId: string;
    lastName: string;
    firstName: string;
    originalNameInTeiFile: string;
    opera: TeiDivDto[];
}

export class TeiDivDto {
    path: string;
    urlFragment: string;
    children: TeiDivDto[];
    leaf: boolean;
    size: number;
    wordSize: number;
}

