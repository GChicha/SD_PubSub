import { Socket, createConnection, createServer } from 'net';
import { EventEmitter } from 'events';
import * as opts from 'optimist';

let args = opts
	.usage('Uso: $0 -s SERVER_PORT [-p PORT] [-h HOST]\nDefault HOST=localhost')
	.demand(['s']).argv;

const subsEmitter = new EventEmitter();

class Client {
	public socket : Socket;
	public subs   : Array<String> = [];

	constructor (socket : Socket) {
		this.socket = socket;
	}
}

let clientes : Array<Client> = [];

const server = createServer((newCliente : Socket) => {
	let cliente : Client = new Client(newCliente);
	clientes.push(cliente);

	newCliente.on("data", buf => {
		let obj = JSON.parse(buf.toString());

		if (obj.type == "subscribe") {
			cliente.subs.push(obj.tag);

			subsEmitter.emit('new_sub', obj.tag);
		} else if (obj.type == "publish") {
			publish(obj);
		}
	});
});

server.listen(args.s);

server.on("error", err => console.warn(err));

if (args.h || args.p) {
	const host = args.h || 'localhost';
	let subs : Array<String> = [];

	let socket = createConnection({
		port: args.p,
		host: host
	}, () => {
		console.info("Conectado ao host");
	});

	socket.on("connect", (socket : Socket) => {
		clientes.forEach(cliente => {
			cliente.subs.forEach(sub => {
				if (!subs.includes(sub))
					subs.push(sub);
			});
		});

		subs.forEach(sub => {
			socket.write(Buffer.from(JSON.stringify({
				type: "subscribe",
				tag: sub
			})));
		});

		subsEmitter.on('new_sub', tag => {
			if (!subs.includes(tag)) {
				subs.push(tag);
				socket.write(Buffer.from(JSON.stringify({
					type: "subscribe",
					tag: tag
				})));
			}
		});
	});

	socket.on('data', (data) => {
		let obj = JSON.parse(data.toString());
		if (obj.type == "publish")
			publish(data);
	});
}

function publish(data : any) {
	clientes.forEach(cliente =>  {
		if (!cliente.socket.destroyed && cliente.subs.includes(data.tag))
			cliente.socket.write(Buffer.from(JSON.stringify(data)));
	});
}
