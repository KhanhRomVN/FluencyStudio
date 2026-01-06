# Writing Quiz

## Mô tả

Quiz luyện viết - theo format IELTS Writing với Task 1 và Task 2.

## Cấu trúc JSON

```json
{
  "id": "string (unique identifier)",
  "title": "string (tiêu đề quiz)",
  "type": "writing",
  "instruction": "string (hướng dẫn chi tiết về task)",
  "quizNumber": "number (số thứ tự quiz)",
  "question": "string (đề bài viết)",
  "min": "number (số từ tối thiểu)",
  "example": "string (bài viết mẫu)"
}
```

## Writing Tasks

- **Task 1 (Academic)**: Mô tả biểu đồ, bảng, quy trình, bản đồ
- **Task 1 (General)**: Viết thư (formal, semi-formal, informal)
- **Task 2**: Essay về các chủ đề xã hội, giáo dục, công nghệ, v.v.

## Example Quiz - Task 1 Academic

```json
{
  "id": "quiz_writing_01",
  "title": "IELTS Writing Task 1 - Line Graph",
  "type": "writing",
  "instruction": "<p>The graph below shows the consumption of fast food in the UK from 1970 to 2010.</p><p>Summarise the information by selecting and reporting the main features, and make comparisons where relevant.</p><p style='bold'>Write at least 150 words.</p>",
  "quizNumber": 1,
  "question": "Describe the trends in fast food consumption in the UK between 1970 and 2010.",
  "min": 150,
  "example": "The line graph illustrates the consumption of three types of fast food (hamburgers, fish and chips, and pizza) in the United Kingdom over a 40-year period from 1970 to 2010.\n\nOverall, hamburger and pizza consumption rose significantly during this period, while fish and chips experienced a notable decline. By 2010, hamburgers had become the most popular fast food choice.\n\nIn 1970, fish and chips was the most consumed fast food at around 300 grams per week per person. However, this figure decreased steadily over the decades, falling to approximately 100 grams by 2010. In contrast, hamburger consumption started at just 50 grams in 1970 but increased dramatically to reach about 280 grams by the end of the period.\n\nPizza consumption showed the most remarkable growth, beginning at almost zero in 1970 and rising continuously to reach approximately 260 grams per person per week in 2010, making it the second most popular fast food by the end of the period."
}
```

## Example Quiz - Task 2

```json
{
  "id": "quiz_writing_02",
  "title": "IELTS Writing Task 2 - Opinion Essay",
  "type": "writing",
  "instruction": "<p>Write about the following topic:</p><p style='bold'>Some people believe that children should be taught to compete, while others think they should be taught to cooperate.</p><p>Discuss both views and give your own opinion.</p><p>Give reasons for your answer and include any relevant examples from your own knowledge or experience.</p><p style='bold'>Write at least 250 words.</p>",
  "quizNumber": 2,
  "question": "Should children be taught to compete or cooperate?",
  "min": 250,
  "example": "The question of whether children should be encouraged to compete or collaborate has sparked considerable debate among educators and parents alike. While both approaches have their merits, I believe that a balanced combination of both skills is essential for children's development.\n\nOn one hand, teaching children to compete can prepare them for the realities of adult life. In many professional settings, individuals must compete for promotions, clients, and recognition. Children who learn healthy competition develop resilience, motivation, and the drive to improve themselves. For instance, academic competitions like spelling bees or science fairs encourage students to push their boundaries and achieve excellence.\n\nOn the other hand, cooperation is equally vital in today's interconnected world. Team projects in schools teach children valuable skills such as communication, compromise, and collective problem-solving. These skills are increasingly important in modern workplaces, where cross-functional teams collaborate on complex projects. Moreover, cooperative learning has been shown to enhance understanding and retention of knowledge, as students explain concepts to each other.\n\nIn my opinion, children benefit most from learning both skills in appropriate contexts. Competition should be taught in a healthy manner that emphasizes personal improvement rather than defeating others. Meanwhile, cooperation should be encouraged to build empathy and social skills. Schools can achieve this balance through a mix of individual assessments and group projects.\n\nIn conclusion, rather than viewing competition and cooperation as mutually exclusive, we should teach children when each approach is most appropriate. This balanced approach will prepare them to succeed in both their personal and professional lives."
}
```

## Example Quiz - Task 1 General (Letter)

```json
{
  "id": "quiz_writing_03",
  "title": "IELTS Writing Task 1 - Formal Letter",
  "type": "writing",
  "instruction": "<p>You recently bought a piece of equipment for your kitchen but it did not work. You phoned the shop but no action was taken.</p><p>Write a letter to the shop manager. In your letter:</p><p>- describe the problem with the equipment</p><p>- explain what happened when you phoned the shop</p><p>- say what you would like the manager to do</p><p style='bold'>Write at least 150 words.</p>",
  "quizNumber": 3,
  "question": "Write a complaint letter about faulty kitchen equipment.",
  "min": 150,
  "example": "Dear Sir or Madam,\n\nI am writing to express my dissatisfaction with a food processor I purchased from your store on 15th January and to request a full refund.\n\nThe KitchenPro 3000 food processor, which I bought for £89.99, stopped functioning after just three uses. When I attempted to use it last week, the motor made a loud grinding noise and then completely failed to start. Despite following all instructions in the manual correctly, the appliance appears to be defective.\n\nI called your customer service line on 20th January and spoke with a representative named John. Unfortunately, he was unhelpful and simply suggested I check the plug, which I had already done. When I asked to speak with a supervisor, I was put on hold for 25 minutes before the call was disconnected.\n\nGiven the faulty product and poor customer service I have received, I would like you to arrange a full refund at your earliest convenience. I have enclosed the receipt and am happy to return the defective item.\n\nI look forward to hearing from you within seven working days.\n\nYours faithfully,\nJane Smith"
}
```

## Lưu ý khi tạo Quiz

1. Instruction phải rõ ràng về yêu cầu task
2. Min word count: Task 1 = 150, Task 2 = 250
3. Example phải đạt chuẩn band 7-8 về ngôn ngữ và cấu trúc
4. Sử dụng đa dạng cấu trúc câu và từ vựng trong example
