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

def pre_process(src_dir, out_dir):
    copy_tree(src_dir, out_dir)
    shutil.copy('Dockerfile', out_dir)

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

    with open(path.join(path.dirname(__file__), "kubernetes", "log-server-deployment.yaml")) as f:
        deployment_yaml = yaml.safe_load(f)

    core_v1.create_namespaced_service(body=service_yaml, namespace=namespace)
    apps_v1.create_namespaced_deployment(body=deployment_yaml, namespace=namespace)

def create_fluentd(core_v1, apps_v1, namespace):
    with open(path.join(path.dirname(__file__), "kubernetes", "fluentd-config.yaml")) as f:
        config_yaml = yaml.safe_load(f)

    with open(path.join(path.dirname(__file__), "kubernetes", "fluentd-daemonset.yaml")) as f:
        daemonset_yaml = yaml.safe_load(f)

    core_v1.create_namespaced_config_map(body=config_yaml, namespace=namespace)
    apps_v1.create_namespaced_daemon_set(body=daemonset_yaml, namespace=namespace)

def create_service(api_client, namespace):
    with open(path.join(path.dirname(__file__), "kubernetes", "app-service.yaml")) as f:
        service_yaml = yaml.safe_load(f)

    api_client.create_namespaced_service(body=service_yaml, namespace=namespace)

def create_deployment(api_client, namespace, replicas):
    # Continer
    field_selector = client.V1ObjectFieldSelector(field_path="status.podIP")
    env_src = client.V1EnvVarSource(field_ref=field_selector)
    container_env = client.V1EnvVar(name="POD_IP", value_from=env_src)
    container_spec = client.V1Container(name="app", image="app:1.0", command=["python3"], 
        args=["app.py", "3", "$(POD_IP)"], env=[container_env])

    # Pod
    pod_spec = client.V1PodSpec(termination_grace_period_seconds=10, containers=[container_spec])
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

if __name__ == "__main__":
    dir_path = sys.argv[1]

    with tempfile.TemporaryDirectory() as tmp_dir:
        pre_process(dir_path, tmp_dir)
        build_image(tmp_dir)
        sim_config = read_config(tmp_dir)
        print('Config', sim_config)

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
    create_service(core_v1, namespace)

    print('Create app deployment')
    create_deployment(apps_v1, namespace, sim_config['replicas'])
