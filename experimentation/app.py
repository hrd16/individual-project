import time
import sys
import socket
import threading
import signal
import logging

PORT = 4400

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('[%(name)9s] - %(message)s')
ch.setFormatter(formatter)

broadcast_logger = logging.getLogger('broadcast')
broadcast_logger.setLevel(logging.DEBUG)
broadcast_logger.addHandler(ch)

listen_logger = logging.getLogger('listen')
listen_logger.setLevel(logging.DEBUG)
listen_logger.addHandler(ch)

def broadcast(stop, num_replicas):
    i = 0
    while not stop.is_set():
        for replica in range(num_replicas):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)

                broadcast_logger.info(f'{i} to replica {replica}')

                try:
                    s.connect((f'app-{replica}.app-service.default.svc.cluster.local', PORT))
                    s.sendall(bytes(f'Hello World {i}', 'utf-8'))
                except Exception as e:
                    broadcast_logger.error(e)
            
        i += 1
        time.sleep(1)

    broadcast_logger.info('Stopped')

def listen(stop, hostname):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        s.bind((hostname, PORT))
        s.listen()
        while not stop.is_set():
            try:
                conn, addr = s.accept()
                with conn:
                    while True:
                        data = conn.recv(1024)
                        if not data:
                            break
                        listen_logger.info(f'{repr(data)} from {addr}')
            except socket.timeout:
                pass
            except Exception as e:
                listen_logger.error(e)

    listen_logger.info('Stopped')

def main():
    num_replicas = 1 if len(sys.argv) < 3 else int(sys.argv[1])
    hostname = '127.0.0.1' if len(sys.argv) < 3 else sys.argv[2]

    print('Replicas:', num_replicas)
    print('Hostname:', hostname)

    # Handle graceful exit
    stop_event = threading.Event()
    original_sigint = signal.getsignal(signal.SIGINT)

    def exit_gracefully(signum, frame):
        signal.signal(signal.SIGINT, original_sigint)
        stop_event.set()
        signal.signal(signal.SIGINT, exit_gracefully)

    signal.signal(signal.SIGINT, exit_gracefully)

    # Start listen & broadcast threads
    listen_thread = threading.Thread(target=listen, args=[stop_event, hostname])
    broadcast_thread = threading.Thread(target=broadcast, args=[stop_event, num_replicas])

    listen_thread.start()
    broadcast_thread.start()

    broadcast_thread.join()
    listen_thread.join()

if __name__ == '__main__':
    main()