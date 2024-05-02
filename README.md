# JAIST_chatbot_v3

<p align="center"> 
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/diagram.png" alt="drawing" style="width:80%;"/>
</p>

In this project, I focus on deploying my ChatBot on Google Cloud Kubernetes (GKE). If you would like to understand more about my app which relies on RAG, please visit my previous project [JAIST_chatbot_v2](https://github.com/tdtu98/JAIST_Chatbot_v2).

## Requirements

First, you need to set up Google Cloud Platform (GCP) with project billing to claim 300$. Next, go to [google cloud console](https://console.cloud.google.com/) and create new project with name such as ```JAIST-ChatBot```.

<p align="center"> 
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/gcloud_create_new_project.png" alt="drawing" style="width:80%;"/>
</p>

Then please activate two components that we will use in this project: ```Compute Engine``` and ```Kubernestes Engine```.

<p float="center">
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/gcloud_enable_compute_engine.png" width="400" />
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/gcloud_enable_k8s_engine.png" width="400" height="226" /> 
</p>

Next, you need to install ```gcloud CLI``` following this [guide](https://cloud.google.com/sdk/docs/install-sdk) and [```Helm```](https://helm.sh/docs/intro/install) locally.

You can install other tools if needed:
- [Docker](https://docs.docker.com/engine/install/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
## Usage
First go to your gcloud console in your project, please create new cluster in GKE with ```standard mode```. You can manage the settings of your cluster as name, zone, and number of nodes following these images:
<p align="center"> 
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/gcloud_cluster_basics.png" alt="drawing" style="width:80%;"/>
</p>
<p align="center"> 
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/gcloud_cluster_node.png" alt="drawing" style="width:80%;"/>
</p>

Then, connect to your cluster at the local terminal with command:
```
# You can replace cluster name, project name and zone following your settings.
gcloud container clusters get-credentials my-app --zone asia-southeast1-b --project jaist-chatbot
```

As my project use ``Nginx Ingress Controller`` to expose itself for outside connections, we need to install it in our cluster:
```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```
Since my app uses ```persistent volume (pv)```  for data storage, we have two ways to provide pv: ```manual provsision``` and ```dynamic provision```.

### Manual Provision
This requires you to create a ```persistent disk``` in ```compute engine``` by yourself. We will create a disk named ```mongo-disk``` with size ```10Gi``` at region ```asia-southeast1``` zone ```asia-southeast1-b```.
<p align="center"> 
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/gcloud_create_disk.png" alt="drawing" style="width:80%;"/>
</p>

Next, we use Helm to deploy our app:
```
# mychatbot is the released name of your app that you can change.
# app_chart_manually_provisioning is the helm chart folder.
helm install mychatbot app_chart_manually_provisioning/
```
If we successfully deploy our app, you could view the status of our ```persistent volume claim (pvc)``` which is bound to our pv named ```mongo-pv``` in Kubernetes Engine UI.
<p align="center"> 
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/gcloud_pvc_bound_pv.png" alt="drawing" style="width:80%;"/>
</p>

Please check file [pv.yaml](https://github.com/tdtu98/JAIST_chatbot_v3/blob/main/app_chart_manually_provisioning/templates/pv.yaml) and [mongo-pvc.yam](https://github.com/tdtu98/JAIST_chatbot_v3/blob/main/app_chart_manually_provisioning/templates/pvc.yaml) which contain the settings about our pv and pvc to understand deeper.

### Dynamic Provision
In case you do not want to do the hard work, we could let the GKE dynamically provision pv for us. In file [mongo-pvc.yaml](), you could see the differences compared to the previous one when we provide ```storageClassName``` which defines our storage class to handle provisioner, parameter and claimPolicy for our pv.

We use Helm to deploy our app again:
```
helm install mychatbot app_chart_dynamically_provisioning/
```
<p align="center"> 
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/gcloud_pvc_bound_pv_2.png" alt="drawing" style="width:80%;"/>
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/gcloud_new_disk.png" alt="drawing" style="width:80%;"/>
</p>

We could see our pvc is successfully bound to the new pv and a persistent disk is created in Compute Engine.
### IPs and Hosts Name Matching

At last, to access to our website, we need to match the IP of the ingress with our hosts name (please check [jaist-chatbot-ingress.yaml](https://github.com/tdtu98/JAIST_chatbot_v3/blob/main/app_chart_manually_provisioning/templates/jaist-chatbot-ingress.yaml)). We check the ingress ip with this command:
<p align="center"> 
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/ingress_ip.png" alt="drawing" style="width:80%;"/>
</p>

Then we bind the IP with hosts name in ```/etc/hosts``` file:
```
sudo nano /etc/hosts
```
<p align="center"> 
  <img src="https://github.com/tdtu98/JAIST_Chatbot_v3/blob/main/images/ip_binding.png" alt="drawing" style="width:80%;"/>
</p>

## ToDo
- Deploy app as statefulset
- Add Jenkins for CI/CD
