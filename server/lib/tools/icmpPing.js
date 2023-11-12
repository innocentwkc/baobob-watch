// icmpPing.js
import raw from 'raw-socket';
import { performance } from 'perf_hooks';
import EventEmitter from 'events';

function icmpPing(host, timeout = 5000, count = -1) {
  const socket = raw.createSocket({ protocol: raw.Protocol.ICMP });
  const emitter = new EventEmitter();
  let sentCount = 0;
  let isPinging = true;
  let startTimes = new Map();

  socket.on('message', (buffer, source) => {
    if (source === host && isPinging) {
      const endTime = performance.now();
      const startTime = startTimes.get(sentCount);
      const time = endTime - startTime;
      emitter.emit('data', `Ping to ${host}: Sequence ${sentCount + 1}, Time: ${time.toFixed(2)}ms`);
      sentCount++;
      
      if (count !== -1 && sentCount >= count) {
        isPinging = false;
        socket.close();
        emitter.emit('complete', 'Ping process completed.');
        startTimes.clear();
      }
    }
  });

  const ping = () => {
    if (!isPinging) return;

    const buffer = Buffer.from([0x08, 0x00, 0x7d, 0x3b, 0x00, 0x00, 0x00, 0x00]);
    startTimes.set(sentCount, performance.now());
    socket.send(buffer, 0, buffer.length, host, (err) => {
      if (err) {
        emitter.emit('error', err);
      }
    });

    if (count === -1 || sentCount < count - 1) {
      setTimeout(ping, timeout);
    }
  };

  ping();

  return emitter;
}

export default icmpPing;
