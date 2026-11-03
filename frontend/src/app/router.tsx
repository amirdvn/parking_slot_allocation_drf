
import { createBrowserRouter } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

function HomePage() {
  return (
    <main
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-secondary-900">
          سیستم مدیریت پارکینگ
        </h1>

        <div className="flex flex-col gap-5">
          <Input
            label="شماره موبایل"
            placeholder="09123456789"
            dir="ltr"
          />

          <Input
            label="نام و نام خانوادگی"
            placeholder="نام خود را وارد کنید"
          />

          <Input
            label="شماره پلاک"
            placeholder="شماره پلاک را وارد کنید"
            error="شماره پلاک معتبر نیست."
          />

          <Input
            label="توضیحات"
            placeholder="توضیحات اختیاری"
            helperText="حداکثر ۲۵۰ کاراکتر"
          />

          <Button className="w-full">
            ثبت اطلاعات
          </Button>
        </div>
      </div>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-xl font-bold">صفحه موردنظر پیدا نشد!</h1>
    </main>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "*", element: <NotFoundPage /> },
]);
