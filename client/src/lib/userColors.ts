import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type UserColors = {
  text_color: string;
  input_border_color: string;
  button_color: string;
  button_text_color: string;
};

const defaultColors: UserColors = {
  text_color: "#222222",
  input_border_color: "#cccccc",
  button_color: "#007bff",
  button_text_color: "#fff",
};

export function useUserColors() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const signedIn = status === "authenticated" && !!token;

  const [userColors, setUserColors] = useState<UserColors>(defaultColors);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/user/settings/`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch user settings"))
      .then(data => {
        setUserColors({
          text_color: data.text_color || defaultColors.text_color,
          input_border_color: data.input_border_color || defaultColors.input_border_color,
          button_color: data.button_color || defaultColors.button_color,
          button_text_color: data.button_text_color || defaultColors.button_text_color,
        });
      })
      .catch(e => setError(e.toString()))
      .finally(() => setLoading(false));
  }, [signedIn, API_BASE, token]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--user-text-color', userColors.text_color);
    root.style.setProperty('--user-input-border-color', userColors.input_border_color);
    root.style.setProperty('--user-button-color', userColors.button_color);
    root.style.setProperty('--user-button-text-color', userColors.button_text_color);
  }, [userColors]);

  return { userColors, setUserColors, loading, error };
}
