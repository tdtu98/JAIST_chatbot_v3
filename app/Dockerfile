FROM python:3.9
RUN pip install --upgrade pip

RUN mkdir /home/JAIST_chatbot
RUN mkdir -p /home/JAIST_chatbot/app

COPY app /home/JAIST_chatbot/app
COPY requirements.txt  /home/JAIST_chatbot

RUN pip install -r /home/JAIST_chatbot/requirements.txt

WORKDIR './home/JAIST_chatbot/app'
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "80"]