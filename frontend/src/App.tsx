// src/App.tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AuthProvider } from "./features/auth/AuthContext";
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        richColors
        closeButton
        dir="rtl"
        toastOptions={{
          style: {
            fontFamily: "Vazirmatn, sans-serif",
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;