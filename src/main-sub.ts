import { Socket, createConnection } from 'net';
import * as opts from 'optimist';

let args = opts
	.usage('Uso: $0 -p PORT [-h HOST] -n NAME -t TAG [-t TAG...]\nDefault HOST=localhost')
	.demand(['p', 't', 'n']).argv;

let host = args.h || "localhost";

let socket = createConnection({port: args.p, host: host});

socket.on("connect", () => {
    if (args.t.forEach == undefined)
        socket.write(Buffer.from(JSON.stringify({type: "subscribe", tag: args.t})));
    else args.t.forEach((tag : String) => {
        setTimeout(() => {
            socket.write(Buffer.from(JSON.stringify({
                type: "subscribe",
                tag: tag
            })));
        }, 100);
    });
});

socket.on("data", buf => {
	let obj = JSON.parse(buf.toString());
	if (obj.type == "publish") console.log(JSON.stringify(obj, null, 2), args.n);
});
