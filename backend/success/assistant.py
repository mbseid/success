from langchain_openai.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from .models import AssistantAnswer

llm = ChatOpenAI(model_name="gpt-4o")
copy_editor_llm = ChatOpenAI(model_name="gpt-4o")

def predict(system, request):
    messages = [SystemMessage(content=system), HumanMessage(content=request)]
    response = llm.predict_messages(messages)
    answer = AssistantAnswer(
        system=system,
        request=request,
        response=response.content
    )
    answer.save()
    return answer

def copy_edit(text):
    system_message = """You are a professional copy editor at Spotify. Your job is to improve text according to Spotify's culture and values while making it:

1. Clear and concise
2. Fun and engaging
3. Written at a college reading level
4. Free of emojis
5. Free of em-dashes (—)

Spotify's core values emphasize:
- Innovation and creativity
- Collaboration and teamwork
- Passion for music and audio
- User-centric thinking
- Authenticity and being genuine
- Agility and speed

Please edit the following text to match these criteria while preserving the original meaning and intent. Return only the edited text without any explanation or commentary."""

    messages = [SystemMessage(content=system_message), HumanMessage(content=text)]
    response = copy_editor_llm.predict_messages(messages)
    
    return response.content