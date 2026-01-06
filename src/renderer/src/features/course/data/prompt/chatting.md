# Chatting Quiz

## Mô tả

Quiz dạng hội thoại - người dùng hoàn thành cuộc trò chuyện với bot.

## Cấu trúc JSON

```json
{
  "id": "string (unique identifier)",
  "title": "string (tiêu đề quiz)",
  "type": "chatting",
  "instruction": "string (optional - hướng dẫn)",
  "quizNumber": "number (số thứ tự quiz)",
  "chats": [
    {
      "id": "string (unique identifier)",
      "role": "'bot' | 'user'",
      "content": "string (nội dung tin nhắn)"
    }
  ]
}
```

## Quy tắc

- `role: 'bot'`: Tin nhắn từ AI/hệ thống
- `role: 'user'`: Tin nhắn mẫu của người dùng (để học hỏi)
- Cuộc trò chuyện nên xen kẽ giữa bot và user
- Có thể dùng để luyện giao tiếp theo tình huống

## Example Quiz - At a Restaurant

```json
{
  "id": "quiz_chat_01",
  "title": "Conversation Practice - At a Restaurant",
  "type": "chatting",
  "instruction": "<p>Practice a conversation at a restaurant. Read the dialogue and practice speaking both roles.</p>",
  "quizNumber": 1,
  "chats": [
    {
      "id": "chat_01",
      "role": "bot",
      "content": "Good evening! Welcome to The Golden Spoon. Do you have a reservation?"
    },
    {
      "id": "chat_02",
      "role": "user",
      "content": "Yes, I booked a table for two under the name Johnson."
    },
    {
      "id": "chat_03",
      "role": "bot",
      "content": "Ah yes, Mr. Johnson. Right this way please. Here's your table by the window."
    },
    {
      "id": "chat_04",
      "role": "user",
      "content": "Thank you. Could we see the menu, please?"
    },
    {
      "id": "chat_05",
      "role": "bot",
      "content": "Of course! Here you go. Our special today is grilled salmon with seasonal vegetables. Can I get you something to drink while you decide?"
    },
    {
      "id": "chat_06",
      "role": "user",
      "content": "I'll have a glass of white wine, and water for the table, please."
    },
    {
      "id": "chat_07",
      "role": "bot",
      "content": "Excellent choice. I'll be right back with your drinks. Take your time with the menu."
    }
  ]
}
```

## Example Quiz - Job Interview

```json
{
  "id": "quiz_chat_02",
  "title": "Conversation Practice - Job Interview",
  "type": "chatting",
  "instruction": "<p>Practice a job interview conversation. This is for a software developer position.</p>",
  "quizNumber": 2,
  "chats": [
    {
      "id": "chat_01",
      "role": "bot",
      "content": "Good morning! Thank you for coming in today. Please, have a seat. How are you doing?"
    },
    {
      "id": "chat_02",
      "role": "user",
      "content": "Good morning! I'm doing great, thank you. I'm excited to be here and learn more about this opportunity."
    },
    {
      "id": "chat_03",
      "role": "bot",
      "content": "That's great to hear. So, can you tell me a little about yourself and why you're interested in this position?"
    },
    {
      "id": "chat_04",
      "role": "user",
      "content": "Of course. I'm a software developer with five years of experience in web development. I specialize in React and Node.js. I'm interested in this position because your company is known for innovative products, and I'd love to contribute to that mission."
    },
    {
      "id": "chat_05",
      "role": "bot",
      "content": "Impressive! Could you describe a challenging project you've worked on and how you handled it?"
    },
    {
      "id": "chat_06",
      "role": "user",
      "content": "Certainly. At my previous company, I led the development of a real-time dashboard that handled over 1 million data points. The challenge was optimizing performance while maintaining accuracy. I implemented data caching and used WebSocket for live updates, which reduced load time by 60%."
    },
    {
      "id": "chat_07",
      "role": "bot",
      "content": "That's very impressive. Do you have any questions for us about the role or the company?"
    },
    {
      "id": "chat_08",
      "role": "user",
      "content": "Yes, I'd like to know more about the team structure and what a typical day looks like for someone in this position."
    }
  ]
}
```

## Example Quiz - Doctor Visit

```json
{
  "id": "quiz_chat_03",
  "title": "Conversation Practice - At the Doctor",
  "type": "chatting",
  "instruction": "<p>Practice a conversation at a doctor's office.</p>",
  "quizNumber": 3,
  "chats": [
    {
      "id": "chat_01",
      "role": "bot",
      "content": "Hello, I'm Dr. Smith. What brings you in today?"
    },
    {
      "id": "chat_02",
      "role": "user",
      "content": "Hi, Doctor. I've been having a persistent headache for the past three days, and I also feel quite tired."
    },
    {
      "id": "chat_03",
      "role": "bot",
      "content": "I see. On a scale of 1 to 10, how would you rate the pain? And where exactly do you feel the headache?"
    },
    {
      "id": "chat_04",
      "role": "user",
      "content": "I'd say it's about a 6. The pain is mostly in my forehead and behind my eyes."
    },
    {
      "id": "chat_05",
      "role": "bot",
      "content": "Have you been taking any medication? And have you noticed anything that makes it worse, like bright lights or loud noises?"
    },
    {
      "id": "chat_06",
      "role": "user",
      "content": "I've been taking paracetamol, but it only helps temporarily. Yes, bright lights definitely make it worse."
    }
  ]
}
```

## Lưu ý khi tạo Quiz

1. Xen kẽ giữa bot và user một cách tự nhiên
2. Content nên phù hợp với tình huống thực tế
3. Sử dụng ngôn ngữ phù hợp với ngữ cảnh (formal/informal)
4. Mỗi cuộc trò chuyện nên có chủ đề và mục tiêu rõ ràng
5. Có thể thêm instruction để giải thích ngữ cảnh
