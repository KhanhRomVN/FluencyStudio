# Sentence Transformation Quiz

## Mô tả

Quiz biến đổi câu - viết lại câu sử dụng từ khóa cho trước mà nghĩa không đổi.

## Cấu trúc JSON

```json
{
  "id": "string (unique identifier)",
  "title": "string (tiêu đề quiz)",
  "type": "sentence-transformation",
  "instruction": "string (optional - hướng dẫn)",
  "quizNumber": "number (số thứ tự quiz)",
  "transformations": [
    {
      "id": "string (unique identifier)",
      "original": "string (câu gốc)",
      "keyword": "string (từ khóa bắt buộc phải dùng)",
      "answer": "string | string[] (đáp án đúng, có thể nhiều cách viết)",
      "explain": "string (optional - giải thích)"
    }
  ]
}
```

## Quy tắc

- Người dùng phải viết lại câu với nghĩa tương đương
- Từ khóa (keyword) PHẢI được sử dụng trong câu mới
- Thường có giới hạn số từ có thể thêm/bỏ

## Example Quiz

```json
{
  "id": "quiz_transform_01",
  "title": "Sentence Transformation - Cambridge FCE",
  "type": "sentence-transformation",
  "instruction": "<p>Complete the second sentence so that it has a similar meaning to the first sentence, using the word given.</p><p style='bold'>Use between 2 and 5 words, including the word given.</p>",
  "quizNumber": 1,
  "transformations": [
    {
      "id": "transform_01",
      "original": "I haven't been to the cinema for six months.",
      "keyword": "LAST",
      "answer": [
        "The last time I went to the cinema was six months ago.",
        "I last went to the cinema six months ago."
      ],
      "explain": "<p>Sử dụng cấu trúc 'The last time + past simple' hoặc 'subject + last + past simple'.</p>\n<p>Cả hai cách đều diễn đạt cùng một ý: lần cuối đi xem phim là 6 tháng trước.</p>"
    },
    {
      "id": "transform_02",
      "original": "She started learning French three years ago.",
      "keyword": "BEEN",
      "answer": ["She has been learning French for three years."],
      "explain": "<p>Chuyển từ thì quá khứ đơn với 'ago' sang hiện tại hoàn thành tiếp diễn với 'for'.</p>\n<p>Cấu trúc: has/have + been + V-ing + for + time period</p>"
    },
    {
      "id": "transform_03",
      "original": "It's not necessary for you to come early.",
      "keyword": "HAVE",
      "answer": ["You don't have to come early.", "You do not have to come early."],
      "explain": "<p>'It's not necessary' = 'don't have to'</p>\n<p>Cả hai đều diễn đạt sự không bắt buộc.</p>"
    },
    {
      "id": "transform_04",
      "original": "I regret not studying harder at school.",
      "keyword": "WISH",
      "answer": ["I wish I had studied harder at school."],
      "explain": "<p>Cấu trúc 'wish + past perfect' để diễn đạt sự hối tiếc về quá khứ.</p>\n<p>'regret not V-ing' = 'wish + had + past participle'</p>"
    }
  ]
}
```

## Lưu ý khi tạo Quiz

1. Original và answer phải cùng nghĩa
2. Keyword phải xuất hiện trong answer
3. Nên cung cấp nhiều đáp án nếu có nhiều cách viết đúng
4. Explain nên giải thích cấu trúc ngữ pháp được sử dụng
5. Phù hợp cho luyện thi Cambridge (FCE, CAE, CPE)
