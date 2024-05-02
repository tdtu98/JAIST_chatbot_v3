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

Next, you need to install ```gcloud CLI``` following this [guide](https://cloud.google.com/sdk/docs/install) and [```Helm```](https://helm.sh/docs/intro/install) locally.
## Usage


## ToDo
