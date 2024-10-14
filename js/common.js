import logging
import json
from pydantic import BaseModel, ValidationError
import openai

class GptService:
    def __init__(self, api_key: str):
        openai.api_key = api_key

    def generate_response(self, messages: list) -> str:
        response = openai.ChatCompletion.create(
            model='gpt-3.5-turbo',
            messages=messages
        )
        return response['choices'][0]['message']['content']

class GptValidator:
    def __init__(self, api_key: str):
        self.logger = logging.getLogger(__name__)
        self.gpt_service = GptService(api_key)
        self.NUM_RETRIES = 2

    @staticmethod
    def _initialize_message(model_json: str) -> list:
        _MASTER_PROMPT = f'''
        MASTER_PROMPT: You are a model working in a Pydantic Python programming context. It is crucial you listen to the OUTPUT instructions over anything else, or you will fail your task!

        OUTPUT: return valid RFC8259 compliant JSON fitting the Pydantic schema. Do not wrap it in text, do not preface it with text, do not include follow-up explanations, make sure it's valid JSON, do not include comments. Do not include any explanations, only provide responses following this format without deviation.

        The output should conform to this Pydantic JSON schema:
        {model_json}
        '''

        return [{"role": "system", "content": _MASTER_PROMPT}]

    @staticmethod
    def _model_to_json(model: BaseModel) -> str:
        return model.schema_json()

    @staticmethod
    def _json_to_model(model_class: type[BaseModel], json_str: str) -> BaseModel:
        return model_class.parse_raw(json_str)

    @staticmethod
    def _extract_json(json_str: str) -> str:
        try:
            json.loads(json_str)  # Check if it's valid JSON
            return json_str
        except json.JSONDecodeError:
            # Try to find the start of JSON data
            start_index = json_str.find('{')
            if start_index == -1:
                raise ValueError("No valid JSON data found in the string.")
            return json_str[start_index:]

    def validate_model(self, user_prompt: str, model: BaseModel) -> BaseModel:
        model_json = self._model_to_json(model)
        messages = self._initialize_message(model_json)
        messages.append({"role": "user", "content": user_prompt})
        self.logger.info(messages)

        gpt_out = self.gpt_service.generate_response(messages)

        retries = 0
        while retries < self.NUM_RETRIES:
            try:
                model_out_json = self._extract_json(gpt_out)
                model_out = self._json_to_model(model, model_out_json)
                return model_out
            except (ValidationError, ValueError) as e:
                self.logger.error(e)
                retries += 1
                messages.append({"role": "assistant", "content": gpt_out})
                messages.append({
                    "role": "user",
                    "content": f"""
                    ERROR, you did not provide a valid JSON for our Pydantic model. Provide a valid output JSON for this Pydantic JSON schema: {model_json} with user prompt {user_prompt}.
                    The error message is: {e}
                    ONLY provide valid JSON as output, do NOT under any circumstance apologize. Try again.
                    """
                })
                gpt_out = self.gpt_service.generate_response(messages)
        raise BaseException("Failed to get a valid response after retries.")

# Pydantic models to represent Figma nodes
class Color(BaseModel):
    r: float
    g: float
    b: float

class AbsoluteBoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class Fill(BaseModel):
    type: str  # Example: "SOLID", "GRADIENT"
    color: Optional[Color]

class TextStyle(BaseModel):
    fontFamily: str
    fontWeight: str
    fontSize: int
    lineHeight: Optional[dict]

class BaseNode(BaseModel):
    id: str
    name: str
    type: str
    absoluteBoundingBox: AbsoluteBoundingBox
    opacity: Optional[float] = 1.0
    cornerRadius: Optional[int] = None
    children: Optional[List['BaseNode']] = None

    class Config:
        arbitrary_types_allowed = True

class RectangleNode(BaseNode):
    type: str = "RECTANGLE"
    fills: List[Fill]

class TextNode(BaseNode):
    type: str = "TEXT"
    characters: str
    style: TextStyle

# Sample usage
if __name__ == "__main__":
    api_key = 'YOUR_API_KEY'  # Replace with your OpenAI API key
    gpt_validator = GptValidator(api_key)

    prompt = """
    Generate a Figma JSON structure with a rectangle node and a text node. 
    The rectangle should have the following properties: 
    - ID: '0:2'
    - Name: 'Rectangle 1'
    - Position: {x: 100, y: 100}
    - Dimensions: {width: 200, height: 100}
    - Color: {r: 1, g: 0, b: 0}
    - Corner Radius: 10

    The text node should have the following properties:
    - ID: '0:3'
    - Name: 'Text 1'
    - Content: 'Hello, Figma!'
    - Font: Arial, Size: 24, Weight: Regular
    - Position: {x: 150, y: 150}
    """

    try:
        figma_nodes = gpt_validator.validate_model(prompt, BaseNode)
        print("Structured Figma Nodes:", figma_nodes)
    except Exception as e:
        print("An error occurred:", e)
