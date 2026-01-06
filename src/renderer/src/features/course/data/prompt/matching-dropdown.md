# Matching-Dropdown Quiz

## Mô tả

Quiz dạng ghép nối - chọn đáp án từ dropdown để ghép với câu hỏi tương ứng.

## Cấu trúc JSON

```json
{
  "id": "string (unique identifier)",
  "title": "string (tiêu đề quiz)",
  "type": "matching-dropdown",
  "subtype": "'single-answer' | 'multi-answer'",
  "instruction": "string (hướng dẫn - rich text format)",
  "quizNumber": "number (số thứ tự quiz)",
  "page": "number (optional - số trang tham chiếu)",
  "passage": "string (optional - đường dẫn file passage)",
  "audio": "string (optional - đường dẫn file audio)",
  "transcript": "string (optional - đường dẫn file transcript)",
  "options": ["string (danh sách các lựa chọn trong dropdown)"],
  "matchings": [
    {
      "id": "string (unique identifier)",
      "question": "string (nội dung câu hỏi cần ghép)",
      "answer": "string (đáp án đúng - khớp với 1 trong options)",
      "explain": "string (giải thích chi tiết)"
    }
  ]
}
```

## Subtype

- `single-answer`: Mỗi option chỉ được dùng 1 lần
- `multi-answer`: Một option có thể được dùng cho nhiều câu hỏi

## Example Quiz - Single Answer

```json
{
  "id": "quiz_04",
  "title": "IELTS Listening - Volunteer Work Areas",
  "type": "matching-dropdown",
  "subtype": "single-answer",
  "instruction": "<p>Choose </p><p style='bold'>FIVE </p><p>answers from the box.</p>",
  "quizNumber": 4,
  "page": 14,
  "audio": "./audio/listening_part2.mp3",
  "options": [
    "financial situation",
    "original, new ideas",
    "parenting skills",
    "an understanding of food and diet",
    "availability",
    "a good memory",
    "a good level of fitness"
  ],
  "matchings": [
    {
      "id": "matching_01",
      "question": "Fundraising",
      "answer": "original, new ideas",
      "explain": "<p>Diễn giả nói: \"Fundraising is an area where you'll be very welcome, especially if you have new ideas.\"</p>"
    },
    {
      "id": "matching_02",
      "question": "Litter collection",
      "answer": "a good level of fitness",
      "explain": "<p>Diễn giả nói: \"If you enjoy being outdoors and getting some exercise while you're doing something useful, you might prefer litter collection.\"</p>\n<p>Cụm \"getting exercise\" tương đương với \"good level of fitness\".</p>"
    },
    {
      "id": "matching_03",
      "question": "Playmates",
      "answer": "parenting skills",
      "explain": "<p>\"For this role, it's quite useful if you have experience with children.\" - tương đương với parenting skills.</p>"
    },
    {
      "id": "matching_04",
      "question": "Story club",
      "answer": "a good memory",
      "explain": "<p>\"We need people who won't mind switching from one story to another\" - ngụ ý cần nhớ nhiều câu chuyện.</p>"
    },
    {
      "id": "matching_05",
      "question": "First aid",
      "answer": "an understanding of food and diet",
      "explain": "<p>\"We do ask that you learn a little about the importance of a healthy diet.\"</p>"
    }
  ]
}
```

## Example Quiz - Multi Answer (Paragraph Matching)

```json
{
  "id": "quiz_05",
  "title": "IELTS Reading - Paragraph Matching",
  "type": "matching-dropdown",
  "subtype": "multi-answer",
  "instruction": "<p>Which paragraph contains the following information?</p><p>Write the correct letter, A–G.</p>",
  "quizNumber": 5,
  "page": 24,
  "passage": "./passage/reading_passage1.json",
  "options": ["A", "B", "C", "D", "E", "F", "G"],
  "matchings": [
    {
      "id": "matching_14",
      "question": "bad outcomes for a forest when people focus only on its financial reward",
      "answer": "B",
      "explain": "<p>Paragraph B discusses negative consequences when forests are valued only for profit.</p>"
    },
    {
      "id": "matching_15",
      "question": "reference to the aspects of any tree that contribute to its worth",
      "answer": "A",
      "explain": "<p>Paragraph A mentions various factors that determine a tree's value.</p>"
    }
  ]
}
```

## Lưu ý khi tạo Quiz

1. Options phải bao gồm tất cả các đáp án có thể chọn
2. Answer phải khớp chính xác với 1 trong các options
3. Với `single-answer`, số matchings thường ít hơn hoặc bằng số options
4. Với `multi-answer`, nhiều matchings có thể có cùng answer
