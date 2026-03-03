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
import { UserPlus, Eye, EyeOff, CheckCircle } from "lucide-react";

const registerSchema = z.object({
  firstName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  lastName: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "تم إنشاء الحساب بنجاح", description: "أهلاً بك في كبسولة!" });
      navigate("/");
    },
    onError: (err: any) => {
      let msg = "تعذّر إنشاء الحساب";
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

  const password = form.watch("password");
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "ضعيفة", "متوسطة", "قوية"][strength];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-green-500"][strength];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إنشاء حساب</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">انضم إلى مجتمع كبسولة الصحي</p>
        </div>

        <Card className="border-0 shadow-xl dark:bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-right">معلوماتك الشخصية</CardTitle>
            <CardDescription className="text-right">أنشئ حسابك مجاناً خلال ثوانٍ</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => registerMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الأول *</FormLabel>
                        <FormControl>
                          <Input data-testid="input-first-name" placeholder="محمد" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم العائلة</FormLabel>
                        <FormControl>
                          <Input data-testid="input-last-name" placeholder="العمري" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني *</FormLabel>
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
                      <FormLabel>كلمة المرور *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            data-testid="input-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="6 أحرف على الأقل"
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
                      {password.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${strength >= i ? strengthColor : "bg-gray-200 dark:bg-gray-700"}`} />
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">قوة كلمة المرور: <span className="font-medium">{strengthLabel}</span></p>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تأكيد كلمة المرور *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            data-testid="input-confirm-password"
                            type={showConfirm ? "text" : "password"}
                            placeholder="أعد كتابة كلمة المرور"
                            dir="ltr"
                            className="text-left pl-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          {field.value && field.value === password && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  data-testid="button-register"
                  type="submit"
                  className="w-full h-11 mt-2"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                تسجيل الدخول
              </Link>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400 uppercase">
                <span className="bg-white dark:bg-gray-800 px-2">أو</span>
              </div>
            </div>

            <a href="/api/login" className="block">
              <Button data-testid="button-replit-register" variant="outline" className="w-full h-11">
                التسجيل عبر Replit
              </Button>
            </a>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          بإنشاء حساب، أنت توافق على{" "}
          <Link href="/privacy" className="underline">سياسة الخصوصية</Link>
        </p>
      </div>
    </div>
  );
}
