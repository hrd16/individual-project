export SERVICE=$(echo "$POD_NAME" | cut -d- -f1 | awk '{print tolower($0)}')
export IDX=$(echo "$POD_NAME" | cut -d- -f2)
export HOSTNAME=${POD_NAME}.${SERVICE}-service.${POD_NAMESPACE}.svc.cluster.local