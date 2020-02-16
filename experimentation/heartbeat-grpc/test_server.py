from concurrent import futures
import logging
import sys
import threading
import time

import grpc

import erb_pb2
import erb_pb2_grpc

PORT = 4400

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('[%(name)9s] - %(message)s')
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
    server.add_insecure_port(f'[::]:{PORT}')
    server.start()
    server.wait_for_termination()


def heartbeat(exit_flag, nodes):
    interval = 1.0
    timeout = 5.0
    last_seen = {node: time.time() for node in nodes}
    channels = {node: grpc.insecure_channel(node) for node in nodes}

    def update_heartbeat(node):
        t = time.time()
        if t - last_seen[node] > timeout:
            logger.error(f'Node {node} failed heartbeat')

        last_seen[node] = t

    while not exit_flag.is_set():
        for node in nodes:
            stub = erb_pb2_grpc.HeartbeatStub(channels[node])
            call_future = stub.SendHearbeat.future(erb_pb2.Hearbeat())
            call_future.add_done_callback(lambda r: update_heartbeat(node))
            time.sleep(interval)


if __name__ == '__main__':
    sim = len(sys.argv) >= 3
    num_replicas = int(sys.argv[1]) if sim else 1
    hostname = sys.argv[2] if sim else '127.0.0.1'
    nodes = [f'{hostname}:{PORT}']
    if sim:
        nodes = [f'app-{i}.app-service.default.svc.cluster.local:{PORT}' for i in range(num_replicas)]
        nodes = nodes.remove(hostname)

    logger.info(nodes)

    exit_flag = threading.Event()
    t = threading.Thread(name='heartbeat', target=heartbeat, args=[exit_flag, nodes], daemon=True)
    t.start()

    serve()

    exit_flag.set()
    t.join()