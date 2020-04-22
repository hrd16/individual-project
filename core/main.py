import sys
import tempfile
import shutil
from distutils.dir_util import copy_tree
import docker
from kubernetes import client, config
import yaml
from os import path
import uuid
from pprint import pprint
import argparse
import os
import shlex

def pre_process(dockerfile, src_dir, out_dir):
    copy_tree(src_dir, out_dir)
    shutil.copy(dockerfile, path.join(out_dir, 'Dockerfile'))
    shutil.copy('wrapper.sh', path.join(out_dir, 'wrapper.sh'))

def build_image(src_dir):
    client = docker.from_env()
    print('Building Docker image')
    client.images.build(path=src_dir, tag='app:1.0')

def read_config(src_dir):
    with open(path.join(src_dir, "sim.yaml"), 'r') as file:
        try:
            return yaml.safe_load(file)
        except yaml.YAMLError as e:
            print(e)

def create_namespace(api_client, namespace):
    metadata = client.V1ObjectMeta(name=namespace)
    body = client.V1Namespace(metadata=metadata)
    api_client.create_namespace(body=body)

def create_log_server(core_v1, apps_v1, namespace):
    with open(path.join(path.dirname(__file__), "kubernetes", "log-server-service.yaml")) as f:
        service_yaml = yaml.safe_load(f)

    with open(path.join(path.dirname(__file__), "kubernetes", "log-server-frontend-service.yaml")) as f:
        frontend_service_yaml = yaml.safe_load(f)

    with open(path.join(path.dirname(__file__), "kubernetes", "log-server-deployment.yaml")) as f:
        deployment_yaml = yaml.safe_load(f)

    core_v1.create_namespaced_service(body=service_yaml, namespace=namespace)
    core_v1.create_namespaced_service(body=frontend_service_yaml, namespace=namespace)
    apps_v1.create_namespaced_deployment(body=deployment_yaml, namespace=namespace)

def create_fluentd(core_v1, apps_v1, namespace):
    with open(path.join(path.dirname(__file__), "kubernetes", "fluentd-config.yaml")) as f:
        config_yaml = yaml.safe_load(f)

    with open(path.join(path.dirname(__file__), "kubernetes", "fluentd-daemonset.yaml")) as f:
        daemonset_yaml = yaml.safe_load(f)

    core_v1.create_namespaced_config_map(body=config_yaml, namespace=namespace)
    apps_v1.create_namespaced_daemon_set(body=daemonset_yaml, namespace=namespace)

def create_service(api_client, namespace, config):
    with open(path.join(path.dirname(__file__), "kubernetes", config)) as f:
        service_yaml = yaml.safe_load(f)

    api_client.create_namespaced_service(body=service_yaml, namespace=namespace)

def create_client_deployment(api_client, namespace, config, server_config):
    replicas = config['replicas']
    server_replicas = server_config['replicas']
    command = config['command']
    network = shlex.quote(server_config['network'])

    # Volume
    volume = client.V1Volume(name='configvol')

    # Env Vars
    pod_ns_fs = client.V1ObjectFieldSelector(field_path="metadata.namespace")
    pod_ns_src = client.V1EnvVarSource(field_ref=pod_ns_fs)
    pod_ns_env = client.V1EnvVar(name="POD_NAMESPACE", value_from=pod_ns_src)

    pod_n_fs = client.V1ObjectFieldSelector(field_path="metadata.name")
    pod_n_src = client.V1EnvVarSource(field_ref=pod_n_fs)
    pod_n_env = client.V1EnvVar(name="POD_NAME", value_from=pod_n_src)

    # Init Container
    init_container_volume = client.V1VolumeMount(name='configvol', mount_path="/var/config", read_only=False)

    init_container_spec = client.V1Container(name="init", image="init-config:1.0", command=["python3"],
        args=["network.py", str(server_replicas), "$(POD_NAMESPACE)", "$(POD_NAME)", network, str(replicas)], env=[pod_ns_env, pod_n_env],
        volume_mounts=[init_container_volume])

    # Container
    app_container_volume = client.V1VolumeMount(name='configvol', mount_path="/var/config", read_only=False)

    app_container_spec = client.V1Container(name="client", image="app:1.0", 
        command=["/bin/sh"], args=["-c", f"eval 'source ./wrapper.sh; {command}'"], 
        volume_mounts=[app_container_volume], env=[pod_ns_env, pod_n_env])

    # Pod
    pod_spec = client.V1PodSpec(termination_grace_period_seconds=10, 
        init_containers=[init_container_spec],
        containers=[app_container_spec],
        volumes=[volume])
    pod_metadata = client.V1ObjectMeta(labels={"client": "client-service"})
    pod_template_spec = client.V1PodTemplateSpec(metadata=pod_metadata, spec=pod_spec)

    # StatefulSet
    statefulset_selector = client.V1LabelSelector(match_labels={"client": "client-service"})
    statefulset_spec = client.V1StatefulSetSpec(replicas=replicas, pod_management_policy="Parallel", 
        service_name="client-service", selector=statefulset_selector, template=pod_template_spec)
    statefulset_metadata = client.V1ObjectMeta(name="client")
    deployment = client.V1StatefulSet(api_version="apps/v1", metadata=statefulset_metadata, spec=statefulset_spec)

    # Deploy
    api_client.create_namespaced_stateful_set(body=deployment, namespace=namespace)

