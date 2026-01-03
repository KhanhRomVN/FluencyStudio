import { RouteObject } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardPage from '../../features/dashboard';
import CoursePage from '../../features/course';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '',
        element: <DashboardPage />,
      },
      {
        path: 'course/:courseId',
        element: <CoursePage />,
      },
    ],
  },
];
