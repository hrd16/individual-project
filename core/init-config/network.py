import sys

PROXY_PORT = 4500

class Node:
    def __init__(self, id):
        self.id = id
        self.edges = []

    def add_edge(self, node):
        if not node in self.edges:
            self.edges.append(node)


class Network:
    def __init__(self, num_nodes):
        self.nodes = []
        for i in range(num_nodes):
            self.nodes.append(Node(i))

    def num_nodes(self):
        return len(self.nodes)

    def get_node(self, id):
        return self.nodes[id]

    def next_node_id(self, id):
        return (id + 1) % self.num_nodes()

    def prev_node_id(self, id):
        return (id - 1) % self.num_nodes()


def create_star(network):
    for i in range(network.num_nodes()):
        for j in range(network.num_nodes()):
            if i != j:
                network.get_node(i).add_edge(j)
                network.get_node(j).add_edge(i)


def create_line(network):
    for i in range(network.num_nodes() - 1):
        next = network.next_node_id(i)
        network.get_node(i).add_edge(next)
        network.get_node(next).add_edge(i)


def create_ring(network):
    for i in range(network.num_nodes()):
        next = network.next_node_id(i)
        network.get_node(i).add_edge(next)
        network.get_node(next).add_edge(i)


if __name__ == "__main__":
    replicas = int(sys.argv[1])
    namespace = sys.argv[2]
    ordinal = int(sys.argv[3].split('-')[1])
    network_str = sys.argv[4]

    network_str = network_str.replace("\\n", "\n")
    network_str = network_str.strip("\'")

    print(f'Init pod {ordinal} of {replicas}')

    network = Network(replicas)
   
    cc = compile(network_str, 'temp', 'exec')
    exec(cc)

    node = network.get_node(ordinal)
    
    with open('/var/config/network.conf', 'w') as f:
        for i in node.edges:
            f.write(f'app-{i}.app-service.{namespace}.svc.cluster.local:{PROXY_PORT}\n')

