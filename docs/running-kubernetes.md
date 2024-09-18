### Documentation: How to Deploy the "Success" Application on Kubernetes

This guide explains how to deploy the "Success" application on a Kubernetes cluster using the configuration provided in the `examples/kubernetes.yaml` file.

#### Prerequisites:
- A running Kubernetes cluster.
- The Kubernetes CLI (`kubectl`) installed and configured to communicate with your cluster.
- The `examples/kubernetes.yaml` file, which contains the Kubernetes manifest for deploying the "Success" application.

### Steps to Deploy the "Success" Application:

#### 1. **Create your kubernernetes manifest**

The deployment configuration for the "Success" application is located in the `examples/kubernetes.yaml` file. This file contains the necessary configuration for deploying the application, including Deployment, Service, and any other resources required by Kubernetes.

Navigate to the directory where this file is stored:

```bash
cd path/to/your/project/
curl -o https://github.com/mbseid/success/blob/main/examples/kubernetes.yaml success.yaml
```

#### 2. **Update the `success.yaml` File**

Before applying the configuration, it’s a good practice to inspect the contents of the `kubernetes.yaml` file to understand what is being deployed. You can view the file using any text editor or using the `cat` command:

```bash
cat kubernetes.yaml
```

A typical Kubernetes YAML file contains definitions for resources like `Deployment`, `Service`, `ConfigMap`, and `Secret`.  **Update the secrets within `success-secrets`.

#### 3. **Deploy the Application**

To deploy the application, you use the `kubectl apply` command. This command reads the Kubernetes manifest from the YAML file and creates the necessary resources in the cluster.

Run the following command from the directory where the `success.yaml` file is located:

```bash
kubectl apply -f success.yaml
```

The `kubectl apply` command will create the Deployment, Service, and any other specified resources in your Kubernetes cluster.

#### 4. **Verify the Deployment**

After deploying the application, you can verify that the pods and services are running correctly.

To check the status of the pods:

```bash
kubectl get pods
```

This will output a list of pods, showing whether they are running successfully:

```
NAME                                READY   STATUS    RESTARTS   AGE
success-backend-7d5c65bbcd-b2c47    1/1     Running   0          1m
success-frontend-7d5c65bbcd-x3h5r   1/1     Running   0          1m
postgres-7d5c65bbcd-v2g5f           1/1     Running   0          1m
```

To check the status of the service and get the external IP (if using a LoadBalancer):

```bash
kubectl get services
```

This will output something like this:

```
NAME                    TYPE           CLUSTER-IP      EXTERNAL-IP    PORT(S)        AGE
success-app-service      LoadBalancer   10.3.240.1      <pending>      80:31245/TCP   1m
```

If the `EXTERNAL-IP` is `<pending>`, wait a few minutes for your cloud provider to provision the load balancer. Once the `EXTERNAL-IP` is available, you can access your application using that IP.

#### 5. **Access the Application**

Once the service is running, and the `EXTERNAL-IP` is available, you can access the "Success" application by navigating to that IP in your browser. For example:

```
http://<EXTERNAL-IP>
```

This should bring up the "Success" application if everything is configured and deployed correctly.

#### 6. **Cleanup**

If you want to remove the deployment and associated resources from your Kubernetes cluster, you can use the following command:

```bash
kubectl delete -f kubernetes.yaml
```

This will delete all resources created by the manifest file.

### Documentation: How to Run Django Migrations on a Kubernetes Pod Manually Using `kubectl exec`

This guide explains how to manually run Django migrations within a Kubernetes (K8s) environment by executing the `python manage.py migrate` command inside a running pod using `kubectl exec`. This approach is useful for controlled, on-demand migration execution.

#### Prerequisites:
- A running Kubernetes cluster with a deployed Django application.
- Access to the Kubernetes cluster using `kubectl`.
- The `python manage.py migrate` command is available in your Django project.
  
### Steps:

#### 1. **Identify the Pod Running the Success Backend Application**

To run the migration, you first need to find the name of the pod that is running your Django application.

Run the following command to list all pods in the Kubernetes cluster:

```bash
kubectl get pods
```

This will output a list of running pods. Identify the pod associated with your Django application by its name or labels.

Example output:

```
NAME                          READY   STATUS    RESTARTS   AGE
django-app-7d5c65bbcd-b2c47   1/1     Running   0          5m
postgres-db-6f97d57f74-2djnr  1/1     Running   0          5m
```

In this example, the Django pod is `django-app-7d5c65bbcd-b2c47`.

#### 2. **Access the Django Pod**

Once you have the pod name, you can access it using the `kubectl exec` command. This command allows you to execute commands within the running pod.

To start an interactive shell session inside the Django pod, run:

```bash
kubectl exec -it <pod-name> -- /bin/bash
```

For example:

```bash
kubectl exec -it django-app-7d5c65bbcd-b2c47 -- /bin/bash
```

This opens a shell session inside the pod, where you can run commands as if you were on a local machine.

#### 3. **Run the Django Migration Command**

With the shell open, you can now run the Django migration command. Inside the pod, navigate to the project directory if necessary, and then run:

```bash
python manage.py migrate
```

This command applies any outstanding migrations to your database.

#### 4. **Verify the Migration**

Once the command completes, you should see output indicating which migrations were applied. If there were no pending migrations, it will indicate that the database is already up-to-date.

Example output:

```
Operations to perform:
  Apply all migrations: auth, contenttypes, sessions, myapp
Running migrations:
  Applying myapp.0001_initial... OK
  Applying myapp.0002_auto_20210901_1200... OK
```

#### 5. **Exit the Pod**

After verifying that the migrations have run successfully, exit the pod by typing:

```bash
exit
```

This will close the interactive session and return you to your local terminal.

#### 6. **Optional: Confirm the Application is Working**

After running the migrations, you may want to check that your application is running correctly. You can inspect the logs of the Django pod to ensure there are no issues:

```bash
kubectl logs <pod-name>
```

For example:

```bash
kubectl logs django-app-7d5c65bbcd-b2c47
```

### Troubleshooting:

- If you encounter database connection issues, ensure that your database is properly configured and accessible from the pod.
- If `manage.py` is not found, make sure you're in the correct directory within the pod where your Django project resides.

### Conclusion:

By following these steps, you can manually execute Django migrations in a Kubernetes environment using `kubectl exec`. This method gives you precise control over when migrations are applied and is useful for troubleshooting or manual deployment processes.