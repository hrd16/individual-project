from concurrent import futures
import logging
import sys
import threading
import time
import os
import grpc
import random
import hashlib

import chord_pb2
import chord_pb2_grpc

BIND_PORT = 4400
PROXY_PORT = 4500
UINT32_MAX = 0xffffffff

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('[%(asctime)s] [%(name)9s] - %(message)s')
ch.setFormatter(formatter)

logger = logging.getLogger('chord-server')
logger.setLevel(logging.DEBUG)
logger.addHandler(ch)

class ChordServer(chord_pb2_grpc.ChordServicer):

    node = None
    successor = None
    predecessor = None
    lock = threading.Lock()

    hash_table = {}

    def __init__(self, ip, idx):
        self.node = chord_pb2.Node(ip=ip, id=sha1_hash(f'{ip}-{idx}'))

    def join(self, ring_node=None):
        logger.info(f'join {ring_node}'.replace('\n', ' '))
        if ring_node is not None:
            while True:
                try:
                    logger.info(f'Pinging {ring_node.ip}:{PROXY_PORT}')
                    channel = grpc.insecure_channel(f'{ring_node.ip}:{PROXY_PORT}')
                    stub = chord_pb2_grpc.ChordStub(channel)
                    stub.Ping(chord_pb2.Empty())
                    break
                except Exception as e:
                    time.sleep(1)

            logger.info('Ring node alive')

        if ring_node is not None:
            self.successor = call_find_successor(ring_node, chord_pb2.Key(id=self.node.id))
        else:
            self.successor = self.node

        assert self.successor != None

        self.predecessor = self.get_successor_pred()

        logger.info(f'created {self}')

    def PutKey(self, request, context):
        logger.info(f'PutKey {request}'.replace('\n', ' '))
        key = request.key
        keyNode = call_find_successor(self.successor, key)

        if self.node.id == keyNode.id:
            self.hash_table[key.id] = request.val.value
        else:
            return call_put_key(keyNode, request)

        return chord_pb2.PutKeyResponse()

    def GetKey(self, request, context):
        logger.info(f'GetKey {request}'.replace('\n', ' '))
        key = request.key
        keyNode = call_find_successor(self.successor, key)

        if self.node.id == keyNode.id:
            if key.id in self.hash_table:
                return chord_pb2.GetKeyResponse(val=chord_pb2.Value(value=self.hash_table[key.id]))
            else:
                return chord_pb2.GetKeyResponse()
        else:
            return call_get_key(keyNode, request)

    def Ping(self, request, context):
        logger.info('Ping')
        return chord_pb2.Empty()

    def FindSuccessor(self, request, context):
        logger.info(f'FindSuccessor {request}'.replace('\n', ' '))
        keyId = request.id

        if (is_between(keyId, self.node.id, self.successor.id) 
                or keyId == self.node.id 
                or self.node.id == self.successor.id):
            return self.successor
        else:
            return call_find_successor(self.successor, request)

    def Notify(self, request, context):
        logger.info(f'Notify {request}'.replace('\n', ' '))
        notifier = request

        with self.lock:
            if self.predecessor is None or is_between(notifier.id, self.predecessor.id, self.node.id):
                self.predecessor = notifier
                logger.info(f'Notify updated predecessor {notifier}'.replace('\n', ' '))
            else:
                # ping current predecessor to check if alive
                pass

        return chord_pb2.Empty()

    def GetPredecessor(self, request, context):
        # logger.info(f'GetPredecessor {request}'.replace('\n', ' '))
        return self.predecessor

    def get_successor_pred(self):
        if self.successor.id == self.node.id:
            return self.predecessor
        else:
            return call_get_predecessor(self.successor)

    def stabilize(self):
        with self.lock:
            x = self.get_successor_pred()

            if x != None and is_between(x.id, self.node.id, self.successor.id):
                self.successor = x

        call_notify(self.successor, self.node)

    def __repr__(self):
        return f'Node [{self.node}] Successor [{self.successor}] Predecessor [{self.predecessor}]'.replace('\n', ' ')

def sha1_hash(val):
    return int.from_bytes(hashlib.sha1(val.encode()).digest(), 'big') % UINT32_MAX

def is_between(val, lower, upper):
    if lower < upper:
       return lower < val and val < upper 
    else:
        return lower < val or val < upper

def call_get_key(node, request):
    try:
        channel = grpc.insecure_channel(f'{node.ip}:{PROXY_PORT}')
        stub = chord_pb2_grpc.ChordStub(channel)
        return stub.GetKey(request)
    except Exception as e:
        logger.error(e)

def call_put_key(node, request):
    try:
        channel = grpc.insecure_channel(f'{node.ip}:{PROXY_PORT}')
        stub = chord_pb2_grpc.ChordStub(channel)
        return stub.PutKey(request)
    except Exception as e:
        logger.error(e)

def call_find_successor(node, request):
    try:
        channel = grpc.insecure_channel(f'{node.ip}:{PROXY_PORT}')
        stub = chord_pb2_grpc.ChordStub(channel)
        return stub.FindSuccessor(request)
    except Exception as e:
        logger.error(e)

def call_get_predecessor(node):
    try:
        channel = grpc.insecure_channel(f'{node.ip}:{PROXY_PORT}')
        stub = chord_pb2_grpc.ChordStub(channel)
        return stub.GetPredecessor(chord_pb2.Empty())
    except Exception as e:
        logger.error(e)

def call_notify(node, request):
    try:
        channel = grpc.insecure_channel(f'{node.ip}:{PROXY_PORT}')
        stub = chord_pb2_grpc.ChordStub(channel)
        return stub.Notify(request)
    except Exception as e:
        logger.error(e)

def serve(chord_server, port):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    chord_pb2_grpc.add_ChordServicer_to_server(chord_server, server)
    server.add_insecure_port(f'[::]:{port}')
    server.start()
    time.sleep(2)
    # server.wait_for_termination()
    return server


if __name__ == '__main__':
    # idx = int(sys.argv[1])
    idx = 0
    port = PROXY_PORT + idx
    hostname = '127.0.0.1'
    nodes = [hostname]

    with open('/var/config/network.conf', 'r') as f:
        nodes = f.read().splitlines()

    hostname = os.getenv('HOSTNAME')
    idx = int(os.getenv('IDX'))
    port = BIND_PORT

    logger.info(nodes)

    if idx == 0:
        time.sleep(5)
        chord_server = ChordServer(hostname, idx)
    else:
        time.sleep(10)
        chord_server = ChordServer(hostname, idx)

    def stabilize():
        try:
            while True:
                time.sleep(1)

                chord_server.stabilize()
                logger.info(chord_server)
        except Exception as e:
            logger.info(f'Stablizize thread died {e}')

    server = serve(chord_server, port)
    stabilize_thread = threading.Thread(target=stabilize)
    chord_server.join(chord_pb2.Node(ip=nodes[0]) if idx > 0 else None)
    stabilize_thread.start()

    server.wait_for_termination()