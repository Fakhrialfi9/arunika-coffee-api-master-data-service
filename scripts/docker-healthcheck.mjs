import net from 'node:net';

const host = process.env.GRPC_MASTER_HOST ?? '127.0.0.1';
const port = Number(process.env.GRPC_MASTER_PORT ?? 50053);

const socket = net.createConnection({ host, port });

const timeout = setTimeout(() => {
  socket.destroy();
  process.exit(1);
}, 4000);

timerRef(timeout);

socket.once('connect', () => {
  clearTimeout(timeout);
  socket.end();
  process.exit(0);
});

socket.once('error', () => {
  clearTimeout(timeout);
  process.exit(1);
});

function timerRef(timer) {
  timer.unref();
}
