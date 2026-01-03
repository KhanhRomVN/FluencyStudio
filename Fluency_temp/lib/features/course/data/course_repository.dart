import 'dart:convert';
import 'package:fluency/features/course/domain/entities/course.dart';
import 'package:flutter/services.dart';

class CourseRepository {
  // List of known course files in assets
  static const List<String> _courseFiles = [
    // Based on what we created:
    'lib/features/course/assets/courses/Cambridge_IELTS_18/Cambridge_IELTS_18_Course.json', // Updated to new course file
    'lib/features/course/assets/courses/Hacker_TOEIC_Start_Listening/Hacker_TOEIC_Start_Listening.json',
    'lib/features/course/assets/courses/Hacker_TOEIC_Start_Reading/Hacker_TOEIC_Start_Reading.json',
    'lib/features/course/assets/courses/Oxford_Reading_Writing_1/Oxford_Reading_Writing_1.json',
  ];

  Future<List<Course>> getCourses() async {
    final List<Course> courses = [];

    for (final filePath in _courseFiles) {
      try {
        final jsonString = await rootBundle.loadString(filePath);
        final Map<String, dynamic> jsonMap =
            json.decode(jsonString) as Map<String, dynamic>;

        var course = Course.fromJson(jsonMap);

        // Special handling for Cambridge IELTS 18 split structure
        if (filePath.contains('Cambridge_IELTS_18_Course.json')) {
          try {
            // Load Lesson 1
            final lesson1String = await rootBundle.loadString(
                'lib/features/course/assets/courses/Cambridge_IELTS_18/Cambridge_IELTS_18_Lesson1.json');
            final lesson1Json =
                json.decode(lesson1String) as Map<String, dynamic>;
            final lesson1 = Lesson.fromJson(lesson1Json);

            course = course.copyWith(lessons: [lesson1]);
          } catch (e) {
            print('Error loading lessons for Cambridge IELTS 18: $e');
          }
        }

        courses.add(course);
      } catch (e) {
        // Log error or ignore if file doesn't exist
        print('Error loading course from $filePath: $e');
      }
    }
    return courses;
  }
}
