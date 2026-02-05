import { useState } from "react";
import { AlertCircle, CheckCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: number;
  text: string;
  options: string[];
}

export default function SymptomChecker() {
  // todo: remove mock functionality
  const questions: Question[] = [
    {
      id: 1,
      text: "ما هي الأعراض التي تعاني منها؟",
      options: ["صداع", "حمى", "سعال", "ألم في البطن"],
    },
    {
      id: 2,
      text: "منذ متى بدأت الأعراض؟",
      options: ["أقل من يوم", "1-3 أيام", "أكثر من 3 أيام", "أكثر من أسبوع"],
    },
    {
      id: 3,
      text: "ما مدى شدة الأعراض؟",
      options: ["خفيفة", "متوسطة", "شديدة", "شديدة جداً"],
    },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  const handleAnswer = (answer: string) => {
    console.log("Selected answer:", answer);
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers([]);
    setCompleted(false);
  };

  const progress = ((currentStep + (completed ? 1 : 0)) / questions.length) * 100;

  if (completed) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full p-3 bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">نتيجة الفحص</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-primary">توصيات أولية</h3>
            <p className="text-base leading-relaxed">
              بناءً على الأعراض التي ذكرتها، ننصحك بما يلي:
            </p>
            <ul className="space-y-2 mr-4">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                <span>مراقبة الأعراض بعناية خلال الـ 24-48 ساعة القادمة</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                <span>الحصول على قسط كافٍ من الراحة</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                <span>شرب السوائل بكثرة</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-amber-900 dark:text-amber-200">تنبيه مهم</p>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                هذا التقييم لا يغني عن استشارة طبيب مختص. إذا ساءت الأعراض أو استمرت، يرجى مراجعة الطبيب فوراً.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleReset} variant="outline" className="flex-1 gap-2" data-testid="button-restart">
              <RotateCcw className="h-4 w-4" />
              فحص جديد
            </Button>
            <Button className="flex-1 gap-2" data-testid="button-consult">
              <ArrowRight className="h-4 w-4" />
              حجز موعد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentStep];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-3 bg-primary/10">
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">فاحص الأعراض</CardTitle>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">السؤال {currentStep + 1} من {questions.length}</span>
              <Badge variant="secondary">{Math.round(progress)}%</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.text}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, idx) => (
              <Button
                key={idx}
                onClick={() => handleAnswer(option)}
                variant="outline"
                className="h-auto py-4 px-6 text-base font-normal justify-start hover-elevate"
                data-testid={`option-${idx}`}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {answers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">إجاباتك السابقة:</p>
            <div className="flex flex-wrap gap-2">
              {answers.map((answer, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {answer}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
