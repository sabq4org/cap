import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateArticleRequest, type UpdateArticleRequest } from "@shared/routes";
import { z } from "zod";

// Fetch all articles
export function useArticles(filters?: { category?: string; featured?: boolean; limit?: number }) {
  // Convert boolean/number to string for query params as needed or rely on robust backend handling
  // The schema expects input to be strings for query params in some setups, but here we pass clean object
  return useQuery({
    queryKey: [api.articles.list.path, filters],
    queryFn: async () => {
      const url = new URL(window.location.origin + api.articles.list.path);
      if (filters?.category) url.searchParams.append("category", filters.category);
      if (filters?.featured !== undefined) url.searchParams.append("featured", String(filters.featured));
      if (filters?.limit) url.searchParams.append("limit", String(filters.limit));

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch articles");
      return api.articles.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single article by slug
export function useArticle(slug: string) {
  return useQuery({
    queryKey: [api.articles.get.path, slug],
    enabled: !!slug,
    queryFn: async () => {
      const url = buildUrl(api.articles.get.path, { slug });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch article");
      return api.articles.get.responses[200].parse(await res.json());
    },
  });
}

// Create article
export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateArticleRequest) => {
      // Validate before sending
      const validated = api.articles.create.input.parse(data);
      const res = await fetch(api.articles.create.path, {
        method: api.articles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
         if (res.status === 400) {
           const err = api.articles.create.responses[400].parse(await res.json());
           throw new Error(err.message);
         }
         if (res.status === 401) throw new Error("Unauthorized");
         throw new Error("Failed to create article");
      }
      return api.articles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
    },
  });
}

// Update article
export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateArticleRequest) => {
      const validated = api.articles.update.input.parse(updates);
      const url = buildUrl(api.articles.update.path, { id });
      const res = await fetch(url, {
        method: api.articles.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update article");
      return api.articles.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.articles.get.path] }); // Invalidate detail views
    },
  });
}

// Fetch categories
export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.categories.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}
