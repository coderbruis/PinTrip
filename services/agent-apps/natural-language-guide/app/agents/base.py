from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable


def build_text_chain(
    llm: BaseChatModel,
    system_prompt: str,
    human_prompt: str,
) -> Runnable:
    """Build a stateless prompt -> model -> text LangChain pipeline."""
    prompt = ChatPromptTemplate.from_messages(
        [("system", system_prompt), ("human", human_prompt)]
    )
    return prompt | llm | StrOutputParser()
