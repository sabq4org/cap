import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { apiRequest } from "@/lib/queryClient";
import { insertAuthorSchema, type InsertAuthor } from "@shared/schema";
import { PenSquare, UserPlus, CheckCircle2, Upload, Loader2, X, Info } from "lucide-react";

export default function AuthorRegister() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const credFileRef = useRef<HTMLInputElement>(null);

  const form = useForm<InsertAuthor>({
    resolver: zodResolver(insertAuthorSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      profileImageUrl: "",
      bio: "",
      specialty: "",
      jobTitle: "",
      qualification: "",
      organization: "",
      yearsExperience: undefined,
      twitterUrl: "",
      linkedinUrl: "",
      websiteUrl: "",
      credentialsImageUrl: "",
    },
  });

  const { uploadFile: uploadProfile, isUploading: isUpProfile } = useUpload({
    onSuccess: (r) => form.setValue("profileImageUrl", r.objectPath),
    onError: (e) => toast({ title: "فشل الرفع", description: e.message, variant: "destructive" }),
  });
  const { uploadFile: uploadCred, isUploading: isUpCred } = useUpload({
    onSuccess: (r) => form.setValue("credentialsImageUrl", r.objectPath),
    onError: (e) => toast({ title: "فشل الرفع", description: e.message, variant: "destructive" }),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertAuthor) => {
      const payload = {
        ...data,
        yearsExperience: data.yearsExperience ? Number(data.yearsExperience) : undefined,
      };
      const res = await apiRequest("POST", "/api/authors/register", payload);
      return await res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "تم الإرسال", description: "سنراجع طلبك ونعود إليك قريباً" });
    },
    onError: (e: any) => {
      toast({ title: "تعذّر التسجيل", description: e?.message || "حاول مرة أخرى", variant: "destructive" });
    },
  });

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">تم استلام طلبك</h2>
            <p className="text-muted-foreground mb-6">
              شكراً لاهتمامك بالكتابة في كبسولة. سيراجع فريق التحرير طلبك خلال 48 ساعة، وسنتواصل معك على بريدك الإلكتروني.
            </p>
            <Link href="/">
              <Button data-testid="button-go-home">العودة للرئيسية</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profileImg = form.watch("profileImageUrl");
  const credImg = form.watch("credentialsImageUrl");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <PenSquare className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">انضم إلى كتّاب كبسولة</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          نبحث عن أطباء، مختصين في التغذية، صيادلة، وصحفيين صحيين للمساهمة بمحتوى موثوق وملهم لقرّائنا.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg p-4 mb-6 flex gap-3">
        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 dark:text-amber-200">
          جميع الطلبات تخضع للمراجعة من فريق التحرير. لن يظهر ملفك للعموم إلا بعد الموافقة.
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => submitMutation.mutate(d))} className="space-y-6">

          <Card>
            <CardHeader><CardTitle className="text-base">المعلومات الأساسية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل *</FormLabel>
                  <FormControl><Input {...field} placeholder="د. محمد الأحمد" data-testid="input-full-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني *</FormLabel>
                    <FormControl><Input type="email" {...field} dir="ltr" placeholder="name@example.com" data-testid="input-email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الجوال (اختياري)</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="+9665xxxxxxxx" data-testid="input-phone" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="profileImageUrl" render={() => (
                <FormItem>
                  <FormLabel>الصورة الشخصية</FormLabel>
                  <div className="flex items-center gap-3">
                    {profileImg ? (
                      <div className="relative">
                        <img src={profileImg} alt="" className="h-20 w-20 rounded-full object-cover border" data-testid="img-profile-preview" />
                        <button type="button" onClick={() => form.setValue("profileImageUrl", "")} className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center" data-testid="button-remove-profile">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed">
                        <UserPlus className="h-8 w-8" />
                      </div>
                    )}
                    <input ref={profileFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadProfile(f);
                    }} data-testid="input-profile-file" />
                    <Button type="button" variant="outline" onClick={() => profileFileRef.current?.click()} disabled={isUpProfile} data-testid="button-upload-profile">
                      {isUpProfile ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Upload className="h-4 w-4 ml-2" />}
                      رفع صورة
                    </Button>
                  </div>
                </FormItem>
              )} />

              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel>السيرة الذاتية المختصرة *</FormLabel>
                  <FormControl><Textarea {...field} rows={4} placeholder="نبذة عنك وعن خبراتك في 3-4 أسطر..." data-testid="input-bio" /></FormControl>
                  <FormDescription>20 حرف على الأقل</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">المعلومات المهنية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="specialty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>التخصص *</FormLabel>
                    <FormControl><Input {...field} placeholder="مثال: تغذية علاجية، طب باطني" data-testid="input-specialty" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="jobTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المسمى الوظيفي</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} placeholder="استشاري / صحفي صحي / أخصائي" data-testid="input-job-title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="qualification" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المؤهل العلمي</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} placeholder="دكتوراه / ماجستير / بكالوريوس" data-testid="input-qualification" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="organization" render={({ field }) => (
                  <FormItem>
                    <FormLabel>جهة العمل</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} placeholder="اسم المستشفى / المركز / الجامعة" data-testid="input-organization" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                <FormItem className="max-w-[200px]">
                  <FormLabel>سنوات الخبرة</FormLabel>
                  <FormControl><Input type="number" min={0} max={80} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))} data-testid="input-years" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">روابط التواصل (اختياري)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="twitterUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>تويتر / X</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="https://x.com/username" data-testid="input-twitter" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>لينكدإن</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="https://linkedin.com/in/username" data-testid="input-linkedin" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>الموقع الشخصي</FormLabel>
                  <FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="https://yourwebsite.com" data-testid="input-website" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">إثبات الانتساب المهني</CardTitle>
              <FormDescription>للأطباء والمختصين الصحيين فقط — صورة من البطاقة المهنية أو شهادة التخرج. تظهر للأدمن فقط ولا تُنشر.</FormDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {credImg ? (
                  <div className="relative">
                    <img src={credImg} alt="" className="h-24 w-32 object-cover rounded border" data-testid="img-cred-preview" />
                    <button type="button" onClick={() => form.setValue("credentialsImageUrl", "")} className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center" data-testid="button-remove-cred">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-32 rounded bg-muted border-2 border-dashed flex items-center justify-center text-muted-foreground text-xs">
                    لا توجد صورة
                  </div>
                )}
                <input ref={credFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCred(f);
                }} data-testid="input-cred-file" />
                <Button type="button" variant="outline" onClick={() => credFileRef.current?.click()} disabled={isUpCred} data-testid="button-upload-cred">
                  {isUpCred ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Upload className="h-4 w-4 ml-2" />}
                  رفع وثيقة
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={submitMutation.isPending} data-testid="button-submit-author">
            {submitMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الإرسال...</> : <>إرسال طلب الانضمام<UserPlus className="h-4 w-4 mr-2" /></>}
          </Button>
        </form>
      </Form>
    </div>
  );
}
