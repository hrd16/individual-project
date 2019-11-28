import time
import sys
import socket
import threading
import signal

num_replicas = 1 if len(sys.argv) < 2 else int(sys.argv[1])

HOST = '127.0.0.1'
PORT = 4400

def broadcast(stop):
    i = 0
    while not stop.is_set():
        print(f"Broadcasting {i} Num Replicas {num_replicas}")

        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((HOST, PORT))
            s.sendall(bytes(f'Hello World {i}', 'utf-8'))
        
        i += 1
        time.sleep(1)

    print('BROADCAST STOPPED')

def listen(stop):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        s.bind((HOST, PORT))
        s.listen()
        while not stop.is_set():
            try:
                conn, addr = s.accept()
                with conn:
                    while True:
                        data = conn.recv(1024)
                        if not data:
                            break
                        print(f'Received {repr(data)} from {addr}')
            except socket.timeout:
                pass

    print('LISTEN STOPPED')

stop_event = threading.Event()

def exit_gracefully(signum, frame):
    signal.signal(signal.SIGINT, original_sigint)
    stop_event.set()
    signal.signal(signal.SIGINT, exit_gracefully)

listen_thread = threading.Thread(target=listen, args=[stop_event])
broadcast_thread = threading.Thread(target=broadcast, args=[stop_event])

original_sigint = signal.getsignal(signal.SIGINT)
signal.signal(signal.SIGINT, exit_gracefully)

listen_thread.start()
broadcast_thread.start()

broadcast_thread.join()
listen_thread.join()