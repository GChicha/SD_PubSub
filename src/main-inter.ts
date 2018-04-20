import { Socket, createConnection, createServer } from 'net';
import { EventEmitter } from 'events';
import * as opts from 'optimist';

let args = opts
	.usage("Uso: $0 -s SERVER_PORT -n NAME [-p PORT] [-h HOST]\nDefault HOST=localhost")
	.demand(['s', 'n']).argv;

class Client {
	public socket : Socket;
	public subs   : Array<String> = [];

	constructor (socket : Socket) {
		this.socket = socket;
	}
}

let clientes : Array<Client> = [];
let emitter = new EventEmitter();

const server = createServer((newCliente : Socket) => {
	let cliente : Client = new Client(newCliente);
	clientes.push(cliente);

	newCliente.on("data", buf => {
		let obj = JSON.parse(buf.toString());

		if (obj.type == "subscribe") {
			clientes.forEach(cliente => setTimeout(() => {
				if (!cliente.socket.destroyed)
					cliente.socket.write(buf);
			}, 200));

			cliente.subs.push(obj.tag);
		} else if (obj.type == "publish")
			publish(obj);
	});
});

server.listen(args.s);

if (args.p) {
	const host = args.h || 'localhost';

	let serverSubs : Array<String> = [];

	let socket = createConnection({port: args.p, host: host});

	socket.on('data', data => {
		let obj = JSON.parse(data.toString());
		if (obj.type == "subscribe" && !serverSubs.includes(obj.tag))
			serverSubs.push(obj.tag);
	});

	emitter.on("publish", data => {
		if (serverSubs.includes(data.tag))
			socket.write(Buffer.from(JSON.stringify(data)));
	});
}

function publish(data : any) {
	clientes.forEach(cliente =>  {
		if (!cliente.socket.destroyed && cliente.subs.includes(data.tag))
			cliente.socket.write(Buffer.from(JSON.stringify(data)));
	});

	emitter.emit('publish', data);
}
