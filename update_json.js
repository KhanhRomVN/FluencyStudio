const fs = require('fs');
const path = 'courses/Grammar_Zero_To_Hero/Grammar_Zero_To_Hero_Lesson1.json';
const data = fs.readFileSync(path, 'utf8');
const jsonData = JSON.parse(data);
const q = jsonData.lessons[0].quiz.find(q => q.type === 'sentence-transformation' && q.id === 't1'); // Wait, structure is 'items' or similar. 
// Let's check structure. It's 'items' or root array?
// The previous output showed an array of objects. It seems top level array?
// Ah, looking at grep output: '299:      "type": "sentence-transformation",' INDENTED.
// It is likely inside an array.
// Let's simpler approach: Use the exact string replacement.
const newData = data.replace('"explain": "<p></p>"', 
'"explain": "<p><b>Cấu trúc câu gốc:</b> \"Start + V-ing/to V ... ago\" (Bắt đầu làm gì đó cách đây ...)</p><p>Đây là thì <b>Past Simple</b> (Quá khứ đơn), diễn tả hành động bắt đầu tại một thời điểm xác định trong quá khứ.</p><p><b>Cấu trúc viết lại:</b> \"S + have/has + V3/ed (or been V-ing) + for + [khoảng thời gian]\"</p><p>Đây là thì <b>Present Perfect</b> (Hiện tại hoàn thành) hoặc <b>Present Perfect Continuous</b> (Hiện tại hoàn thành tiếp diễn), diễn tả hành động bắt đầu trong quá khứ và kéo dài đến hiện tại.</p><p><b>Ví dụ:</b></p><ul><li>She started working 5 years ago. (Cô ấy bắt đầu làm việc 5 năm trước)</li><li>=> She has worked / has been working for 5 years. (Cô ấy đã làm việc được 5 năm)</li></ul>"'
);
fs.writeFileSync(path, newData);
console.log('Updated explain field');
