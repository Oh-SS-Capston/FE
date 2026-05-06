import { RouterProvider } from "react-router-dom";
import { router } from "../routes";
import { AuthProvider } from "../../features/auth/model/AuthContext";

export function AppProviders() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}