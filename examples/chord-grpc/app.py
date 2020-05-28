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

    def __init__(self, ip, ring_node=None):
        self.node = chord_pb2.Node(ip=ip, id=sha1_hash(f'{ip}:{str(port)}'))

        if ring_node is not None:
            self.successor = call_find_successor(ring_node, chord_pb2.Key(key=self.node.id))
        else:
            self.successor = self.node

    def PutKey(self, request, context):
        return chord_pb2.PutKeyResponse()

    def GetKey(self, request, context):
        return chord_pb2.GetKeyResponse()

    def FindSuccessor(self, request, context):
        logger.info(f'FindSuccessor {request}')
        key = request.key
        if self.node.id == self.successor.id:
            return self.node
        if key >= self.node.id and key < self.successor.id:
            return self.successor
        else:
            return call_find_successor(self.successor, request)

    def Notify(self, request, context):
        logger.info(f'Notify {request}')
        notifier = request
        key = notifier.id

        with self.lock:
            if self.predecessor is None or self.predecessor.id == self.node.id or key >= self.predecessor.id and key < self.node.id:
                self.predecessor = notifier

        return chord_pb2.Empty()

    def GetPredecessor(self, request, context):
        logger.info(f'GetPredecessor {request}')
        return chord_pb2.GetPredecessorResponse(node=self.predecessor)

    def get_successor_pred(self):
        if self.successor.id == self.node.id:
            return self.predecessor
        else:
            return call_get_predecessor(self.successor).node

    def stabilize(self):
        x = self.get_successor_pred()

        if x != None and x.id >= self.node.id and x.id < self.successor.id:
            self.successor = x

        call_notify(self.successor, self.node)

def sha1_hash(val):
    return int.from_bytes(hashlib.sha1(val.encode()).digest(), 'big') % UINT32_MAX

def is_between(val, lower, upper):
    return val >= lower and val < upper

def call_find_successor(node, request):
    channel = grpc.insecure_channel(f'{node.ip}:{PROXY_PORT}')
    stub = chord_pb2_grpc.ChordStub(channel)
    return stub.FindSuccessor(request)

def call_get_predecessor(node):
    channel = grpc.insecure_channel(f'{node.ip}:{PROXY_PORT}')
    stub = chord_pb2_grpc.ChordStub(channel)
    return stub.GetPredecessor(chord_pb2.Empty())

def call_notify(node, request):
    channel = grpc.insecure_channel(f'{node.ip}:{PROXY_PORT}')
    stub = chord_pb2_grpc.ChordStub(channel)
    return stub.Notify(request)

def serve(chord_server):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    chord_pb2_grpc.add_ChordServicer_to_server(chord_server, server)
    server.add_insecure_port(f'[::]:{port}')
    server.start()
    # server.wait_for_termination()
    return server


if __name__ == '__main__':
    idx = 0
    hostname = '127.0.0.1'
    nodes = [hostname]
    port = PROXY_PORT

    # with open('/var/config/network.conf', 'r') as f:
    #     nodes = f.read().splitlines()

    # hostname = os.getenv('HOSTNAME')
    # idx = int(os.getenv('IDX'))
    # port = BIND_PORT

    logger.info(nodes)

    if idx == 0:
        chord_server = ChordServer(hostname)
    else:
        chord_server = ChordServer(hostname, ring_node=chord_pb2.Node(ip=nodes[0]))

    def stabilize():
        while True:
            time.sleep(1)

            logger.info(f'Stabilize')
            chord_server.stabilize()
            logger.info(f'Node: {chord_server.node} Pred: {chord_server.predecessor} Succ: {chord_server.successor}')

    server = serve(chord_server)

    stabilize_thread = threading.Thread(target=stabilize)
    stabilize_thread.start()

    server.wait_for_termination()