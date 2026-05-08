import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, GraduationCap, Building2, Briefcase, Calendar, Globe, Linkedin, Twitter, Mail, Users } from "lucide-react";
import type { Author } from "@shared/schema";

export default function AuthorProfile() {
  const { slug } = useParams<{ slug: string }>();

  const { data: author, isLoading, error } = useQuery<Author>({
    queryKey: [`/api/authors/${slug}`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <h2 className="text-2xl font-bold mb-3">الكاتب غير موجود</h2>
        <Link href="/authors"><Button variant="outline">عودة لقائمة الكتّاب</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/authors">
        <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-authors">
          <ArrowLeft className="h-4 w-4 ml-2" />كل الكتّاب
        </Button>
      </Link>

      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-right">
            <div className="h-32 w-32 shrink-0 rounded-full overflow-hidden bg-muted ring-4 ring-primary/20">
              {author.profileImageUrl ? (
                <img src={author.profileImageUrl} alt={author.fullName} className="h-full w-full object-cover" data-testid="img-author-profile" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-4xl">
                  {author.fullName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-author-name">{author.fullName}</h1>
              <Badge className="mb-3">{author.specialty}</Badge>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line" data-testid="text-author-bio">{author.bio}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-8 pt-6 border-t">
            {author.jobTitle && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">المسمى:</span>
                <span className="font-medium">{author.jobTitle}</span>
              </div>
            )}
            {author.qualification && (
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">المؤهل:</span>
                <span className="font-medium">{author.qualification}</span>
              </div>
            )}
            {author.organization && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">جهة العمل:</span>
                <span className="font-medium">{author.organization}</span>
              </div>
            )}
            {author.yearsExperience != null && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">الخبرة:</span>
                <span className="font-medium">{author.yearsExperience} سنة</span>
              </div>
            )}
          </div>

          {(author.twitterUrl || author.linkedinUrl || author.websiteUrl) && (
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t justify-center md:justify-start">
              {author.twitterUrl && (
                <a href={author.twitterUrl} target="_blank" rel="noreferrer noopener" data-testid="link-twitter">
                  <Button variant="outline" size="sm"><Twitter className="h-4 w-4 ml-2" />تويتر</Button>
                </a>
              )}
              {author.linkedinUrl && (
                <a href={author.linkedinUrl} target="_blank" rel="noreferrer noopener" data-testid="link-linkedin">
                  <Button variant="outline" size="sm"><Linkedin className="h-4 w-4 ml-2" />لينكدإن</Button>
                </a>
              )}
              {author.websiteUrl && (
                <a href={author.websiteUrl} target="_blank" rel="noreferrer noopener" data-testid="link-website">
                  <Button variant="outline" size="sm"><Globe className="h-4 w-4 ml-2" />الموقع</Button>
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
