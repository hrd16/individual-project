Technologies Research
-

### Docker
*https://docs.docker.com/*

- Container runtime engine

### Kubertnetes
*https://kubernetes.io/docs/*

- Container orchestration
- Deploying & scaling containers
- **Nodes** refer to host with compute resources
- **Pods** are unit of deployment, pods are run on nodes
- Multiple containers per pod
- Limit of ~100 pods per node

Kubernetes uses dummy *pause* container to create shared network space inside a pod
![https://medium.com/google-cloud/understanding-kubernetes-networking-pods-7117dd28727](kubernetes_routing.png)

- StatefulSets unlinke Deployment provide *https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/*
	- Stable unique network identifiers
	- Stable persistent storage
	- Ordered graceful deployment and scaling
	- Ordered automatic rolling updates