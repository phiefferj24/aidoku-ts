import { Wasm } from "../wasm";

export class Env {
    static getNamespace(): string {
        return 'env';
    }
    static getExports(): WebAssembly.ModuleImports {
        return {
            print: this.print,
            abort: this.abort
        };
    }

    static print(str: number, length: number): void {
        if (length <= 0) {
            return;
        }
        let strString = Wasm.readString(str, length);
        console.log(strString);
    }
    static abort(msg: number, fileName: number, line: number, column: number) {
        let messageLength = Wasm.readBytes(msg - 4, 1)[0];
        let fileLength = Wasm.readBytes(fileName - 4, 1)[0];

        let message = Wasm.readString(msg, messageLength);
        let file = Wasm.readString(fileName, fileLength);

        console.error(`${message} ${file}:${line}:${column}`);
    }
}