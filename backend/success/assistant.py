from langchain_openai.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from langchain.callbacks.base import BaseCallbackHandler
from .models import AssistantConversation, AssistantMessage
import json
import time

llm = ChatOpenAI(model_name="gpt-4o")
streaming_llm = ChatOpenAI(model_name="gpt-4o", streaming=True)
copy_editor_llm = ChatOpenAI(model_name="gpt-4o")

class MessageStreamingCallback(BaseCallbackHandler):
    """Custom callback to capture streaming tokens and update the database"""
    
    def __init__(self, message_id):
        self.message_id = message_id
        self.content = ""
        
    def on_llm_new_token(self, token: str, **kwargs) -> None:
        """Called when a new token is received"""
        self.content += token
        # Update the message in the database with partial content
        try:
            message = AssistantMessage.objects.get(id=self.message_id)
            message.content = self.content
            message.save(update_fields=['content'])
            
            # Publish to GraphQL subscription
            self._publish_update(message)
        except AssistantMessage.DoesNotExist:
            pass
    
    def _publish_update(self, message):
        """Publish message update to GraphQL subscription"""
        try:
            # Import here to avoid circular imports
            from .schema import message_updates
            import asyncio
            
            message_id_str = str(self.message_id)
            if message_id_str in message_updates:
                # Put the updated message in the queue
                try:
                    queue = message_updates[message_id_str]
                    # Use put_nowait since we're in a sync context
                    queue.put_nowait(message)
                except asyncio.QueueFull:
                    # Queue is full, skip this update
                    pass
        except Exception as e:
            # Don't let subscription errors break the streaming
            print(f"Error publishing message update: {e}")

def start_conversation(system, request):
    """
    Start a new conversation with initial system message and user request
    """
    # Create the conversation
    conversation = AssistantConversation(
        system_message=system,
        description=''
    )
    conversation.save()
    
    # Create user message
    user_message = AssistantMessage(
        conversation=conversation,
        role='user',
        content=request
    )
    user_message.save()
    
    # Generate AI response
    messages = [SystemMessage(content=system), HumanMessage(content=request)]
    response = llm.predict_messages(messages)
    
    # Create assistant message
    assistant_message = AssistantMessage(
        conversation=conversation,
        role='assistant',
        content=response.content
    )
    assistant_message.save()
    
    return conversation

def send_message(conversation, request):
    """
    Send a new message in an existing conversation
    """
    # Build conversation history for context
    messages = []
    if conversation.system_message:
        messages.append(SystemMessage(content=conversation.system_message))
    
    # Add all previous messages
    for msg in conversation.messages:
        if msg.role == 'user':
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))
    
    # Add the new user message
    user_message = AssistantMessage(
        conversation=conversation,
        role='user',
        content=request
    )
    user_message.save()
    messages.append(HumanMessage(content=request))
    
    # Generate AI response
    response = llm.predict_messages(messages)
    
    # Create assistant message
    assistant_message = AssistantMessage(
        conversation=conversation,
        role='assistant',
        content=response.content
    )
    assistant_message.save()
    
    return assistant_message

def send_message_streaming(conversation, request):
    """
    Send a new message with streaming response
    """
    # Build conversation history for context
    messages = []
    if conversation.system_message:
        messages.append(SystemMessage(content=conversation.system_message))
    
    # Add all previous messages
    for msg in conversation.messages:
        if msg.role == 'user':
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))
    
    # Add the new user message
    user_message = AssistantMessage(
        conversation=conversation,
        role='user',
        content=request
    )
    user_message.save()
    messages.append(HumanMessage(content=request))
    
    # Create empty assistant message that will be updated during streaming
    assistant_message = AssistantMessage(
        conversation=conversation,
        role='assistant',
        content=""  # Start empty, will be updated during streaming
    )
    assistant_message.save()
    
    # Create streaming callback
    streaming_callback = MessageStreamingCallback(assistant_message.id)
    
    # Generate AI response with streaming
    response = streaming_llm.predict_messages(
        messages, 
        callbacks=[streaming_callback]
    )
    
    # Final update to ensure we have the complete response
    assistant_message.content = response.content
    assistant_message.save()
    
    return assistant_message


def copy_edit(text, editor_type="spotify"):
    if editor_type == "simple":
        system_message = """You are a professional copy editor. Your job is to improve text for:

1. Grammar and spelling accuracy
2. Clarity and readability
3. Proper sentence structure
4. Consistent tone

Please edit the following text to correct any errors and improve clarity while preserving the original meaning and style. Return only the edited text without any explanation or commentary."""
    else:  # default to spotify
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