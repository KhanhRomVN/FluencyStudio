# Gap-Fill Quiz

## Mô tả

Quiz dạng điền từ vào chỗ trống. Người dùng đọc/nghe nội dung và điền các từ còn thiếu.

## Cấu trúc JSON

```json
{
  "id": "string (unique identifier)",
  "title": "string (tiêu đề quiz)",
  "type": "gap-fill",
  "instruction": "string (hướng dẫn - sử dụng rich text format)",
  "quizNumber": "number (số thứ tự quiz)",
  "page": "number (optional - số trang tham chiếu)",
  "question": "string (nội dung câu hỏi với các gap markers)",
  "audio": "string (optional - đường dẫn file audio)",
  "transcript": "string (optional - đường dẫn file transcript)",
  "passage": "string (optional - đường dẫn file passage)",
  "answers": [
    {
      "id": "string (khớp với gap id trong question)",
      "answer": "string | string[] (đáp án đúng, có thể chấp nhận nhiều dạng viết)",
      "explain": "string (giải thích chi tiết - rich text format)"
    }
  ]
}
```

## Gap Markers Format (Thẻ đặc biệt - CHỈ dùng trong gap-fill)

Trong trường `question`, sử dụng tag `</gap id='answer_01'>` để đánh dấu vị trí điền từ.

> ⚠️ **Lưu ý quan trọng**: Thẻ `</gap>` là thẻ đặc biệt CHỈ DÙNG trong quiz type `gap-fill`. Các quiz type khác KHÔNG sử dụng thẻ này.

**Quy tắc:**

- `id` phải unique và bắt đầu bằng `answer_`
- `id` phải khớp với id trong mảng `answers`

## Rich Text Tags

Xem chi tiết về các thẻ rich text tại [rich-text-tags.md](./rich-text-tags.md).

Tóm tắt các thẻ cơ bản:

- `<p>text</p>` - đoạn văn
- `<p style='bold'>text</p>` - in đậm
- `<p style='bold center 18'>text</p>` - in đậm, căn giữa, cỡ 18
- `</n>` - xuống dòng

## Example Quiz

```json
{
  "id": "quiz_01",
  "title": "IELTS Listening - Transport Survey",
  "type": "gap-fill",
  "instruction": "<p>Write </p><p style='bold'>ONE WORD AND/OR A NUMBER </p><p>for each answer.</p>",
  "quizNumber": 1,
  "page": 12,
  "question": "<p style='bold center 18'>Transport survey</p></n></n><p style='bold'>Name: </p><p>Sadie Jones</p></n><p style='bold'>Postcode: </p></gap id='answer_01'></n><p>Reason for trip: </p><p>shopping and visit to the </p></gap id='answer_02'>",
  "audio": "./audio/listening_part1.mp3",
  "transcript": "./audio/listening_part1_transcript.json",
  "answers": [
    {
      "id": "answer_01",
      "answer": ["DW307YZ", "DW30 7YZ", "DW 307YZ"],
      "explain": "<p>Đáp án này xuất hiện khi người phỏng vấn hỏi \"your postcode, please\" và người trả lời đáp: \"It's DW 30 7YZ\".</p>\n<p>Các dạng viết liền hoặc có khoảng cách đều được chấp nhận.</p>"
    },
    {
      "id": "answer_02",
      "answer": ["dentist"],
      "explain": "<p>Người trả lời nói: \"the main reason I came here was to go to the dentist.\"</p>"
    }
  ]
}
```

## Lưu ý khi tạo Quiz

1. Mỗi gap phải có id duy nhất bắt đầu với `answer_`
2. Answer có thể là mảng nếu chấp nhận nhiều dạng viết khác nhau
3. Explain nên giải thích tại sao đáp án đó đúng và phân tích các đáp án sai (nếu có)
4. Instruction cần rõ ràng về giới hạn từ (ONE WORD, TWO WORDS, etc.)
