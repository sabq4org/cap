import { TrendingUp, TrendingDown, Activity, Heart, Droplet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrackerProps {
  title: string;
  value: string;
  unit: string;
  change?: number;
  icon: "heart" | "activity" | "droplet";
  status?: "normal" | "warning" | "danger";
}

export default function HealthTracker({ title, value, unit, change, icon, status = "normal" }: TrackerProps) {
  const icons = {
    heart: Heart,
    activity: Activity,
    droplet: Droplet,
  };

  const Icon = icons[icon];

  const statusColors = {
    normal: "text-primary",
    warning: "text-amber-500",
    danger: "text-destructive",
  };

  const statusBadges = {
    normal: "طبيعي",
    warning: "انتبه",
    danger: "مرتفع",
  };

  return (
    <Card className="hover-elevate transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className={`rounded-full p-2 bg-primary/10 ${statusColors[status]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{value}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>

          {change !== undefined && (
            <div className="flex items-center gap-2">
              {change > 0 ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={`text-sm ${change > 0 ? "text-primary" : "text-destructive"}`}>
                {Math.abs(change)}% عن الأسبوع الماضي
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Badge variant={status === "normal" ? "secondary" : "destructive"} className="text-xs">
              {statusBadges[status]}
            </Badge>
            <Button variant="ghost" size="sm" className="h-8 text-xs" data-testid={`button-view-${title}`}>
              عرض التفاصيل
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
