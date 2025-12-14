import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm"; // Import the component you just made

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // THE CHECK: If user exists, kick them to the homepage
  if (user) {
    redirect("/");
  }

  // If not logged in, render the client-side form
  return <LoginForm />;
}