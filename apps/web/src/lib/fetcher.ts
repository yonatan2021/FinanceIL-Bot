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
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ApiError("שגיאת רשת — בדוק את החיבור", "NETWORK_ERROR");
  }

  let json: { success: boolean; data?: T; error?: string; code?: string };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new ApiError(`השרת החזיר תגובה לא תקינה (${res.status})`, "INVALID_RESPONSE", res.status);
  }

  if (!json.success) {
    throw new ApiError(json.error ?? "שגיאה לא ידועה", json.code, res.status);
  }
  return json.data as T;
};
