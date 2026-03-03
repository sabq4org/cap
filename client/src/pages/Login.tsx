import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { LogIn, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "تم تسجيل الدخول بنجاح", description: "أهلاً بعودتك!" });
      navigate("/");
    },
    onError: (err: any) => {
      let msg = "تعذّر تسجيل الدخول";
      try {
        const text: string = err.message || "";
        const colonIdx = text.indexOf(": ");
        if (colonIdx !== -1) {
          const body = JSON.parse(text.slice(colonIdx + 2));
          if (body?.message) msg = body.message;
        }
      } catch {}
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <LogIn className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">تسجيل الدخول</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">مرحباً بك في كبسولة</p>
        </div>

        <Card className="border-0 shadow-xl dark:bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-right">بياناتك</CardTitle>
            <CardDescription className="text-right">أدخل بريدك الإلكتروني وكلمة المرور</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-email"
                          type="email"
                          placeholder="example@email.com"
                          dir="ltr"
                          className="text-left"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            data-testid="input-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            dir="ltr"
                            className="text-left pl-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  data-testid="button-login"
                  type="submit"
                  className="w-full h-11"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                إنشاء حساب جديد
              </Link>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400 uppercase">
                <span className="bg-white dark:bg-gray-800 px-2">أو</span>
              </div>
            </div>

            <a href="/api/login" className="block">
              <Button data-testid="button-replit-login" variant="outline" className="w-full h-11">
                الدخول عبر Replit
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