def create_app_deployment(api_client, namespace, config):
    replicas = config['replicas']
    command = config['command']
    latency = config.get('latency', 0)
    dropRate = config.get('dropRate', 0)
    network = shlex.quote(config['network'])

    # Volume
    volume = client.V1Volume(name='configvol')

    # Env Vars
    pod_ns_fs = client.V1ObjectFieldSelector(field_path="metadata.namespace")
    pod_ns_src = client.V1EnvVarSource(field_ref=pod_ns_fs)
    pod_ns_env = client.V1EnvVar(name="POD_NAMESPACE", value_from=pod_ns_src)

    pod_n_fs = client.V1ObjectFieldSelector(field_path="metadata.name")
    pod_n_src = client.V1EnvVarSource(field_ref=pod_n_fs)
    pod_n_env = client.V1EnvVar(name="POD_NAME", value_from=pod_n_src)

    # Init Container
    init_container_volume = client.V1VolumeMount(name='configvol', mount_path="/var/config", read_only=False)

    init_container_spec = client.V1Container(name="init", image="init-config:1.0", command=["python3"],
        args=["network.py", str(replicas), "$(POD_NAMESPACE)", "$(POD_NAME)", network], env=[pod_ns_env, pod_n_env],
        volume_mounts=[init_container_volume])

    # wait_service_container_spec = client.V1Container(name="init-wait-service", image="busybox", 
    #     command=['sh'], args=['-c', f'for i in {{1..20}}; do sleep 1; if nslookup app-service.{namespace}.svc.cluster.local; then exit 0; fi; done; exit 1'])

    # Container
    app_container_volume = client.V1VolumeMount(name='configvol', mount_path="/var/config", read_only=False)

    app_container_spec = client.V1Container(name="app", image="app:1.0", 
        command=["/bin/sh"], args=["-c", f"eval 'source ./wrapper.sh; {command}'"],
        volume_mounts=[app_container_volume], env=[pod_ns_env, pod_n_env])

    # HAProxy Container
    haproxy_container_spec = client.V1Container(name="haproxy", image="app-haproxy:1.0")

    # App Proxy Container
    app_proxy_container_spec = client.V1Container(name="goproxy", image="app-proxy:1.0", 
        args=[str(replicas), "$(POD_NAMESPACE)", str(latency), str(dropRate)], env=[pod_ns_env])

    # Pod
    pod_spec = client.V1PodSpec(termination_grace_period_seconds=10, 
        containers=[app_container_spec, haproxy_container_spec, app_proxy_container_spec],
        init_containers=[init_container_spec],
        volumes=[volume])
    pod_metadata = client.V1ObjectMeta(labels={"app": "app-service"})
    pod_template_spec = client.V1PodTemplateSpec(metadata=pod_metadata, spec=pod_spec)

    # StatefulSet
    statefulset_selector = client.V1LabelSelector(match_labels={"app": "app-service"})
    statefulset_spec = client.V1StatefulSetSpec(replicas=replicas, pod_management_policy="Parallel", 
        service_name="app-service", selector=statefulset_selector, template=pod_template_spec)
    statefulset_metadata = client.V1ObjectMeta(name="app")
    deployment = client.V1StatefulSet(api_version="apps/v1", metadata=statefulset_metadata, spec=statefulset_spec)

    # Deploy
    api_client.create_namespaced_stateful_set(body=deployment, namespace=namespace)

def runtime_dockerfile(runtime):
    if runtime == 'elixir':
        return 'Dockerfile-elixir'
    if runtime == 'python':
        return 'Dockerfile-python'
    raise Exception('Invalid runtime', runtime)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=str)
    args = parser.parse_args()

    sim_config = read_config(args.directory)
    print('Config', sim_config)

    with tempfile.TemporaryDirectory() as tmp_dir:
        pre_process(runtime_dockerfile(sim_config['runtime']), args.directory, tmp_dir)
        build_image(tmp_dir)

    config.load_kube_config()
    core_v1 = client.CoreV1Api()
    apps_v1 = client.AppsV1Api()
    apps_v1_ext = client.ExtensionsV1beta1Api()

    namespace = uuid.uuid4().hex

    print('Create namespace', namespace)
    create_namespace(core_v1, namespace)

    print('Create log server')
    create_log_server(core_v1, apps_v1, namespace)

    print('Create fluentd')
    create_fluentd(core_v1, apps_v1_ext, namespace)

    print('Create app service')
    create_service(core_v1, namespace, "app-service.yaml")

    print('Create app deployment')
    create_app_deployment(apps_v1, namespace, sim_config['server'])

    if 'client' in sim_config:
        print('Create client service')
        create_service(core_v1, namespace, "client-service.yaml")

        print('Create client deployment')
        create_client_deployment(apps_v1, namespace, sim_config['client'], sim_config['server'])

    print(f'Web client hosted on http://localhost:31234')
