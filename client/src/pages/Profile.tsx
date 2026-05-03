import { useState } from "react";
import { User, Calendar, TrendingUp, Plus, Pill, Check } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import HealthTracker from "@/components/HealthTracker";
import SymptomChecker from "@/components/SymptomChecker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { healthProfiles, trackers, Category } from "@shared/schema";
import profileImage from "@assets/mm_1762932674721.png";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type HealthProfile = typeof healthProfiles.$inferSelect;
type TrackerType = typeof trackers.$inferSelect;

// ── Interests Panel (used inside Profile tabs) ────────────────────────────────

function InterestsPanel() {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);

  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories?active=true"],
    queryFn: async () => {
      const res = await fetch("/api/categories?active=true");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  const { data: interestsData } = useQuery<{ interests: string[] }>({
    queryKey: ["/api/capsule/interests"],
  });

  const interests = interestsData?.interests ?? [];

  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (slug: string) => {
    setSelected(prev =>
      prev.includes(slug) ? prev.filter(v => v !== slug) : [...prev, slug]
    );
  };

  const startEdit = () => {
    setSelected([...interests]);
    setEditMode(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (newInterests: string[]) => {
      await apiRequest("PUT", "/api/capsule/interests", { interests: newInterests });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capsule/interests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capsule/feed"] });
      setEditMode(false);
      toast({ title: "تم حفظ الاهتمامات" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          اهتمامات جرعتك اليومية
        </CardTitle>
        {!editMode && (
          <Button variant="outline" size="sm" onClick={startEdit} data-testid="button-profile-edit-interests">
            تعديل
          </Button>
        )}
      </CardHeader>
      <CardContent dir="rtl">
        {editMode ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">اختر الأقسام التي تهمك:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categoriesData.map(cat => {
                const isSelected = selected.includes(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    onClick={() => toggle(cat.slug)}
                    data-testid={`profile-interest-${cat.slug}`}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all hover-elevate
                      ${isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-muted/30 hover:border-primary/40"
                      }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1.5 left-1.5 rounded-full bg-primary p-0.5">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </span>
                    )}
                    <span className="text-xs font-medium text-center">{cat.nameAr}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)} data-testid="button-profile-cancel-interests">
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={() => saveMutation.mutate(selected)}
                disabled={saveMutation.isPending}
                data-testid="button-profile-save-interests"
              >
                <Check className="h-4 w-4 me-1" />
                {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </div>
        ) : interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map(slug => {
              const cat = categoriesData.find(c => c.slug === slug);
              return cat ? (
                <Badge key={slug} variant="secondary" data-testid={`profile-active-interest-${slug}`}>
                  {cat.nameAr}
                </Badge>
              ) : null;
            })}
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <p className="text-muted-foreground">لم تختر اهتمامات بعد</p>
            <Button variant="outline" size="sm" onClick={startEdit} data-testid="button-profile-add-interests">
              اختر اهتماماتك
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const { user } = useAuth();

  const { data: profile } = useQuery<HealthProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: trackers = [] } = useQuery<TrackerType[]>({
    queryKey: ["/api/trackers"],
    enabled: !!user,
  });

  const latestTrackers = trackers.reduce<Record<string, TrackerType>>((acc, tracker) => {
    if (!acc[tracker.type] || new Date(tracker.measuredAt) > new Date(acc[tracker.type].measuredAt)) {
      acc[tracker.type] = tracker;
    }
    return acc;
  }, {});

  const getTrackerIcon = (type: string): "heart" | "activity" | "droplet" => {
    if (type === "blood_pressure" || type === "heart_rate") return "heart";
    if (type === "blood_sugar" || type === "oxygen") return "droplet";
    return "activity";
  };

  const getTrackerStatus = (type: string, value: number): "normal" | "warning" | "danger" => {
    if (type === "blood_pressure") {
      if (value > 140) return "danger";
      if (value > 130) return "warning";
    }
    if (type === "blood_sugar") {
      if (value > 140) return "danger";
      if (value > 120) return "warning";
    }
    return "normal";
  };

  const trackerLabels: Record<string, string> = {
    blood_pressure: "ضغط الدم",
    weight: "الوزن",
    blood_sugar: "سكر الدم",
    heart_rate: "معدل النبض",
    temperature: "درجة الحرارة",
    oxygen: "الأكسجين",
  };

  const trackerUnits: Record<string, string> = {
    blood_pressure: "mmHg",
    weight: "كجم",
    blood_sugar: "mg/dL",
    heart_rate: "bpm",
    temperature: "°C",
    oxygen: "%",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6 flex-col md:flex-row">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImage} alt="محمد الحيدر" />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    م
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                      محمد الحيدر
                    </h1>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>انضم في {new Date(user?.createdAt || Date.now()).toLocaleDateString("ar-SA")}</span>
                    </div>
                    {profile?.goals && profile.goals.length > 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>هدف: {profile.goals[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="outline" data-testid="button-edit-profile">
                  تعديل الملف
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="vitals" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="symptoms" data-testid="tab-symptoms">
                فاحص الأعراض
              </TabsTrigger>
              <TabsTrigger value="vitals" data-testid="tab-vitals">
                المؤشرات الحيوية
              </TabsTrigger>
              <TabsTrigger value="interests" data-testid="tab-interests">
                اهتماماتي
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vitals" className="mt-8 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">متتبعاتي الصحية</h2>
                  <Button variant="default" size="sm" data-testid="button-add-tracker">
                    <Plus className="h-4 w-4 me-2" />
                    إضافة قياس
                  </Button>
                </div>
                
                {trackers.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">لا توجد قياسات بعد</p>
                      <p className="text-sm text-muted-foreground mt-2">ابدأ بإضافة قياساتك الصحية لمتابعة تقدمك</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(latestTrackers).map(([type, tracker]) => (
                      <HealthTracker
                        key={type}
                        title={trackerLabels[type] || type}
                        value={tracker.valuePrimary.toString()}
                        unit={trackerUnits[type] || ""}
                        icon={getTrackerIcon(type)}
                        status={getTrackerStatus(type, tracker.valuePrimary)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>معلومات صحية إضافية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">الطول</p>
                      <p className="text-lg font-semibold">{profile?.heightCm ? `${profile.heightCm} سم` : "غير محدد"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">الوزن</p>
                      <p className="text-lg font-semibold">{profile?.weightKg ? `${profile.weightKg} كجم` : "غير محدد"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">فصيلة الدم</p>
                      <p className="text-lg font-semibold">{profile?.bloodType || "غير محدد"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">الحالات المزمنة</p>
                      <p className="text-lg font-semibold">
                        {profile?.conditions && profile.conditions.length > 0
                          ? profile.conditions.join("، ")
                          : "لا يوجد"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">الحساسية</p>
                      <p className="text-lg font-semibold">
                        {profile?.allergies && profile.allergies.length > 0
                          ? profile.allergies.join("، ")
                          : "لا يوجد"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">الأدوية</p>
                      <p className="text-lg font-semibold">
                        {profile?.medications && profile.medications.length > 0
                          ? profile.medications.join("، ")
                          : "لا يوجد"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="symptoms" className="mt-8 flex justify-center">
              <SymptomChecker />
            </TabsContent>

            <TabsContent value="interests" className="mt-8">
              <InterestsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
