import { Socket, createConnection } from 'net';
import * as opts from 'optimist';

let args = opts
	.usage('Uso: $0 -p PORT [-h HOST] -t TAG\nDefault HOST=localhost')
	.demand(['p', 't']).argv;

let host = args.h || "localhost";

let socket = createConnection({
	port: args.p,
	host: host
});

socket.on("connect", () => {
	socket.write(Buffer.from(JSON.stringify({
		type: "subscribe",
		tag: args.t
	})));
});

socket.on("data", buf => {
	let obj = JSON.parse(buf.toString());
	console.log(obj, null, 2);
});
