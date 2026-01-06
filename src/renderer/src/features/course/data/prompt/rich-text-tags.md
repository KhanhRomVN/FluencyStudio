# Rich Text Tags

## Mô tả

Hệ thống sử dụng các custom tags để định dạng văn bản trong các trường `question`, `instruction`, `explain`, etc.

---

## Thẻ cơ bản

### Thẻ `<p>` - Paragraph

Thẻ đoạn văn, hỗ trợ nhiều thuộc tính style.

**Cú pháp:**

```
<p>Nội dung văn bản</p>
<p style='...'>Nội dung với style</p>
```

**Các style hỗ trợ:**

| Style       | Mô tả       | Ví dụ                                     |
| ----------- | ----------- | ----------------------------------------- |
| `bold`      | In đậm      | `<p style='bold'>Text đậm</p>`            |
| `italic`    | In nghiêng  | `<p style='italic'>Text nghiêng</p>`      |
| `underline` | Gạch chân   | `<p style='underline'>Text gạch chân</p>` |
| `center`    | Căn giữa    | `<p style='center'>Text căn giữa</p>`     |
| `[số]`      | Cỡ chữ (px) | `<p style='18'>Text cỡ 18px</p>`          |

**Kết hợp nhiều style:**

```
<p style='bold center 18'>Tiêu đề lớn, đậm, căn giữa</p>
<p style='italic underline'>Text nghiêng và gạch chân</p>
```

---

### Thẻ `</n>` - New Line

Xuống dòng mới (tương đương `<br>`).

**Cú pháp:**

```
<p>Dòng 1</p></n><p>Dòng 2</p>
```

---

## Thẻ đặc biệt (Quiz-specific)

Một số thẻ chỉ dùng trong loại quiz cụ thể:

### Thẻ `</gap>` - Gap Marker (Chỉ dùng trong `gap-fill`)

Đánh dấu vị trí điền từ trong quiz gap-fill.

**Cú pháp:**

```
</gap id='answer_01'>
```

**Quy tắc:**

- `id` phải unique và bắt đầu bằng `answer_`
- `id` phải khớp với id trong mảng `answers`
- Thẻ này tự đóng (không có nội dung bên trong)

**Ví dụ:**

```json
{
  "question": "<p>The capital of Vietnam is </p></gap id='answer_01'><p>.</p>",
  "answers": [
    {
      "id": "answer_01",
      "answer": ["Hanoi", "Ha Noi"],
      "explain": "<p>Thủ đô của Việt Nam là Hà Nội.</p>"
    }
  ]
}
```

---

## Ví dụ hoàn chỉnh

### Instruction phức tạp:

```
<p>Read the passage and answer the questions below.</p></n>
<p>Write </p><p style='bold'>NO MORE THAN THREE WORDS</p><p> for each answer.</p>
```

### Question với tiêu đề:

```
<p style='bold center 18'>Transport Survey</p></n></n>
<p style='bold'>Name: </p><p>John Smith</p></n>
<p style='bold'>Age: </p></gap id='answer_01'>
```

### Explain chi tiết:

```
<p>Đáp án này xuất hiện trong đoạn hội thoại:</p></n>
<p style='italic'>"The main reason I came here was to visit the dentist."</p></n></n>
<p style='bold'>Phân tích:</p></n>
<p>Từ khóa "dentist" được nhắc đến trực tiếp trong bài nghe.</p>
```

---

## Bảng tổng hợp thẻ

| Thẻ      | Sử dụng trong    | Mô tả          |
| -------- | ---------------- | -------------- |
| `<p>`    | Tất cả quiz      | Đoạn văn       |
| `</n>`   | Tất cả quiz      | Xuống dòng     |
| `</gap>` | **Chỉ gap-fill** | Vị trí điền từ |

---

## Lưu ý quan trọng

1. **Không lồng thẻ `<p>`**: Mỗi đoạn văn nên là một thẻ `<p>` riêng biệt
2. **Sử dụng `</n>` để xuống dòng**: Không dùng `\n` hoặc `<br>`
3. **ID phải unique**: Mỗi gap phải có id khác nhau trong cùng một quiz
4. **Style có thể kết hợp**: Các style cách nhau bằng dấu cách
