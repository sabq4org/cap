import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, AlertTriangle, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data for the Wizard
const STEPS = [
  {
    id: 1,
    question: "How long have you had these symptoms?",
    options: ["Less than 24 hours", "1-3 days", "About a week", "More than a week"],
  },
  {
    id: 2,
    question: "How severe is the pain/discomfort?",
    options: ["Mild (Manageable)", "Moderate (Uncomfortable)", "Severe (Interferes with daily life)", "Extreme (Unbearable)"],
  },
  {
    id: 3,
    question: "Do you have a fever?",
    options: ["No fever", "Low grade (99-100.4°F)", "High fever (>100.4°F)", "Unsure"],
  }
];

export function SymptomChecker() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [complete, setComplete] = useState(false);

  const currentQuestion = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleSelect = (value: string) => {
    setAnswers(prev => ({ ...prev, [step]: value }));
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      setComplete(true);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setComplete(false);
  };

  if (complete) {
    return (
      <Card className="border-l-4 border-l-primary shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Check className="h-6 w-6" />
            <h3 className="font-bold">Assessment Complete</h3>
          </div>
          <CardTitle>Initial Assessment</CardTitle>
          <CardDescription>Based on your responses:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3">
             <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
             <div className="text-sm text-yellow-800">
               <strong>Recommendation:</strong> Based on a duration of "{answers[0]}" and severity level "{answers[1]}", we recommend monitoring your symptoms. If they worsen, consult a physician.
             </div>
           </div>
           <p className="text-sm text-muted-foreground">
             This is a demonstration tool and does not provide actual medical advice.
           </p>
        </CardContent>
        <CardFooter>
          <Button onClick={reset} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Start Over
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-lg border-t-4 border-t-primary">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
           <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step {step + 1} of {STEPS.length}</span>
           <span className="text-xs font-medium text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="mt-4 text-xl">{currentQuestion.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <RadioGroup value={answers[step]} onValueChange={handleSelect} className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div key={option} className="flex items-center space-x-3 border p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer font-medium">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </motion.div>
        </AnimatePresence>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleNext} 
          disabled={!answers[step]} 
          className="w-full"
        >
          {step === STEPS.length - 1 ? "Get Results" : "Next Question"}
        </Button>
      </CardFooter>
    </Card>
  );
}
