export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  const json = (await res.json()) as { success: boolean; data?: T; error?: string; code?: string };
  if (!json.success) {
    throw new ApiError(json.error ?? "שגיאה לא ידועה", json.code, res.status);
  }
  return json.data as T;
};
