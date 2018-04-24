import { Socket, createConnection, createServer } from 'net';
import { ReadLine, createInterface } from 'readline';
import * as opts from 'optimist';

let args = opts
	.usage("Uso: $0 -s SERVER_PORT -n NAME [-p PORT] [-h HOST]\nDefault HOST=localhost")
	.demand(['s', 'n']).argv;

class Client {
	public socket : ReadLine;
	public subs   : Array<String> = [];

	constructor (socket : ReadLine) {this.socket = socket;}
}

let serverSock : ReadLine | null = null;
let serverSubs : Array<String> = [];

let clientes : Array<Client> = [];

const server = createServer((newCliente : Socket) => {
    let cliente : Client = new Client(createInterface({
        input: newCliente,
        output: newCliente
    }));

	clientes.push(cliente);

	newCliente.on("line", (buf : string) => {
		let obj = JSON.parse(buf);

		if (obj.type == "subscribe") {
			clientes.forEach(cliente => cliente.socket.write(buf + '\n'));

            if (serverSock != null) serverSock.write(buf + '\n');

			cliente.subs.push(obj.tag);
		} else if (obj.type == "publish") publish(obj);
	});
});

server.listen(args.s);

if (args.p) {
	const host = args.h || 'localhost';

	let serverSocket = createConnection({port: args.p, host: host});

    serverSock = createInterface({
        input: serverSocket,
        output: serverSocket
    });

	serverSock.on('line', (data : string) => {
		let obj = JSON.parse(data);
		if (obj.type == "subscribe" && !serverSubs.includes(obj.tag))
			serverSubs.push(obj.tag);
	});
}

function publish(data : any) {
	clientes.forEach(cliente =>  {
		if (cliente.subs.includes(data.tag))
			cliente.socket.write(JSON.stringify(data) + '\n');
	});

    if (serverSock && serverSubs.includes(data.tag))
        serverSock.write(JSON.stringify(data) + '\n');
}
