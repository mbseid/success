from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

llm = ChatOpenAI(model_name="gpt-3.5-turbo")

def predict(prompt, query):
    messages = [SystemMessage(content=prompt.system_message), HumanMessage(content=query)]
    response = llm.predict_messages(messages)
    return response.content