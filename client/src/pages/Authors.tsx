import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PenSquare, Users, ArrowLeft, GraduationCap, Building2 } from "lucide-react";
import type { Author } from "@shared/schema";

export default function Authors() {
  const { data: authors, isLoading } = useQuery<Author[]>({
    queryKey: ["/api/authors"],
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">كتّاب كبسولة</h1>
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">
          أطباء ومختصون يساهمون بمحتوى موثوق في الصحة والتغذية والوعي الطبي.
        </p>
        <Link href="/authors/register">
          <Button size="lg" data-testid="button-join-authors">
            <PenSquare className="h-4 w-4 ml-2" />
            انضم كاتباً معنا
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : !authors || authors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">لا يوجد كتّاب معتمدون بعد.</p>
            <Link href="/authors/register">
              <Button variant="outline" data-testid="button-be-first">كن أول كاتب</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map((a) => (
            <Link key={a.id} href={`/authors/${a.slug}`}>
              <Card className="hover-elevate cursor-pointer h-full" data-testid={`author-card-${a.id}`}>
                <CardContent className="p-5 text-center">
                  <div className="mx-auto h-20 w-20 rounded-full overflow-hidden bg-muted mb-3 ring-2 ring-primary/20">
                    {a.profileImageUrl ? (
                      <img src={a.profileImageUrl} alt={a.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                        {a.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-base mb-1" data-testid={`text-author-name-${a.id}`}>{a.fullName}</h3>
                  <Badge variant="secondary" className="mb-2 text-xs">{a.specialty}</Badge>
                  {a.jobTitle && (
                    <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      <GraduationCap className="h-3 w-3" />{a.jobTitle}
                    </p>
                  )}
                  {a.organization && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Building2 className="h-3 w-3" />{a.organization}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
