import { useState } from "react";
import { Plus, Apple, Flame, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface NutritionEntry {
  id: string;
  name: string;
  calories: number;
  time: string;
}

export default function NutritionLogger() {
  // todo: remove mock functionality
  const [entries, setEntries] = useState<NutritionEntry[]>([
    { id: "1", name: "وجبة الإفطار", calories: 450, time: "8:00 ص" },
    { id: "2", name: "وجبة الغداء", calories: 680, time: "1:30 م" },
  ]);
  const [showInput, setShowInput] = useState(false);
  const [newMeal, setNewMeal] = useState("");

  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const targetCalories = 2000;
  const progress = (totalCalories / targetCalories) * 100;

  const handleAddMeal = () => {
    if (!newMeal.trim()) return;
    
    const entry: NutritionEntry = {
      id: Date.now().toString(),
      name: newMeal,
      calories: Math.floor(Math.random() * 400) + 200,
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    };
    
    setEntries([...entries, entry]);
    setNewMeal("");
    setShowInput(false);
    console.log("Added meal:", entry.name);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-primary/10">
            <Apple className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">متتبع التغذية اليومي</CardTitle>
        </div>
        <Button
          onClick={() => setShowInput(!showInput)}
          className="gap-2"
          data-testid="button-add-meal"
        >
          <Plus className="h-4 w-4" />
          إضافة وجبة
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {showInput && (
          <div className="flex gap-2 p-4 bg-muted/50 rounded-lg">
            <Input
              value={newMeal}
              onChange={(e) => setNewMeal(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddMeal()}
              placeholder="اسم الوجبة..."
              className="flex-1"
              data-testid="input-meal-name"
            />
            <Button onClick={handleAddMeal} data-testid="button-save-meal">
              حفظ
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <span className="font-semibold">السعرات اليومية</span>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold">{totalCalories}</span>
              <span className="text-muted-foreground"> / {targetCalories}</span>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground">
            متبقي {targetCalories - totalCalories} سعرة حرارية
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            الوجبات اليوم
            <Badge variant="secondary" className="text-xs">{entries.length}</Badge>
          </h4>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate"
                data-testid={`meal-${entry.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Apple className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">{entry.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Flame className="h-3 w-3" />
                    {entry.calories}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">بروتين</p>
            <p className="text-lg font-bold text-primary">45g</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">كربوهيدرات</p>
            <p className="text-lg font-bold text-primary">180g</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">دهون</p>
            <p className="text-lg font-bold text-primary">35g</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
