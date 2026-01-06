# Speaking Quiz

## Mô tả

Quiz luyện nói - theo format IELTS Speaking với 3 phần (Part 1, 2, 3).

## Cấu trúc JSON

```json
{
  "id": "string (unique identifier)",
  "title": "string (tiêu đề quiz)",
  "type": "speaking",
  "instruction": "string (optional - hướng dẫn)",
  "quizNumber": "number (số thứ tự quiz)",
  "questions": [
    {
      "id": "string (unique identifier)",
      "question": "string (câu hỏi - dùng cho Part 1 và Part 2)",
      "example": "string (optional - đáp án mẫu)",
      "topic": "string (optional - dùng cho Part 3 để nhóm câu hỏi)",
      "exampleQuestion": ["string[] (optional - danh sách câu hỏi trong Part 3)"]
    }
  ]
}
```

## Speaking Parts

- **Part 1**: Câu hỏi đơn về bản thân, gia đình, công việc, sở thích
- **Part 2**: Long turn - nói về 1 chủ đề trong 1-2 phút
- **Part 3**: Thảo luận sâu về các chủ đề liên quan

## Example Quiz - Part 1

```json
{
  "id": "quiz_speaking_01",
  "title": "IELTS Speaking Part 1 - Hometown",
  "type": "speaking",
  "instruction": "<p>Answer the following questions about your hometown.</p>",
  "quizNumber": 1,
  "questions": [
    {
      "id": "question_01",
      "question": "Where are you from?",
      "example": "I'm from Hanoi, which is the capital city of Vietnam. It's located in the northern part of the country and has a rich history spanning over a thousand years."
    },
    {
      "id": "question_02",
      "question": "What do you like most about your hometown?",
      "example": "What I appreciate most about my hometown is the perfect blend of ancient traditions and modern development. I particularly enjoy the Old Quarter with its narrow streets and traditional architecture."
    },
    {
      "id": "question_03",
      "question": "Has your hometown changed much in recent years?",
      "example": "Absolutely, my hometown has undergone significant changes. There's been extensive urban development with new shopping malls, metro lines, and high-rise buildings. While some of these changes have improved infrastructure, I sometimes miss the quieter atmosphere of the past."
    }
  ]
}
```

## Example Quiz - Part 2

```json
{
  "id": "quiz_speaking_02",
  "title": "IELTS Speaking Part 2 - A Book",
  "type": "speaking",
  "instruction": "<p>Describe a book that you have read recently.</p><p>You should say:</p><p>- what kind of book it is</p><p>- what it is about</p><p>- what you learned from it</p><p>and explain why you would recommend this book to others.</p>",
  "quizNumber": 2,
  "questions": [
    {
      "id": "question_01",
      "question": "Describe a book that you have read recently.",
      "example": "I'd like to talk about 'Atomic Habits' by James Clear, which I finished reading last month. It's a self-help book that focuses on how tiny changes in our daily habits can lead to remarkable results over time.\n\nThe book is divided into several sections, each explaining a fundamental law of behavior change. What struck me most was the concept of 'habit stacking' - linking a new habit to an existing one.\n\nFrom this book, I learned that success isn't about making huge changes, but about improving just 1% each day. This compound effect can transform your life over months and years.\n\nI would highly recommend this book because it's practical and applicable to everyone. Whether you want to exercise more, read more, or break bad habits, the strategies in this book are incredibly useful."
    }
  ]
}
```

## Example Quiz - Part 3

```json
{
  "id": "quiz_speaking_03",
  "title": "IELTS Speaking Part 3 - Reading Habits",
  "type": "speaking",
  "instruction": "<p>Let's discuss some questions related to reading.</p>",
  "quizNumber": 3,
  "questions": [
    {
      "id": "question_01",
      "topic": "Reading in Society",
      "exampleQuestion": [
        "Do people read more or less than they used to?",
        "Why do you think some people prefer e-books to printed books?",
        "How important is it for children to develop reading habits?"
      ],
      "example": "I think reading patterns have definitely shifted. While people might read fewer traditional books, they're actually consuming more written content than ever through social media, news apps, and online articles. However, the depth of reading has arguably decreased as people tend to skim rather than read thoroughly."
    },
    {
      "id": "question_02",
      "topic": "Future of Reading",
      "exampleQuestion": [
        "How might technology change the way we read in the future?",
        "Will libraries still be important in the future?"
      ],
      "example": "Technology is likely to make reading more interactive and immersive. We might see augmented reality features in books or AI-powered personalized content. As for libraries, I believe they'll evolve into community learning centers rather than disappear entirely."
    }
  ]
}
```

## Lưu ý khi tạo Quiz

1. Part 1: 3-4 câu hỏi đơn giản, đáp án mẫu 2-3 câu
2. Part 2: 1 câu hỏi dạng cue card, đáp án mẫu dài 1-2 phút
3. Part 3: Nhóm theo topic, mỗi topic có 2-3 câu hỏi liên quan
4. Example nên sử dụng ngôn ngữ tự nhiên, có cấu trúc rõ ràng
