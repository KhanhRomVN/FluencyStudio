# Pronunciation Drill Quiz

## Mô tả

Quiz luyện phát âm - người dùng nghe, luyện phát âm và ghi âm để so sánh với chuẩn.

## Cấu trúc JSON

```json
{
  "id": "string (unique identifier)",
  "title": "string (tiêu đề quiz)",
  "type": "pronunciation-drill",
  "instruction": "string (optional - hướng dẫn)",
  "quizNumber": "number (số thứ tự quiz)",
  "drills": [
    {
      "id": "string (unique identifier)",
      "text": "string (từ hoặc cụm từ cần phát âm)",
      "ipa": "string (phiên âm IPA)",
      "translate": "string (nghĩa tiếng Việt)",
      "hiddenWord": "string (optional - từ ẩn trong cụm, hiện khi phát âm đúng)"
    }
  ]
}
```

## Lưu ý về hiddenWord

- Dùng cho cụm từ dài, ẩn 1 từ quan trọng
- Hiển thị dưới dạng "\_\_\_" cho đến khi người dùng phát âm đúng
- Tạo thử thách và động lực học

## Example Quiz

```json
{
  "id": "quiz_pronunciation_01",
  "title": "Vocabulary Pronunciation - Travel",
  "type": "pronunciation-drill",
  "instruction": "<p>Listen and repeat each word. Record your voice to compare.</p>",
  "quizNumber": 1,
  "drills": [
    {
      "id": "drill_01",
      "text": "destination",
      "ipa": "/ˌdestɪˈneɪʃn/",
      "translate": "điểm đến"
    },
    {
      "id": "drill_02",
      "text": "accommodation",
      "ipa": "/əˌkɒməˈdeɪʃn/",
      "translate": "chỗ ở"
    },
    {
      "id": "drill_03",
      "text": "itinerary",
      "ipa": "/aɪˈtɪnərəri/",
      "translate": "lịch trình"
    },
    {
      "id": "drill_04",
      "text": "I'm planning a trip to Paris",
      "ipa": "/aɪm ˈplænɪŋ ə trɪp tə ˈpærɪs/",
      "translate": "Tôi đang lên kế hoạch đi Paris",
      "hiddenWord": "Paris"
    },
    {
      "id": "drill_05",
      "text": "The flight was delayed",
      "ipa": "/ðə flaɪt wɒz dɪˈleɪd/",
      "translate": "Chuyến bay bị trễ",
      "hiddenWord": "delayed"
    }
  ]
}
```

## Lưu ý khi tạo Quiz

1. IPA phải chính xác theo chuẩn British hoặc American English
2. Translate nên ngắn gọn, dễ hiểu
3. HiddenWord phải là từ có trong text
4. Sắp xếp từ đơn giản đến phức tạp
5. Nhóm theo chủ đề để dễ học
