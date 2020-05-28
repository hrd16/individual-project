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

logger = logging.getLogger('chord-client')
logger.setLevel(logging.DEBUG)
logger.addHandler(ch)

if __name__ == '__main__':
    with open('/var/config/network.conf', 'r') as f:
        nodes = f.read().splitlines()

    hostname = os.getenv('HOSTNAME')
    idx = int(os.getenv('IDX'))

    logger.info(nodes)

    time.sleep(30)

    channel = grpc.insecure_channel(f'{nodes[0]}:{PROXY_PORT}')
    stub = chord_pb2_grpc.ChordStub(channel)


    logger.info('Putting')
    stub.PutKey(chord_pb2.PutKeyRequest(key=chord_pb2.Key(id=100), val=chord_pb2.Value(value=b'hello world 100')))
    stub.PutKey(chord_pb2.PutKeyRequest(key=chord_pb2.Key(id=200), val=chord_pb2.Value(value=b'hello world 200')))
    stub.PutKey(chord_pb2.PutKeyRequest(key=chord_pb2.Key(id=300), val=chord_pb2.Value(value=b'hello world 300')))

    time.sleep(5)

    logger.info('Getting')
    res = stub.GetKey(chord_pb2.GetKeyRequest(key=chord_pb2.Key(id=100)))
    logger.info(f'Get result {res.val.value}')

    while True:
        time.sleep(1)