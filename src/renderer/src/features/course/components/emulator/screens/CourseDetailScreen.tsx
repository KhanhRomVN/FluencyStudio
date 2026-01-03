import React from 'react';
import { BookOpen, Globe } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  duration?: string;
  quizCount?: number;
  lessonNumber?: number;
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

// --- Constants & Utilities ---

const SKILL_COLORS = [
  {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    icon: 'text-blue-500',
  },
  {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
    icon: 'text-purple-500',
  },
  {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-500',
  },
  {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    icon: 'text-amber-500',
  },
  {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
    icon: 'text-rose-500',
  },
  {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    icon: 'text-indigo-500',
  },
];

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
  // Dart: 28x28 Badge
  // Completed: Primary BG, Primary Border
  // Locked: Grey BG (alpha 0.1), Grey Border (alpha 0.3)
  // Unlocked: Transparent BG, Primary Border

  // Colors based on state
  const badgeBg = isCompleted
    ? 'bg-[hsl(var(--primary))]'
    : isLocked
      ? 'bg-gray-500/10'
      : 'bg-transparent';

  const badgeBorder = isCompleted
    ? 'border-[hsl(var(--primary))]'
    : isLocked
      ? 'border-gray-500/30'
      : 'border-[hsl(var(--primary))]';

  const badgeText = isCompleted
    ? 'text-white'
    : isLocked
      ? 'text-gray-500'
      : 'text-[hsl(var(--primary))]';

  const titleColor = isLocked
    ? 'text-[hsl(var(--muted-foreground))]'
    : 'text-[hsl(var(--foreground))]';

  const quizBadgeBg = isLocked ? 'bg-gray-500/10' : 'bg-[hsl(var(--primary))]/10';

  const quizBadgeText = isLocked ? 'text-gray-500' : 'text-[hsl(var(--primary))]';

  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={`relative flex items-start p-2 rounded-xl transition-all duration-200 ${
        isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-[0.99]'
      }`}
    >
      {/* InkWell ripple effect is hard to perfectly replicate without huge libs, 
          but active:scale and hover:bg simulates it well enough for web */}
      {!isLocked && (
        <div className="absolute inset-0 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors pointer-events-none" />
      )}
      {/* Left: Square Badge (28x28) */}
      <div
        className={`w-7 h-7 flex items-center justify-center rounded-[4px] border-[1.5px] ${badgeBg} ${badgeBorder} flex-shrink-0 mt-0.5`}
      >
        <span className={`text-xs font-bold leading-none ${badgeText}`}>
          {lesson.lessonNumber ?? index}
        </span>
      </div>
      <div className="w-4" /> {/* SizedBox width: 16 */}
      {/* Right: Info */}
      <div className="flex-1 flex flex-col items-start min-w-0">
        {/* Row 1: Title */}
        <h4 className={`text-sm font-bold leading-tight mb-1.5 ${titleColor}`}>{lesson.title}</h4>

        {/* Row 2: Quiz Badge */}
        <div className={`px-2 py-0.5 rounded-[4px] ${quizBadgeBg} flex items-center`}>
          <span className={`text-[10px] font-semibold ${quizBadgeText}`}>
            {lesson.quizCount ?? 0} Quizzes
          </span>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start text-[13px] py-1.5 group">
      <span className="text-[hsl(var(--muted-foreground))] text-xs font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
      <span className="font-semibold text-[hsl(var(--foreground))] text-right max-w-[60%] truncate text-[12.5px]">
        {value}
      </span>
    </div>
  );
};

const Divider = () => <div className="h-px w-full bg-[hsl(var(--border))]/40 my-1" />;

export const CourseDetailScreen: React.FC<CourseDetailScreenProps> = ({ courseData }) => {
  // Defensive check
  if (!courseData)
    return (
      <div className="h-full flex items-center justify-center text-[hsl(var(--muted-foreground))]">
        No Data
      </div>
    );

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans select-none relative overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[hsl(var(--primary))]/5 to-transparent pointer-events-none" />

      {/* 1. Header (Scrolls with content) */}
      <div className="px-6 pt-8 pb-2 mb-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Course
          </h1>
          <div className="px-1.5 py-[2px] bg-[hsl(var(--primary))] rounded-sm shadow-sm shadow-[hsl(var(--primary))]/20 flex items-center justify-center">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider leading-none">
              v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-10 relative z-10">
        {/* 2. Enhanced Hero Image with Reflection/Shadow */}
        <div className="flex justify-center mb-8 px-8 perspective-1000">
          <div className="w-[180px] relative group transition-transform duration-500 hover:scale-105">
            {/* Shadow Layer */}
            {/* Shadow Layer optimized */}
            <div className="absolute inset-0 bg-black/20 rounded-2xl blur-2xl translate-y-6 scale-[0.85] group-hover:scale-100 transition-all duration-500 group-hover:bg-black/30"></div>

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
              {courseData.skill.map((skill, idx) => {
                const colorTheme = SKILL_COLORS[idx % SKILL_COLORS.length];
                return (
                  <div
                    key={idx}
                    className={`px-3 py-1 rounded-full border ${colorTheme.bg} ${colorTheme.border} flex items-center gap-1.5 transition-transform hover:scale-105 cursor-default`}
                  >
                    <Globe size={10} className={colorTheme.icon} />
                    <span
                      className={`text-[10px] font-bold ${colorTheme.text} uppercase tracking-wider`}
                    >
                      {skill}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Information Card */}
        <div className="px-5 mb-8">
          <h3 className="text-sm font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3 px-1">
            Information
          </h3>
          <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]/50 shadow-sm backdrop-blur-sm">
            <div className="space-y-1">
              <InfoRow label="Author" value={courseData.author} />
              <Divider />
              {/* Added Adapter Adapter */}
              <InfoRow label="Adapter" value={courseData.adapter} />
              <Divider />
              <InfoRow label="Publisher" value={courseData.publisher} />
              <Divider />
              <InfoRow label="Year" value={courseData.publicationYear?.toString()} />
            </div>
          </div>
        </div>

        {/* 5. About Section */}
        <div className="px-5 mb-8">
          <h3 className="text-sm font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 px-1">
            About
          </h3>
          <p className="text-[14px] leading-relaxed text-[hsl(var(--foreground))]/80 font-normal tracking-normal px-1">
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
