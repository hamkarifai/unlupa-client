import { LoginPage } from "@/pages/auth/LoginPage";
import { createBrowserRouter } from "react-router";
import App from "./App";
import { LandingLayout } from "../layouts/LandingLayout";
import { LandingPage } from "../pages/LandingPage/LandingPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ProtectedRoute } from "@/components/guard/ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { DashboardShell } from "@/features/dashboard/DashboardShell";
import { NotFoundPage } from "@/pages/404/NotFoundPage";
import { TeacherRequestPage } from "@/features/dashboard/admin/pages/TeacherRequestPage";
import { UserListPage } from "@/features/dashboard/admin/pages/UserListPage";
import { PublishedBooksRequestPage } from "@/features/dashboard/admin/pages/PublishedBooksRequestPage";
import { AdminBookDetailPage } from "@/features/dashboard/admin/pages/AdminBookDetailPage";
import { AlquranPage } from "@/pages/alquran/AlquranPage";
import { StatusItemsByJuzPage } from "@/features/alquran/pages/StatusItemsByJuzPage";
import { StatusItemsView } from "@/features/alquran/pages/StatusItemsView";
import { PersonalPage } from "@/pages/personal/PersonalPage";
import { GlobalLibraryPage } from "@/pages/personal/GlobalLibraryPage";
import { ShareBooksPage } from "@/pages/personal/ShareBooksPage";
import { BookDetailPage } from "@/pages/personal/BookDetailPage";
import { ModuleDetailPage } from "@/pages/personal/ModuleDetailPage";
import { ItemDetailPage } from "@/pages/personal/ItemDetailPage";
import { ClassroomCardSandbox } from "@/features/classroom/pages/ClassroomSandbox";
import { ClassroomPage } from "@/pages/classroom/ClassroomPage";
import { ClassroomDetailView } from "@/features/classroom/pages/ClassroomDetailView";
import { ClassroomBookDetailView } from "@/features/classroom/pages/ClassroomBookDetailView";
import { QuranClassJuzDetailView } from "@/features/classroom/pages/QuranClassJuzDetailView";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      // LANDING
      {
        element: <LandingLayout />,
        children: [{ index: true, element: <LandingPage /> }],
      },

      // SANDBOX
      { path: "/sandbox/classroom", element: <ClassroomCardSandbox /> },

      // AUTH
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },

      // DASHBOARD
      {
        element: (
          <ProtectedRoute allowedRoles={["admin", "teacher", "student"]} />
        ),
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: "/dashboard", element: <DashboardShell /> },
              { path: "/dashboard/alquran", element: <AlquranPage /> },
              { path: "/dashboard/pribadi", element: <PersonalPage /> },
              {
                path: "/dashboard/pribadi/explore",
                element: <GlobalLibraryPage />,
              },
              { path: "/dashboard/pribadi/share", element: <ShareBooksPage /> },
              {
                path: "/dashboard/pribadi/book/:id",
                element: <BookDetailPage />,
              },
              {
                path: "/dashboard/pribadi/book/:bookId/module/:moduleId",
                element: <ModuleDetailPage />,
              },
              {
                path: "/dashboard/pribadi/book/:bookId/item/:itemId",
                element: <ItemDetailPage />,
              },
              { path: "/dashboard/kelas", element: <ClassroomPage /> },
              { path: "/dashboard/kelas/:classroomId", element: <ClassroomDetailView /> },
              { path: "/dashboard/kelas/:classroomId/book/:bookId", element: <ClassroomBookDetailView /> },
              { path: "/dashboard/kelas/:classroomId/juz/:juzId", element: <QuranClassJuzDetailView /> },
              // Status-based item pages
              {
                path: "/dashboard/alquran/status/:status",
                element: <StatusItemsByJuzPage />,
              },
              {
                path: "/dashboard/alquran/status/:status/:juzId",
                element: <StatusItemsView />,
              },
              {
                element: <ProtectedRoute allowedRoles={["admin"]} />,
                children: [
                  {
                    path: "/dashboard/teacher-requests",
                    element: <TeacherRequestPage />,
                  },
                  {
                    path: "/dashboard/user-list",
                    element: <UserListPage />,
                  },
                  {
                    path: "/dashboard/book-requests",
                    element: <PublishedBooksRequestPage />,
                  },
                  {
                    path: "/dashboard/book-requests/:id",
                    element: <AdminBookDetailPage />,
                  },
                ],
              },
            ],
          },
        ],
      },

      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
