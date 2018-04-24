import { Socket, createConnection } from 'net';
import { ReadLine, createInterface } from 'readline';
import * as opts from 'optimist';

let args = opts
	.usage('Uso: $0 -p PORT [-h HOST] -n NAME -t TAG [-t TAG...]\nDefault HOST=localhost')
	.demand(['p', 't', 'n']).argv;

let host = args.h || "localhost";

let socketRaw = createConnection({port: args.p, host: host});
let socket = createInterface({
    input: socketRaw,
    output: socketRaw
});

socket.on("connect", () => {
    if (args.t.forEach == undefined)
        socket.write(JSON.stringify({type: "subscribe", tag: args.t}) + '\n');
    else args.t.forEach((tag : String) => {
        socket.write(JSON.stringify({
            type: "subscribe",
            tag: tag
        }) + '\n');
    });
});

socket.on("line", buf => {
	let obj = JSON.parse(buf);
	if (obj.type == "publish") console.log(JSON.stringify(obj, null, 2), args.n);
});
