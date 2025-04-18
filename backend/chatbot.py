import google.generativeai as genai
import os
import re
from dotenv import load_dotenv

# Load biến môi trường từ file .env
load_dotenv()

# Lấy API key từ biến môi trường
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Kiểm tra xem API key có được cung cấp không
if not GOOGLE_API_KEY:
    raise ValueError("API key không được cung cấp. Vui lòng kiểm tra file .env")

class Chatbot:
    def __init__(self, model_name="gemini-1.5-pro"):
        """Khởi tạo chatbot với mô hình Gemini."""
        self.model_name = model_name
        self.model = None
        self.history = {}  # Sửa từ list thành dict để lưu trữ lịch sử theo ID
        self.system_instruction = "Bạn là trợ lý AI thông minh VYxAI, được tạo ra để hỗ trợ người dùng Việt Nam. Hãy trả lời ngắn gọn, hữu ích và thân thiện. Nếu được hỏi bằng tiếng Việt, hãy trả lời bằng tiếng Việt. Nếu được hỏi bằng tiếng Anh, hãy trả lời bằng tiếng Anh."
        self.load_model()
        
    def load_model(self):
        """Tải và cấu hình mô hình Gemini."""
        try:
            # Cấu hình API key
            genai.configure(api_key=GOOGLE_API_KEY)
            
            # Tạo mô hình với cấu hình thích hợp
            generation_config = {
                "temperature": 0.7,  # Độ sáng tạo, giá trị cao = sáng tạo hơn
                "top_p": 0.95,       # Xác suất tích lũy cho top-p sampling
                "top_k": 40,         # Số lượng tokens xem xét ở mỗi bước
                "max_output_tokens": 2048,  # Độ dài tối đa của đầu ra
            }
            
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
            
            # Tạo model và chat session
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
                safety_settings=safety_settings
            )
            
            print(f"Loaded model {self.model_name} successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise

    def clean_response(self, text):
        """Làm sạch phản hồi từ mô hình: loại bỏ ký tự đặc biệt không mong muốn."""
        # Loại bỏ khoảng trắng thừa
        text = re.sub(r'\s+', ' ', text).strip()
        # Đảm bảo câu có nghĩa
        if not text:
            text = "Xin lỗi, tôi không hiểu câu hỏi của bạn. Hãy thử lại nhé!"
        return text

    def get_response(self, user_message, conversation_id=None):
        """Tạo phản hồi cho tin nhắn của người dùng."""
        try:
            if not user_message.strip():
                return "Vui lòng nhập tin nhắn!"

            try:
                # Lấy lịch sử cuộc trò chuyện nếu có
                history = []
                if conversation_id and conversation_id in self.history:
                    history = self.history[conversation_id]
                
                # Tạo prompt với ngữ cảnh từ lịch sử
                prompt = f"{self.system_instruction}\n\n"
                
                # Thêm lịch sử cuộc trò chuyện vào prompt
                if history:
                    # Giới hạn số lần trò chuyện trước đó để tránh quá dài
                    max_prev_messages = 8  # 4 cặp user-assistant
                    prev_messages = history[-max_prev_messages:] if len(history) > max_prev_messages else history
                    
                    for msg in prev_messages:
                        if msg["role"] == "user":
                            prompt += f"Người dùng: {msg['content']}\n\n"
                        else:
                            prompt += f"Trợ lý: {msg['content']}\n\n"
                
                # Thêm tin nhắn hiện tại vào prompt
                prompt += f"Người dùng: {user_message}"
                
                # Gọi API để sinh nội dung
                response = self.model.generate_content(prompt)
                
                # Lấy nội dung phản hồi
                bot_reply = response.text
                bot_reply = self.clean_response(bot_reply)
            except Exception as e:
                print(f"Error during content generation: {str(e)}")
                # Thử lại một lần nữa với prompt đơn giản hơn
                try:
                    simple_prompt = f"Hãy trả lời câu hỏi sau đây: {user_message}"
                    response = self.model.generate_content(simple_prompt)
                    bot_reply = response.text
                    bot_reply = self.clean_response(bot_reply)
                except Exception as e2:
                    print(f"Second error during content generation: {str(e2)}")
                    return "Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại sau."
            
            # Lưu vào lịch sử nếu có conversation_id
            if conversation_id:
                if conversation_id not in self.history:
                    self.history[conversation_id] = []
                
                self.history[conversation_id].append({"role": "user", "content": user_message})
                self.history[conversation_id].append({"role": "assistant", "content": bot_reply})
                
                # Giới hạn kích thước lịch sử
                max_history_size = 20  # 10 cặp tin nhắn user-assistant
                if len(self.history[conversation_id]) > max_history_size:
                    self.history[conversation_id] = self.history[conversation_id][-max_history_size:]
            
            return bot_reply

        except Exception as e:
            print(f"Unexpected error: {e}")
            return "Tôi hiện không thể trả lời câu hỏi của bạn. Vui lòng thử lại với câu hỏi khác."
    
    def create_conversation(self):
        """Tạo một cuộc trò chuyện mới và trả về ID."""
        conversation_id = str(len(self.history) + 1)
        self.history[conversation_id] = []
        return conversation_id
    
    def clear_history(self, conversation_id=None):
        """Xóa lịch sử cuộc trò chuyện."""
        if conversation_id and conversation_id in self.history:
            self.history[conversation_id] = []
        elif conversation_id is None:
            self.history = {}
        return True

    # --- Bắt đầu mới --- #
    def set_context(self, context_type=None, custom_instruction=None):
        """
        Thiết lập ngữ cảnh mới cho chatbot bằng cách thay đổi system instruction.
        
        Tham số:
        ----------
        context_type : str, tùy chọn
            Loại ngữ cảnh có sẵn để chọn. Các tùy chọn:
            - 'default': Ngữ cảnh mặc định của trợ lý VYxAI
            - 'expert': Trở thành chuyên gia về một lĩnh vực cụ thể
            - 'creative': Tối ưu hóa cho nội dung sáng tạo và văn học
            - 'concise': Trả lời ngắn gọn, súc tích
            - 'technical': Tối ưu hóa cho giải thích kỹ thuật và code
            - 'educational': Tối ưu hóa cho việc dạy học và giải thích
            - 'conversational': Tối ưu hóa cho đối thoại thân thiện
            
        custom_instruction : str, tùy chọn
            Hướng dẫn tùy chỉnh cho chatbot. Nếu được cung cấp, sẽ ghi đè lên context_type.
            
        Trả về:
        ----------
        str
            Thông báo về việc thay đổi ngữ cảnh thành công và system instruction mới.
            
        Ví dụ:
        ----------
        # Sử dụng ngữ cảnh có sẵn
        chatbot.set_context(context_type='expert')
        
        # Sử dụng ngữ cảnh tùy chỉnh
        chatbot.set_context(custom_instruction="Bạn là chuyên gia về trí tuệ nhân tạo. 
                                             Hãy trả lời các câu hỏi một cách chuyên nghiệp 
                                             và đầy đủ thông tin.")
                                             
        # Quay về ngữ cảnh mặc định
        chatbot.set_context(context_type='default')
        """
        # Lưu instruction cũ để có thể quay lại nếu cần
        old_instruction = self.system_instruction
        
        # Xử lý custom instruction nếu được cung cấp
        if custom_instruction:
            self.system_instruction = custom_instruction
            return f"Đã thiết lập ngữ cảnh tùy chỉnh thành công.\nNgữ cảnh mới: {custom_instruction}"
        
        # Xử lý các loại ngữ cảnh có sẵn
        context_types = {
            'default': "Bạn là trợ lý AI thông minh VYxAI, được tạo ra để hỗ trợ người dùng Việt Nam. Hãy trả lời ngắn gọn, hữu ích và thân thiện. Nếu được hỏi bằng tiếng Việt, hãy trả lời bằng tiếng Việt. Nếu được hỏi bằng tiếng Anh, hãy trả lời bằng tiếng Anh.",
            
            'expert': "Bạn là chuyên gia hàng đầu trong lĩnh vực này. Hãy cung cấp câu trả lời chi tiết, đầy đủ và chính xác nhất có thể dựa trên kiến thức chuyên môn của bạn. Sử dụng thuật ngữ chuyên ngành khi phù hợp và đưa ra phân tích chuyên sâu.",
            
            'creative': "Bạn là một nhà văn sáng tạo và có tư duy nghệ thuật. Hãy trả lời bằng ngôn ngữ phong phú, sinh động và đầy cảm xúc. Sử dụng các phép so sánh, ẩn dụ và biện pháp tu từ để làm cho nội dung trở nên hấp dẫn và đáng nhớ.",
            
            'concise': "Bạn là trợ lý tập trung vào việc cung cấp thông tin ngắn gọn và súc tích. Hãy trả lời trực tiếp vào vấn đề chính, sử dụng càng ít từ càng tốt mà vẫn đảm bảo đầy đủ thông tin cần thiết. Tránh các chi tiết không cần thiết.",
            
            'technical': "Bạn là chuyên gia kỹ thuật với kiến thức sâu rộng về lập trình và công nghệ. Hãy cung cấp giải thích kỹ thuật chính xác, mã nguồn được định dạng tốt khi cần thiết, và hướng dẫn rõ ràng về cách thực hiện các nhiệm vụ kỹ thuật.",
            
            'educational': "Bạn là một giáo viên tài năng và kiên nhẫn. Hãy giải thích các khái niệm một cách rõ ràng, từng bước, sử dụng các ví dụ đơn giản để minh họa. Tập trung vào việc giúp người học hiểu sâu về chủ đề thay vì chỉ cung cấp câu trả lời.",
            
            'conversational': "Bạn là một người bạn thân thiện và gần gũi. Hãy trò chuyện một cách tự nhiên, thể hiện sự đồng cảm và hài hước khi phù hợp. Đặt câu hỏi để duy trì cuộc trò chuyện và thể hiện sự quan tâm đến người đối thoại."
        }
        
        # Nếu context_type không hợp lệ hoặc không được cung cấp, sử dụng mặc định
        if not context_type or context_type not in context_types:
            context_type = 'default'
            
        # Cập nhật system instruction
        self.system_instruction = context_types[context_type]
        
        return f"Đã thiết lập ngữ cảnh '{context_type}' thành công.\nNgữ cảnh mới: {self.system_instruction}"
    
    def get_available_contexts(self):
        """
        Trả về danh sách các ngữ cảnh có sẵn và mô tả của chúng.
        
        Trả về:
        ----------
        dict
            Dictionary chứa các loại ngữ cảnh và mô tả của chúng.
        """
        return {
            'default': "Trợ lý AI thông minh VYxAI mặc định",
            'expert': "Chuyên gia cung cấp thông tin chi tiết và chuyên sâu",
            'creative': "Nhà văn sáng tạo với ngôn ngữ phong phú và nghệ thuật",
            'concise': "Trợ lý cung cấp thông tin ngắn gọn và súc tích",
            'technical': "Chuyên gia kỹ thuật với kiến thức sâu về lập trình và công nghệ",
            'educational': "Giáo viên giải thích các khái niệm rõ ràng và dễ hiểu",
            'conversational': "Người bạn trò chuyện tự nhiên và thân thiện"
        }
        
    def create_custom_context(self, personality=None, expertise=None, response_style=None, extra_instructions=None):
        """
        Tạo ngữ cảnh tùy chỉnh dựa trên các tham số được cung cấp.
        
        Tham số:
        ----------
        personality : str, tùy chọn
            Tính cách của chatbot (ví dụ: thân thiện, hài hước, nghiêm túc)
            
        expertise : str, tùy chọn
            Lĩnh vực chuyên môn (ví dụ: lập trình, y học, văn học)
            
        response_style : str, tùy chọn
            Phong cách trả lời (ví dụ: ngắn gọn, chi tiết, học thuật)
            
        extra_instructions : str, tùy chọn
            Các hướng dẫn bổ sung cho chatbot
            
        Trả về:
        ----------
        str
            System instruction mới được tạo và thiết lập
            
        Ví dụ:
        ----------
        chatbot.create_custom_context(
            personality="vui vẻ và thân thiện",
            expertise="lập trình Python",
            response_style="chi tiết với ví dụ cụ thể",
            extra_instructions="luôn cung cấp mã nguồn khi cần thiết"
        )
        """
        # Xây dựng instruction mới
        new_instruction = "Bạn là trợ lý AI thông minh VYxAI."
        
        if personality:
            new_instruction += f" Tính cách của bạn là {personality}."
            
        if expertise:
            new_instruction += f" Bạn có chuyên môn sâu về {expertise}."
            
        if response_style:
            new_instruction += f" Hãy trả lời theo phong cách {response_style}."
        
        if extra_instructions:
            new_instruction += f" {extra_instructions}"
            
        # Thêm hướng dẫn mặc định về ngôn ngữ
        new_instruction += " Nếu được hỏi bằng tiếng Việt, hãy trả lời bằng tiếng Việt. Nếu được hỏi bằng tiếng Anh, hãy trả lời bằng tiếng Anh."
        
        # Cập nhật system instruction
        self.system_instruction = new_instruction
        
        return new_instruction
    # --- Kết thúc mới --- #

# Khởi tạo chatbot với mô hình Gemini 1.5 Pro
chatbot = Chatbot("gemini-1.5-pro")
