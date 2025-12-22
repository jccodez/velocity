import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (isMounted) {
            setUser(user);
            setLoading(false);
            setError(null);
          }
        },
        (error) => {
          console.error("Auth state error:", error);
          if (isMounted) {
            setError(error);
            setLoading(false);
          }
        }
      );

      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (isMounted) {
          console.warn("Auth check timed out");
          setLoading(false);
        }
      }, 5000);

      return () => {
        isMounted = false;
        unsubscribe();
        clearTimeout(timeout);
      };
    } catch (error) {
      console.error("useAuth error:", error);
      if (isMounted) {
        setError(error as Error);
        setLoading(false);
      }
    }
  }, []);

  return { user, loading, error };
};

