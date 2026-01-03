export const MOCK_COURSE_JSON = {
  id: 'course_004',
  title: 'Cambridge IELTS 18',
  imageUrl: 'https://i.ibb.co/G3fY83zT/English-IELTS-18-231x300.jpg',
  author: 'Cambridge University Press',
  adapter: 'KhanhRomVN',
  pageCount: 144,
  publisher: 'Cambridge University Press',
  publicationYear: 2023,
  skill: ['Listening', 'Reading', 'Writing', 'Speaking'],
  shortDescription: 'The latest official Cambridge IELTS practice tests.',
  fullDescription:
    'Authentic examination papers from Cambridge Assessment English provide perfect practice because they are EXACTLY like the real test. Inside IELTS 18 with Answers with Audio you will find FOUR complete examination papers plus details of the different parts of the test and the scoring system, so you can familiarise yourself with the test format and practise your exam technique.',
  targetAudience: 'vi',
};

export const MOCK_LESSON_1_JSON = {
  id: 'l_01',
  title: 'Test 1: Listening',
  lessonNumber: 1,
  quiz: [
    {
      id: 'ielts18_test1_part1',
      title: 'Part 1: Transport survey',
      type: 'gap-fill',
      instruction: '<p>Write ONE WORD AND/OR A NUMBER for each answer.</p>',
      quizNumber: 1,
      question:
        "<p>Transport survey</p></n><p>Name: Sadie Jones</p></n><p>Year of birth: 1991</p></n><p>Postcode: </p></gap id='answer_01'></n><p>Travelling by bus</p></n><p>Date of bus journey: </p></gap id='answer_02'></n><p>Reason for trip: shopping and visit to the </p></gap id='answer_03'></n><p>Travelled by bus because cost of </p></gap id='answer_04'><p> too high</p></n><p>Got on bus at </p></gap id='answer_05'><p> Street</p></n><p>Complaints about bus service:</p></n><p>- bus today was </p></gap id='answer_06'></n><p>- frequency of buses in the </p></gap id='answer_07'></n><p>Travelling by car</p></n><p>Goes to the </p></gap id='answer_08'><p> by car</p></n><p>Travelling by bicycle</p></n><p>Dislikes travelling by bike in the city centre because of the </p></gap id='answer_09'></n><p>Doesn’t own a bike because of a lack of </p></gap id='answer_10'>",
      audio: './audio/Cambridge_IELTS_18_Test1_Listening_Part1.mp3',
      answers: [],
    },
    {
      id: 'ielts18_test1_part2',
      title: 'Part 2: Volunteering for ACE',
      type: 'group',
      instruction: 'Choose the correct letter, A, B or C.',
      quizNumber: 2,
      audio: './audio/Cambridge_IELTS_18_Test1_Listening_Part2.mp3',
      questions: [
        {
          id: 'q11',
          type: 'multiple-choice',
          question: 'Why does the speaker apologise about the seats?',
          options: [
            { key: 'A', text: 'They are too small.' },
            { key: 'B', text: 'There are not enough of them.' },
            { key: 'C', text: 'Some of them are very close together.' },
          ],
          answer: 'C',
        },
        {
          id: 'q12',
          type: 'multiple-choice',
          question: 'What does the speaker say about the age of volunteers?',
          options: [
            { key: 'A', text: 'The age of volunteers is less important than other factors.' },
            { key: 'B', text: 'Young volunteers are less reliable than older ones.' },
            { key: 'C', text: 'Most volunteers are about 60 years old.' },
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 'ielts18_test1_part3',
      title: 'Part 3: Jobs in fashion design',
      type: 'group',
      instruction: 'Choose the correct letter, A, B or C.',
    },
    {
      id: 'ielts18_test1_part4',
      title: 'Part 4: Elephant Translocation',
      type: 'gap-fill',
      instruction: 'Write ONE WORD ONLY for each answer.',
    },
  ],
};
