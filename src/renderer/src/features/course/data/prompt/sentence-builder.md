# Sentence Builder Quiz

## Mô tả

Quiz xây dựng câu - sắp xếp các từ lộn xộn thành câu hoàn chỉnh.

## Cấu trúc JSON

```json
{
  "id": "string (unique identifier)",
  "title": "string (tiêu đề quiz)",
  "type": "sentence-builder",
  "instruction": "string (optional - hướng dẫn)",
  "quizNumber": "number (số thứ tự quiz)",
  "sentences": [
    {
      "id": "string (unique identifier)",
      "words": ["string (mảng các từ đã xáo trộn)"],
      "correctOrder": [0, 1, 2, "... (mảng index đúng)"],
      "translate": "string (optional - nghĩa tiếng Việt làm gợi ý)"
    }
  ]
}
```

## Quy tắc

- `words`: Mảng các từ/cụm từ đã được xáo trộn
- `correctOrder`: Mảng các index chỉ thứ tự đúng của các từ trong `words`
- VD: words = ["cat", "the", "sat"], correctOrder = [1, 0, 2] → "the cat sat"

## Example Quiz

```json
{
  "id": "quiz_sentence_01",
  "title": "Sentence Building - Present Perfect",
  "type": "sentence-builder",
  "instruction": "<p>Arrange the words to make correct sentences.</p>",
  "quizNumber": 1,
  "sentences": [
    {
      "id": "sentence_01",
      "words": ["finished", "have", "I", "homework", "my"],
      "correctOrder": [2, 1, 0, 4, 3],
      "translate": "Tôi đã hoàn thành bài tập về nhà."
    },
    {
      "id": "sentence_02",
      "words": ["ever", "you", "been", "Have", "Japan", "to", "?"],
      "correctOrder": [3, 1, 4, 2, 5, 4, 6],
      "translate": "Bạn đã bao giờ đến Nhật Bản chưa?"
    },
    {
      "id": "sentence_03",
      "words": ["never", "seen", "I've", "such", "a", "movie", "beautiful"],
      "correctOrder": [2, 0, 1, 3, 4, 6, 5],
      "translate": "Tôi chưa bao giờ xem một bộ phim đẹp như vậy."
    },
    {
      "id": "sentence_04",
      "words": ["for", "have", "They", "here", "lived", "years", "ten"],
      "correctOrder": [2, 1, 4, 3, 0, 6, 5],
      "translate": "Họ đã sống ở đây mười năm."
    }
  ]
}
```

## Lưu ý khi tạo Quiz

1. Các từ nên được xáo trộn ngẫu nhiên, không theo thứ tự gốc
2. correctOrder phải chính xác để tạo câu đúng ngữ pháp
3. Translate giúp người học hiểu nghĩa và dễ sắp xếp hơn
4. Có thể nhóm theo điểm ngữ pháp (Present Perfect, Passive, etc.)
5. Độ khó tăng dần: câu ngắn → câu dài → câu phức
