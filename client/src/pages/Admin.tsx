import { useAuth } from "@/hooks/use-auth";
import { useCreateArticle, useCategories } from "@/hooks/use-articles";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const { mutate: createArticle, isPending } = useCreateArticle();
  const { data: categories } = useCategories();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    summary: "",
    imageUrl: "",
    categoryId: "",
    status: "draft"
  });

  if (!isAuthenticated) {
     window.location.href = "/api/login";
     return null;
  }

  // Simplified admin check: In real app check role. 
  // For now, if logged in, you can see this (as per instructions "simple auth for now")
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createArticle({
       ...formData,
       categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
       status: formData.status as "draft" | "published",
       slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-') // Auto slug
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Article created successfully" });
        setLocation("/articles");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container py-12 px-4 max-w-4xl">
       <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage content and platform settings.</p>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
             Admin Access
          </div>
       </div>

       <div className="grid gap-8">
          <Card>
             <CardHeader>
                <CardTitle>Create New Article</CardTitle>
                <CardDescription>Publish a new health article to the platform.</CardDescription>
             </CardHeader>
             <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label>Title</Label>
                         <Input 
                           value={formData.title} 
                           onChange={(e) => handleChange("title", e.target.value)} 
                           required 
                           placeholder="e.g. Benefits of Vitamin D"
                         />
                      </div>
                      <div className="space-y-2">
                         <Label>Slug (URL)</Label>
                         <Input 
                           value={formData.slug} 
                           onChange={(e) => handleChange("slug", e.target.value)} 
                           placeholder="benefits-of-vitamin-d"
                         />
                      </div>
                   </div>

                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label>Category</Label>
                         <Select onValueChange={(v) => handleChange("categoryId", v)}>
                            <SelectTrigger>
                               <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                               {categories?.map(c => (
                                 <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                               ))}
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-2">
                         <Label>Status</Label>
                         <Select defaultValue="draft" onValueChange={(v) => handleChange("status", v)}>
                            <SelectTrigger>
                               <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="draft">Draft</SelectItem>
                               <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <Label>Image URL (Optional)</Label>
                      <Input 
                         value={formData.imageUrl} 
                         onChange={(e) => handleChange("imageUrl", e.target.value)} 
                         placeholder="https://images.unsplash.com/..."
                      />
                   </div>

                   <div className="space-y-2">
                      <Label>Summary (Short description)</Label>
                      <Textarea 
                         value={formData.summary} 
                         onChange={(e) => handleChange("summary", e.target.value)} 
                         rows={2}
                      />
                   </div>

                   <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea 
                         value={formData.content} 
                         onChange={(e) => handleChange("content", e.target.value)} 
                         rows={10}
                         required
                         className="font-mono text-sm"
                         placeholder="Article content goes here..."
                      />
                   </div>

                   <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                      {isPending ? "Publishing..." : "Create Article"}
                   </Button>
                </form>
             </CardContent>
          </Card>
       </div>
    </div>
  );
}
