from concurrent import futures
import logging
import sys
import threading
import time
import os
import grpc

import erb_pb2
import erb_pb2_grpc

PORT = 4500

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('[%(asctime)s] [%(name)9s] - %(message)s')
ch.setFormatter(formatter)

logger = logging.getLogger('test-server')
logger.setLevel(logging.DEBUG)
logger.addHandler(ch)

if __name__ == '__main__':
    channel = grpc.insecure_channel(f'127.0.0.1:{PORT}')
    stub = erb_pb2_grpc.HeartbeatStub(channel)
    call_future = stub.SendHearbeat.future(erb_pb2.Hearbeat())
    logger.info(call_future.result())