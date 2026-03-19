import { signIn } from "@/actions/auth";

export default function SignInPage() {
  return (
    <div>
      <h1>Sign in</h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          const email = formData.get("email") as string;
          const password = formData.get("password") as string;
          await signIn(email, password);
        }}
      >
        <input type="email" name="email" placeholder="Email" required />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button type="submit">Sign In</button>
      </form>
      {/* <p>
        Don't have an account? <a href="/auth/signup">Sign up</a>
      </p> */}
    </div>
  );
}
