import { User, Calendar, TrendingUp, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import HealthTracker from "@/components/HealthTracker";
import SymptomChecker from "@/components/SymptomChecker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { healthProfiles, trackers } from "@shared/schema";
import profileImage from "@assets/mm_1762932674721.png";

type HealthProfile = typeof healthProfiles.$inferSelect;
type TrackerType = typeof trackers.$inferSelect;

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
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="symptoms" data-testid="tab-symptoms">
                فاحص الأعراض
              </TabsTrigger>
              <TabsTrigger value="vitals" data-testid="tab-vitals">
                المؤشرات الحيوية
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
          </Tabs>
        </div>
      </div>
    </div>
  );
}
