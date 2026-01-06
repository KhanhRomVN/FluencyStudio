# Multiple-Choice Quiz

## Mô tả

Quiz dạng trắc nghiệm chọn đáp án. Có thể chọn 1 hoặc nhiều đáp án đúng.

## Cấu trúc JSON

```json
{
  "id": "string (unique identifier)",
  "title": "string (tiêu đề quiz)",
  "type": "multiple-choice",
  "instruction": "string (hướng dẫn - rich text format)",
  "quizNumber": "number (số thứ tự quiz)",
  "page": "number (optional - số trang tham chiếu)",
  "audio": "string (optional - đường dẫn file audio)",
  "transcript": "string (optional - đường dẫn file transcript)",
  "passage": "string (optional - đường dẫn file passage)",
  "questions": [
    {
      "id": "string (unique identifier cho câu hỏi)",
      "question": "string (nội dung câu hỏi)",
      "options": ["string (lựa chọn 1)", "string (lựa chọn 2)", "..."],
      "answer": "string (đáp án đúng - giá trị của option)",
      "answers": ["string", "string"] "(optional - dùng khi có nhiều đáp án đúng)",
      "explain": "string (giải thích chi tiết - rich text format)"
    }
  ]
}
```

## Quy tắc

- `options`: Mảng các string chứa nội dung lựa chọn (không cần key A, B, C)
- `answer`: Dùng cho câu hỏi chọn 1 đáp án, giá trị phải khớp với 1 trong các options
- `answers`: Dùng cho câu hỏi chọn nhiều đáp án (VD: "Choose TWO letters")

## Example Quiz - Single Answer

```json
{
  "id": "quiz_02",
  "title": "IELTS Listening - Volunteer Organization",
  "type": "multiple-choice",
  "instruction": "<p>Choose the correct answer.</p>",
  "quizNumber": 2,
  "page": 13,
  "audio": "./audio/listening_part2.mp3",
  "transcript": "./audio/listening_part2_transcript.json",
  "questions": [
    {
      "id": "question_01",
      "question": "Why does the speaker apologise about the seats?",
      "options": [
        "They are too small.",
        "There are not enough of them.",
        "Some of them are very close together."
      ],
      "answer": "Some of them are very close together.",
      "explain": "<p>Diễn giả nói: \"We have brought in extra seats so that no one has to stand, but it does mean that the people at the back of the room may be a bit squashed.\"</p>\n<p>Từ khóa \"squashed\" có nghĩa là bị ép chặt, tương đương với \"very close together\".</p>"
    },
    {
      "id": "question_02",
      "question": "What does the speaker say about training?",
      "options": ["It is continuous.", "It is conducted by a manager.", "It takes place online."],
      "answer": "It is continuous.",
      "explain": "<p>Diễn giả nói: \"Training doesn't end when you start working for us. It takes place before, during and after periods of work.\"</p>"
    }
  ]
}
```

## Example Quiz - Multiple Answers

```json
{
  "id": "quiz_03",
  "title": "IELTS Listening - Choose TWO",
  "type": "multiple-choice",
  "instruction": "<p>Choose </p><p style='bold'>TWO </p><p>letters.</p>",
  "quizNumber": 3,
  "page": 16,
  "audio": "./audio/listening_part3.mp3",
  "questions": [
    {
      "id": "question_01",
      "question": "Which TWO issues does the speaker ask the audience to consider?",
      "options": [
        "their financial situation",
        "their level of commitment",
        "their work experience",
        "their ambition",
        "their availability"
      ],
      "answers": ["their level of commitment", "their availability"],
      "explain": "<p>Diễn giả đề cập hai vấn đề cần cân nhắc:</p>\n<p>1. \"What we value is dedication\" - tương ứng với commitment</p>\n<p>2. \"It is critical that you have enough hours\" - tương ứng với availability</p>"
    }
  ]
}
```

## Lưu ý khi tạo Quiz

1. Options là mảng các string, không cần key A, B, C
2. Answer/Answers phải khớp chính xác với giá trị trong options
3. Explain nên phân tích cả đáp án đúng và sai
4. Với câu chọn nhiều đáp án, dùng trường `answers` thay vì `answer`
