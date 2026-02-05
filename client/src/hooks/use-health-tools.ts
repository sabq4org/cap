import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateHealthLogRequest, type CreateChatMessageRequest } from "@shared/routes";

// --- Health Logs ---

export function useHealthLogs() {
  return useQuery({
    queryKey: [api.healthLogs.list.path],
    queryFn: async () => {
      const res = await fetch(api.healthLogs.list.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch health logs");
      return api.healthLogs.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateHealthLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateHealthLogRequest) => {
      const validated = api.healthLogs.create.input.parse(data);
      const res = await fetch(api.healthLogs.create.path, {
        method: api.healthLogs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save health log");
      return api.healthLogs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.healthLogs.list.path] });
    },
  });
}

// --- Chat ---

export function useChatHistory() {
  return useQuery({
    queryKey: [api.chat.history.path],
    queryFn: async () => {
      const res = await fetch(api.chat.history.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch chat history");
      return api.chat.history.responses[200].parse(await res.json());
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(api.chat.send.path, {
        method: api.chat.send.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.chat.send.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chat.history.path] });
    },
  });
}
