import { Socket, createConnection, createServer } from 'net';
import * as opts from 'optimist';

let args = opts
    .usage("Uso: $0 -s SERVER_PORT -n NAME [-p PORT] [-h HOST]\nDefault HOST=localhost")
    .demand(['s', 'n']).argv;

class Client {
    public socket : Socket;
    public subs   : Array<String> = [];

    constructor (socket : Socket) {this.socket = socket;}
}

let clientes : Array<Client> = [];

const server = createServer((newCliente : Socket) => {
    let cliente : Client = new Client(newCliente);
    clientes.push(cliente);

    newCliente.on("data", buf => {
        let obj = JSON.parse(buf.toString());

        if (obj.type == "subscribe") {
            send_all(obj, newCliente, true);

            cliente.subs.push(obj.tag);
        } else if (obj.type == "publish") send_all(obj, newCliente, false);
    });
});

server.listen(args.s);

if (args.p) {
    const host = args.h || 'localhost';

    let serverSock = createConnection({port: args.p, host: host});
    let serverCliente = new Client(serverSock);
    clientes.push(serverCliente);

    serverSock.on('data', data => {
        let obj = JSON.parse(data.toString());
        if (obj.type == "subscribe" && !serverCliente.subs.includes(obj.tag))
            serverCliente.subs.push(obj.tag);
    });
}

function send_all(data : any, socket_origin : Socket, to_tags : Boolean) {
    clientes.forEach(cliente =>  {
        if (!cliente.socket.destroyed &&
            (cliente.subs.includes(data.tag) || to_tags) &&
            socket_origin != cliente.socket)
            cliente.socket.write(JSON.stringify(data));
    });
}
