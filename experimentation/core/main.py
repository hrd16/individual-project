import sys
import tempfile
import shutil
from distutils.dir_util import copy_tree
import docker

def pre_process(src_dir, out_dir):
    copy_tree(src_dir, out_dir)
    shutil.copy('Dockerfile', out_dir)

def process(src_dir):
    client = docker.from_env()
    print('Building Docker image')
    print(client.images.build(path=src_dir, tag='app:1.0'))

if __name__ == "__main__":
    dir_path = sys.argv[1]

    with tempfile.TemporaryDirectory() as tmp_dir:
        pre_process(dir_path, tmp_dir)
        process(tmp_dir)