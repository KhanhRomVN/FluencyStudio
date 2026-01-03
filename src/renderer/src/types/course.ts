export interface Course {
 id: string;
 name: string;
 folderPath: string;
 description?: string;
 thumbnail?: string;
 lessonCount: number;
 lastAccessed?: Date;
 isValid: boolean; // Whether the folder still exists
}

export interface Lesson {
 id: string;
 courseId: string;
 title: string;
 order: number;
 audioFile?: string;
 imageFiles: string[];
 videoFiles: string[];
 content: string;
 duration?: number; // in minutes
 completed: boolean;
}

export interface CourseMetadata {
 name: string;
 version: string;
 description: string;
 author: string;
 totalLessons: number;
 createdDate: string;
 tags: string[];
}