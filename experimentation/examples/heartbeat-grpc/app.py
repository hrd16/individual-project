from concurrent import futures
import logging
import sys
import threading
import time

import grpc

import erb_pb2
import erb_pb2_grpc

PROXY_PORT = 4500
BIND_PORT = 4400

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('[%(asctime)s] [%(name)9s] - %(message)s')
ch.setFormatter(formatter)

logger = logging.getLogger('test-server')
logger.setLevel(logging.DEBUG)
logger.addHandler(ch)

class TestServer(erb_pb2_grpc.HeartbeatServicer):

    def SendHearbeat(self, request, context):
        return erb_pb2.HearbeatReply()


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    erb_pb2_grpc.add_HeartbeatServicer_to_server(TestServer(), server)
    server.add_insecure_port(f'[::]:{BIND_PORT}')
    server.start()
    server.wait_for_termination()


def heartbeat(exit_flag, nodes):
    interval = 1.0
    timeout = 3.0
    last_seen = {node: time.time() for node in nodes}
    channels = {node: grpc.insecure_channel(node) for node in nodes}

    def update_heartbeat(node, call_future):
        try:
            logger.info(f'Response {node} - {call_future.result()}')
            last_seen[node] = time.time()
        except Exception as e:
            logger.error(f'Exception {node} {e}')

    def check_heartbeat(node):
        diff = time.time() - last_seen[node]
        if diff > timeout:
            logger.error(f'Node {node} failed heartbeat {diff}')

    while not exit_flag.is_set():
        for node in nodes:
            check_heartbeat(node)
            stub = erb_pb2_grpc.HeartbeatStub(channels[node])
            call_future = stub.SendHearbeat.future(erb_pb2.Hearbeat(), timeout=timeout)
            call_future.add_done_callback(lambda r, node=node, future=call_future: update_heartbeat(node, future))

        time.sleep(interval)


if __name__ == '__main__':
    sim = len(sys.argv) >= 3
    num_replicas = int(sys.argv[1]) if sim else 1
    hostname = sys.argv[2] if sim else '127.0.0.1'
    namespace = sys.argv[3] if sim else 'default'

    logger.info(f'Replicas: {num_replicas}')
    logger.info(f'Hostname: {hostname}')
    logger.info(f'Namespace: {namespace}')

    nodes = [f'{hostname}:{PROXY_PORT}']
    if sim:
        nodes = [f'app-{i}.app-service.{namespace}.svc.cluster.local:{PROXY_PORT}' for i in range(num_replicas)]

    logger.info(nodes)

    exit_flag = threading.Event()
    t = threading.Thread(name='heartbeat', target=heartbeat, args=[exit_flag, nodes], daemon=True)
    t.start()

    serve()

    exit_flag.set()
    t.join()