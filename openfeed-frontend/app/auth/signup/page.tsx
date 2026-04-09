import { signUp } from "@/lib/supabase/auth";

export default function SignUpPage() {
  return (
    <div>
      {/* <h1>Create an account</h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          const email = formData.get("email") as string;
          const password = formData.get("password") as string;
          await signUp(email, password);
        }}
      >
        <input type="email" name="email" placeholder="Email" required />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account? <a href="/auth/signin">Sign in</a>
      </p> */}
      <p>Foo</p>
    </div>
  );
}
