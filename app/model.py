import os
import glob

from operator import itemgetter

from langchain.document_loaders import PyPDFLoader
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import  PromptTemplate
from langchain.memory import ConversationBufferWindowMemory
from langchain.chat_models import ChatOpenAI
from langchain_core.runnables import RunnablePassthrough, RunnableParallel, RunnableLambda, RunnableBranch
from langchain_core.output_parsers import StrOutputParser
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from langchain_community.llms import Ollama

from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
user = os.getenv('MONGO_INITDB_ROOT_USERNAME')
password = os.getenv('MONGO_INITDB_ROOT_PASSWORD')

def load_data(data_path):
        docs = []
        for i in glob.glob(data_path):
            print(i)
            loader = PyPDFLoader(i)
            docs.extend(loader.load())
        return docs

# check https://stackoverflow.com/questions/77925185/valueerror-expected-embeddingfunction-call-to-have-the-following-signature
class CustomOpenAIEmbeddings(OpenAIEmbeddings):

    def __init__(self, openai_api_key, *args, **kwargs):
        super().__init__(openai_api_key=openai_api_key, *args, **kwargs)
        
    def _embed_documents(self, texts):
        return super().embed_documents(texts)  # <--- use OpenAIEmbedding's embedding function

    def __call__(self, input):
        return self._embed_documents(input)

class Chatbot():

    def __init__(self, username : str, connection_string : str):
        data_path = "./data/"
        db_path = "./vectordb/"

        # embedding
        embedding = CustomOpenAIEmbeddings(os.environ["OPENAI_API_KEY"])

        if len(os.listdir(db_path)) == 0:
            docs = load_data(data_path + "*")

            # text splitter
            text_splitter = RecursiveCharacterTextSplitter(["\n", "\n\n"], keep_separator = False)
            documents = text_splitter.split_documents(docs)

            db = Chroma().from_documents(collection_name = "JAIST",
                                        persist_directory = db_path,
                                        documents = documents,
                                        embedding = embedding)
        else:
            db = Chroma(persist_directory=db_path, embedding_function=embedding, collection_name = "JAIST")
        
            
        # retriever
        retriever = db.as_retriever(search_kwargs={"k":4}, search_type = "mmr")

        # chat model
        llm = ChatOpenAI(model_name = "gpt-3.5-turbo", temperature = 0, streaming = True, model_kwargs={"seed": 42})

        # we create a sub-chain that aims to rewrite a new question from input question and chat history
        # For example, if in history we mention about reporting missuse of funding in JAIST
        # and the next question is "what about I am outside of JAIST?", the model should know we want
        # to report missuse of fund in case we are outside of JAIST.

        sub_template = """
        Given a chat history and the latest user question \
        which might reference context in the chat history, formulate a standalone question \
        which can be understood without the chat history. Do NOT answer the question, \
        just reformulate it if needed and otherwise return it as is.
        -----------------------
        History: {chat_history}
        =======================
        Human: {question}
        Chatbot:
        """
        sub_chat_prompt = PromptTemplate.from_template(template = sub_template)

        # using mongodb to store chat histories
        self.chat_history = MongoDBChatMessageHistory(
            session_id= username,
            connection_string= connection_string,
            database_name="db",
            collection_name="chat_histories",
        )
        self.memory = ConversationBufferWindowMemory(
            chat_memory = self.chat_history,
            memory_key="chat_history",
            input_key = "question",
            return_messages=True,
            k = 5
        )
        runnable_memory = RunnableLambda(self.memory.load_memory_variables) | itemgetter("chat_history")
        sub_chain = ( RunnableParallel(
            chat_history = runnable_memory,
            question = RunnablePassthrough()
            )
            | RunnableBranch(
            ( 
            lambda x: not x.get("chat_history", False),
            # If no chat history, then we just pass input to retriever
            lambda x: x["question"]
            ),
            sub_chat_prompt | llm.with_config(tags =  ["sub_chain"]) | StrOutputParser(),
            )  
        )

        # Our main chain that answers question based on information from retrieved documents (context)
        # chat history and rewrited question.

        template = """
        You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. 
        If you don't know the answer, just say that you don't know. Use minimum sentences and keep the answer concise.
        -----------------------
        Context: {context}
        -----------------------
        History: {chat_history}
        =======================
        Human: {question}
        Chatbot:
        """

        prompt = PromptTemplate.from_template(template= template)

        self.chain = (
            sub_chain |
            RunnableParallel(
            question = RunnablePassthrough(),
            context = retriever,
            chat_history =  runnable_memory,
            )
            | prompt
            | llm.with_config(tags =  ["main_chain"])
            | StrOutputParser()
        )
