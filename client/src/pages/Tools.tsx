import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SymptomChecker } from "@/components/SymptomChecker";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Lock, Plus } from "lucide-react";
import { useCreateHealthLog, useHealthLogs } from "@/hooks/use-health-tools";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function NutritionLogger() {
  const { mutate, isPending } = useCreateHealthLog();
  const { toast } = useToast();
  const [type, setType] = useState("nutrition");
  const [val, setVal] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val) return;

    mutate({
      type: type as any,
      data: { value: val, note },
      date: new Date().toISOString()
    }, {
      onSuccess: () => {
        toast({ title: "Log saved", description: "Your health log has been recorded." });
        setVal("");
        setNote("");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Health Data</CardTitle>
        <CardDescription>Keep track of your vitals and nutrition.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nutrition">Nutrition (Calories)</SelectItem>
                  <SelectItem value="vitals">Weight (kg)</SelectItem>
                  <SelectItem value="general">Water Intake (ml)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input 
                type="number" 
                placeholder="e.g. 500" 
                value={val} 
                onChange={e => setVal(e.target.value)} 
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input 
              placeholder="e.g. Lunch" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Save Log"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HealthCharts() {
  const { data: logs } = useHealthLogs();

  // Transform data for chart (filtering for just one type for demo simplicity)
  const chartData = logs
    ?.filter(l => l.type === 'vitals' || l.type === 'nutrition')
    .map(l => ({
      date: format(new Date(l.date), 'MM/dd'),
      value: Number((l.data as any).value),
      type: l.type
    }))
    .slice(0, 7); // Last 7 entries

  if (!logs?.length) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
        <p>No health data logged yet.</p>
        <p className="text-sm">Start logging to see trends.</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(210 100% 50%)" 
            strokeWidth={3} 
            dot={{ r: 4, strokeWidth: 2 }} 
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Tools() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-display font-bold mb-4">Health Tools Dashboard</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Interactive tools to help you monitor and understand your health better.
        </p>
      </div>

      <Tabs defaultValue="symptom-checker" className="w-full max-w-4xl mx-auto">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="symptom-checker" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Symptom Checker</TabsTrigger>
            <TabsTrigger value="tracker" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Health Tracker</TabsTrigger>
            <TabsTrigger value="bmi" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">BMI Calculator</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="symptom-checker">
          <div className="max-w-2xl mx-auto">
             <SymptomChecker />
          </div>
        </TabsContent>

        <TabsContent value="tracker">
          {isAuthenticated ? (
            <div className="grid gap-8">
              <NutritionLogger />
              <Card>
                <CardHeader>
                   <CardTitle>Recent Trends</CardTitle>
                   <CardDescription>Visualizing your recent health logs.</CardDescription>
                </CardHeader>
                <CardContent>
                   <HealthCharts />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-muted p-4 rounded-full">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Login Required</h3>
                  <p className="text-muted-foreground">Please log in to save and track your health data.</p>
                </div>
                <Button asChild className="mt-2">
                  <a href="/api/login">Log In to Access Tracker</a>
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bmi">
           <Card>
             <CardHeader><CardTitle>BMI Calculator</CardTitle></CardHeader>
             <CardContent>
               <div className="text-center py-8 text-muted-foreground">
                 Coming Soon: A smart BMI tool to check your body mass index.
               </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
