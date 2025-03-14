import { useQuery } from "@tanstack/react-query";

interface User {
  address: string;
  privateKey:string;
}

export const useUserQuery = (address: string | undefined) => {
  return useQuery<User>({
    queryKey: ["user", address],
    queryFn: async () => {
      if (!address) throw new Error("Address is required");
      
      try {
        const response = await fetch(`/api/user?address=${address}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        return response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch user data");
      }
    },
    enabled: !!address, // Only run query when address is available
  });
};
