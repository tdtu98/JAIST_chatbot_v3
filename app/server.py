import os
import asyncio
import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from model import Chatbot
from dotenv import load_dotenv, find_dotenv
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel

load_dotenv(find_dotenv())


user = os.getenv('MONGO_INITDB_ROOT_USERNAME')
password = os.getenv('MONGO_INITDB_ROOT_PASSWORD')

# in case of using locally, we use this connection_string:
# connection_string = f'mongodb://{user}:{password}@localhost:27017'

# in case of using docker images, we use this connection_string:
# connection_string = f'mongodb://{user}:{password}@mongo:27017'

# in case of using minikube, we use this connection_string:
connection_string = os.getenv("ME_CONFIG_MONGODB_URL")

client = AsyncIOMotorClient(connection_string)
db = client.db


app = FastAPI()
app.mount('/static', StaticFiles(directory='static', html=True), name='static')


origins = [
 "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
async def get_my_app():
    with open("page.html", "r", encoding= 'utf-8') as file:
        page = file.read()
    response = HTMLResponse(content=page, status_code=200)
    response.headers['Content-Type'] = "text/html"
    return response

class QuestionQuery(BaseModel):
    question : str
    username: str

async def generate_response(question: str):
    # We used the new method of langchain chain with is astream_events to return each chunk as soon as it is generated.
    chunks = []
    async for event in chatbot.chain.astream_events(question, version = "v1", include_tags = ["main_chain"]):
        kind = event["event"]
        if kind == "on_chat_model_stream":
            content = event["data"]["chunk"].content
            if content:
                chunks.append(content)
                yield content
    chatbot.memory.chat_memory.add_user_message(question)
    chatbot.memory.chat_memory.add_ai_message("".join(chunks))

@app.post("/question/")
async def get_response(input: QuestionQuery):
    # Fastapi helps streaming with StreamingResponse.
    return StreamingResponse(generate_response(input.question), media_type="text/event-stream")


class UserInfor(BaseModel):
    username: str
    password: str

@app.post("/login/")
async def get_user(infor: UserInfor):
    try:
        user_infor = await db.user.find_one({"username": infor.username, "password": infor.password})
        print("user_infor", user_infor)
    except:
        return {"message":"error"}
    if user_infor is None:
        return {"message":"error"}
    else:
        global chatbot 
        chatbot = Chatbot(infor.username, connection_string)
        return {"message":"success"}
    
@app.post("/signup/")
async def get_user(infor: UserInfor):
    try:
        user_infor = await db.user.find_one({"username": infor.username})
    except:
        return {"message":"error"}
    if user_infor is None:
        db.user.insert_one({"username": infor.username, "password": infor.password})
        global chatbot 
        chatbot = Chatbot(infor.username, connection_string)
        return {"message":"success"}
    else:
        return {"message":"error"}

# if __name__ == "__main__":
#     uvicorn.run("server:app", host="0.0.0.0", port=80, reload = True)