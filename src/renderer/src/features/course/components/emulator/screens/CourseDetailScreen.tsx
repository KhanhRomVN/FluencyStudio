import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Lock, Check, BookOpen, Clock, Globe } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  duration?: string;
}

interface Course {
  title: string;
  imageUrl: string;
  author: string;
  translator: string;
  adapter: string;
  publisher: string;
  publicationYear: number;
  pageCount: number;
  rating?: string;
  fullDescription: string;
  shortDescription?: string;
  skill: string[];
  lessons: Lesson[];
  completedLessons: number;
}

interface CourseDetailScreenProps {
  courseData: Course;
}

// --- Components ---

const LessonCard: React.FC<{
  lesson: Lesson;
  index: number;
  isCompleted: boolean;
  isLocked: boolean;
  onClick: () => void;
}> = ({ lesson, index, isCompleted, isLocked, onClick }) => {
  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={`group relative flex items-center p-4 rounded-2xl border transition-all duration-300 ${
        isLocked
          ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60' // Locked state
          : 'bg-[hsl(var(--card))] border-[hsl(var(--border))]/40 hover:border-[hsl(var(--primary))]/30 hover:shadow-lg hover:shadow-[hsl(var(--primary))]/5 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]'
      }`}
    >
      {/* Icon State */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0 text-lg font-bold shadow-sm transition-colors duration-300 ${
          isCompleted
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : isLocked
              ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
              : 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))] group-hover:text-white'
        }`}
      >
        {isCompleted ? (
          <Check size={22} strokeWidth={3} />
        ) : isLocked ? (
          <Lock size={20} />
        ) : (
          <span>{index}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4
          className={`font-semibold text-[15px] truncate mb-1 transition-colors ${
            isLocked
              ? 'text-[hsl(var(--muted-foreground))]'
              : 'text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]'
          }`}
        >
          {lesson.title}
        </h4>
        <div className="flex items-center text-xs text-[hsl(var(--muted-foreground))]">
          <Clock size={12} className="mr-1" />
          {lesson.duration || '15 mins'}
        </div>
      </div>

      {!isLocked && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[hsl(var(--muted))] group-hover:bg-[hsl(var(--primary))]/10 transition-colors">
          <ChevronRight
            size={18}
            className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]"
          />
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-[13px] py-1">
    <span className="text-[hsl(var(--muted-foreground))] font-medium">{label}</span>
    <span className="font-semibold text-[hsl(var(--foreground))] text-right max-w-[65%] truncate">
      {value || '-'}
    </span>
  </div>
);

const Divider = () => <div className="h-px w-full bg-[hsl(var(--border))]/40 my-1" />;

export const CourseDetailScreen: React.FC<CourseDetailScreenProps> = ({ courseData }) => {
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Defensive check
  if (!courseData)
    return (
      <div className="h-full flex items-center justify-center text-[hsl(var(--muted-foreground))]">
        No Data
      </div>
    );

  const handleScroll = () => {
    if (scrollRef.current) {
      setScrolled(scrollRef.current.scrollTop > 20);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans select-none relative overflow-hidden">
      {/* 1. Scroll-Aware Header */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 px-5 pt-safe-top pb-3 transition-all duration-300 ease-out flex items-center justify-between pointer-events-none ${
          scrolled
            ? 'bg-[hsl(var(--background))]/95 backdrop-blur-md shadow-sm border-b border-[hsl(var(--border))]/50'
            : 'bg-transparent'
        }`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <div className="flex items-center pointer-events-auto">
          <h1
            className={`text-lg font-bold tracking-tight transition-all duration-300 ${scrolled ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
          >
            {courseData.title}
          </h1>
        </div>
        <div
          className={`px-2 py-1 bg-[hsl(var(--primary))] rounded-full shadow-lg shadow-[hsl(var(--primary))]/20 transition-all duration-300 ${scrolled ? 'scale-90' : 'scale-100'}`}
        >
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">v1.0</span>
        </div>
      </div>

      {/* Main Scroll Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-10"
      >
        {/* Large Header Area for Unscrolled State */}
        <div
          className="px-6 pt-12 pb-6 flex items-center justify-between opacity-100 transition-opacity duration-200"
          style={{ opacity: scrolled ? 0 : 1 }}
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">
            Course
          </h1>
        </div>

        {/* 2. Enhanced Hero Image with Reflection/Shadow */}
        <div className="flex justify-center mb-8 px-8 perspective-1000">
          <div className="w-[180px] relative group transition-transform duration-500 hover:scale-105">
            {/* Shadow Layer */}
            <div className="absolute inset-0 bg-black/20 rounded-2xl blur-xl translate-y-4 scale-90 group-hover:scale-100 transition-all duration-500"></div>

            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-[hsl(var(--card))] border border-[hsl(var(--border))]/20 shadow-2xl relative z-10">
              {courseData.imageUrl ? (
                <img
                  src={courseData.imageUrl}
                  alt={courseData.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]">
                  <BookOpen size={40} className="mb-2 opacity-50" />
                  <span className="text-xs font-medium">No Cover</span>
                </div>
              )}
              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* 3. Title & Skills */}
        <div className="px-6 mb-6 text-center">
          <h2 className="text-2xl font-bold leading-tight text-[hsl(var(--foreground))] mb-4">
            {courseData.title}
          </h2>

          {courseData.skill && (
            <div className="flex justify-center flex-wrap gap-2">
              {courseData.skill.map((skill, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 rounded-full bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 flex items-center gap-1.5"
                >
                  <Globe size={10} className="text-[hsl(var(--primary))]" />
                  <span className="text-[11px] font-bold text-[hsl(var(--primary))] uppercase tracking-wide">
                    {skill}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Information Card */}
        <div className="px-5 mb-8">
          <h3 className="text-sm font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3 px-1">
            Information
          </h3>
          <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]/50 shadow-sm backdrop-blur-sm">
            <div className="space-y-3">
              <InfoRow label="Author" value={courseData.author} />
              <Divider />
              <InfoRow label="Publisher" value={courseData.publisher} />
              <Divider />
              <InfoRow label="Year" value={courseData.publicationYear?.toString()} />
              <Divider />
              <InfoRow label="Rating" value={courseData.rating || '4.8 (12k reviews)'} />
            </div>
          </div>
        </div>

        {/* 5. About Section */}
        <div className="px-5 mb-8">
          <h3 className="text-sm font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 px-1">
            About
          </h3>
          <p className="text-[15px] leading-relaxed text-[hsl(var(--foreground))]/80 font-medium bg-[hsl(var(--card))]/50 p-4 rounded-xl border border-[hsl(var(--border))]/30">
            {courseData.fullDescription || courseData.shortDescription}
          </p>
        </div>

        {/* 6. Lessons List */}
        <div className="px-5 pb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">Lessons</h3>
            <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded-md">
              {courseData.lessons?.length || 0} Total
            </span>
          </div>

          <div className="space-y-4">
            {courseData.lessons &&
              courseData.lessons.map((lesson, index) => {
                const completedLessons = courseData.completedLessons || 1;
                const isCompleted = index < completedLessons;
                const isLocked = index > completedLessons;

                return (
                  <LessonCard
                    key={lesson.id || index}
                    index={index + 1}
                    lesson={lesson}
                    isCompleted={isCompleted}
                    isLocked={isLocked}
                    onClick={() => console.log('Lesson clicked:', lesson.title)}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
