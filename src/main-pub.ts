import { Socket, createConnection } from 'net';
import { ReadLine, createInterface } from 'readline';
import * as opts from 'optimist';

let args = opts
	.usage('Uso: $0 -p PORT [-h HOST] -n NAME -t TAG -d DATA\nDefault HOST=localhost')
	.demand(['p', 'd', 't', 'n']).argv;

let host = args.h || "localhost";

let socketRaw : Socket = createConnection({port: args.p, host: host});
let socket = createInterface({
    input: socketRaw,
    output: socketRaw
});

socket.on("connect", () => {
	socket.write(JSON.stringify({
		type: "publish",
		tag: args.t,
		data: args.d
	}) + '\n');

	socketRaw.end();
});
